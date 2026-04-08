import "dotenv/config";
import http       from "http";
import app        from "./app.js";
import { Server } from "socket.io";
import jwt        from "jsonwebtoken";
import mongoose   from "mongoose";
import ProjectModel from "./models/Project.model.js";
import UserModel    from "./models/user.model.js";
import { generateResult } from "./services/ai.service.js";
import {
  decodeFileKey,
  encodeFileKey,
  normalizeFileEntry,
} from "./utils/fileTree.js";

const port   = process.env.PORT || 3000;
const server = http.createServer(app);

// ─────────────────────────────────────────────────────────
// Socket.IO
// ─────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  maxHttpBufferSize: 5e6, // 5 MB — allow large file payloads
});

// ── Auth middleware ──────────────────────────────────────
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token
      || socket.handshake.headers["authorization"]?.split(" ")[1];
    const projectId = socket.handshake.query?.projectId;

    if (!token) return next(new Error("No token"));
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId))
      return next(new Error("Invalid projectId"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Re-fetch user from DB so _id, email, username are always fresh
    const user = await UserModel.findById(decoded._id).select("_id email username");
    if (!user) return next(new Error("User not found"));

    const project = await ProjectModel.findById(projectId)
      .populate("users", "_id email username")
      .populate("admins", "_id");
    if (!project) return next(new Error("Project not found"));

    const isMember = project.users.some(u => u._id.toString() === user._id.toString());
    if (!isMember) return next(new Error("Access denied"));

    socket.user       = { _id: user._id.toString(), email: user.email, username: user.username || user.email.split("@")[0] };
    socket.projectId  = projectId;
    socket.projectDoc = project;
    next();
  } catch (err) {
    next(new Error("Auth failed: " + err.message));
  }
});

// ── Helper: build member list ────────────────────────────
const buildMembers = (users) =>
  users.map(u => ({ _id: u._id.toString(), email: u.email, username: u.username || u.email.split("@")[0] }));

const withFileTree = (project) => ({ ...(project.fileTree || {}) });

// ── Helper: persist one file to DB ──────────────────────
const persistFile = async (projectId, path, content, lang) => {
  const project = await ProjectModel.findById(projectId);
  if (!project) return;
  const encodedPath = encodeFileKey(path);
  project.fileTree = {
    ...withFileTree(project),
    [encodedPath]: normalizeFileEntry({ content, lang }),
  };
  project.markModified("fileTree");
  await project.save();
};

// ── Helper: delete file(s) from DB ──────────────────────
const deleteFromTree = async (projectId, path, type) => {
  const project = await ProjectModel.findById(projectId);
  if (!project) return;
  const nextTree = withFileTree(project);
  if (type === "dir") {
    for (const encodedKey of Object.keys(nextTree)) {
      const decodedPath = decodeFileKey(encodedKey);
      if (decodedPath === path || decodedPath.startsWith(path + "/")) delete nextTree[encodedKey];
    }
  } else {
    delete nextTree[encodeFileKey(path)];
  }
  project.fileTree = nextTree;
  project.markModified("fileTree");
  await project.save();
};

// ─────────────────────────────────────────────────────────
// Connection handler
// ─────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  socket.join(socket.projectId);
  console.log(`✅ ${socket.user.username} joined ${socket.projectId}`);

  // ── Send initial state to the new client ──────────────
  socket.emit("message-history", socket.projectDoc.messages.slice(-100));
  socket.emit("members-list",    buildMembers(socket.projectDoc.users));

  // Announce arrival to everyone else
  socket.broadcast.to(socket.projectId).emit("user-connected", { user: socket.user });

  // ── Chat ─────────────────────────────────────────────
  socket.on("project-message", async (data) => {
    const { message } = data;
    if (!message?.trim()) return;

    const msgDoc = {
      sender:         socket.user.email,
      senderUsername: socket.user.username,
      message:        message.trim(),
      isAI:           false,
      timestamp:      new Date(),
    };

    // Persist (cap at 500)
    await ProjectModel.findByIdAndUpdate(socket.projectId, {
      $push: { messages: { $each: [msgDoc], $slice: -500 } },
    }).catch(() => {});

    const isAI = message.toLowerCase().includes("@ai");

    if (isAI) {
      try {
        const prompt = message.replace(/@ai/gi, "").trim();
        const raw    = await generateResult(prompt);
        let parsed;
        try { parsed = JSON.parse(raw); } catch { parsed = { text: raw }; }

        const aiMsg = {
          sender: "AI Assistant", senderUsername: "AI Assistant",
          message: raw, isAI: true, timestamp: new Date(),
        };
        await ProjectModel.findByIdAndUpdate(socket.projectId, {
          $push: { messages: { $each: [aiMsg], $slice: -500 } },
        }).catch(() => {});

        io.to(socket.projectId).emit("project-message", {
          ...aiMsg, timestamp: aiMsg.timestamp.toISOString(),
        });

        // If AI produced files → persist each file and broadcast
        if (parsed?.fileTree) {
          const project = await ProjectModel.findById(socket.projectId);
          if (project) {
            const nextTree = withFileTree(project);
            for (const [filename, node] of Object.entries(parsed.fileTree)) {
              const content = node?.file?.contents ?? "";
              const lang    = filename.split(".").pop() || "plaintext";
              nextTree[encodeFileKey(filename)] = normalizeFileEntry({ content, lang });
              io.to(socket.projectId).emit("file-created", { path: filename, content, lang });
            }
            project.fileTree = nextTree;
            project.markModified("fileTree");
            await project.save();
          }
        }
      } catch (err) {
        socket.emit("project-message", {
          message: "⚠️ AI error: " + err.message,
          sender: "System", senderUsername: "System",
          isAI: false, timestamp: new Date().toISOString(),
        });
      }
    } else {
      // Regular message — broadcast to everyone else
      socket.broadcast.to(socket.projectId).emit("project-message", {
        ...msgDoc, timestamp: msgDoc.timestamp.toISOString(),
      });
    }
  });

  // ── Code change (per-file) ────────────────────────────
  socket.on("code-change", async ({ filename, code, language }) => {
    if (!filename) return;
    // Broadcast to other members
    socket.broadcast.to(socket.projectId).emit("code-update", {
      filename, code, language,
      updatedBy: socket.user.username,
      timestamp: new Date().toISOString(),
    });
    // Persist asynchronously — fire and forget
    persistFile(socket.projectId, filename, code ?? "", language ?? "plaintext");
  });

  // ── File created ──────────────────────────────────────
  socket.on("file-created", async ({ path, content, lang }) => {
    socket.broadcast.to(socket.projectId).emit("file-created", { path, content, lang });
    persistFile(socket.projectId, path, content ?? "", lang ?? "plaintext");
  });

  // ── File deleted ──────────────────────────────────────
  socket.on("file-deleted", async ({ path, type }) => {
    socket.broadcast.to(socket.projectId).emit("file-deleted", { path, type });
    deleteFromTree(socket.projectId, path, type ?? "file");
  });

  // ── File renamed ──────────────────────────────────────
  socket.on("file-renamed", async ({ oldPath, newPath, type }) => {
    socket.broadcast.to(socket.projectId).emit("file-renamed", { oldPath, newPath, type });
    // Load → rename keys → save
    const project = await ProjectModel.findById(socket.projectId);
    if (!project) return;
    const nextTree = withFileTree(project);
    const oldEncodedPath = encodeFileKey(oldPath);
    const newEncodedPath = encodeFileKey(newPath);
    if (type === "file") {
      const v = nextTree[oldEncodedPath];
      if (v) {
        nextTree[newEncodedPath] = v;
        delete nextTree[oldEncodedPath];
      }
    } else {
      for (const encodedKey of Object.keys(nextTree)) {
        const actualPath = decodeFileKey(encodedKey);
        if (actualPath?.startsWith(oldPath + "/")) {
          const renamedPath = actualPath.replace(oldPath, newPath);
          nextTree[encodeFileKey(renamedPath)] = nextTree[encodedKey];
          delete nextTree[encodedKey];
        }
      }
    }
    project.fileTree = nextTree;
    project.markModified("fileTree");
    await project.save().catch(() => {});
  });

  // ── Cursor position (broadcast only, not persisted) ───
  socket.on("cursor-move", ({ filename, line, col }) => {
    socket.broadcast.to(socket.projectId).emit("cursor-move", {
      email:    socket.user.email,
      username: socket.user.username,
      filename, line, col,
    });
  });

  // ── Disconnect ────────────────────────────────────────
  socket.on("disconnect", () => {
    console.log(`❌ ${socket.user.username} left ${socket.projectId}`);
    socket.leave(socket.projectId);
    socket.broadcast.to(socket.projectId).emit("user-disconnected", { user: socket.user });
  });
});

export { io };
server.listen(port, () => console.log(`🚀 Server on port ${port}`));
