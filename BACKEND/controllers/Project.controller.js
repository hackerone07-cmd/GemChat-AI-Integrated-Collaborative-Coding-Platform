import ProjectModel from "../models/Project.model.js";
import UserModel    from "../models/user.model.js";
import * as svc     from "../services/Project.service.js";
import { io }       from "../server.js";
import {
  decodeFileKey,
  encodeFileKey,
  encodeFileTree,
  normalizeFileEntry,
} from "../utils/fileTree.js";

// ── Resolve logged-in user ────────────────────────────────────────────────────
// FIX: old JWTs only had { email }, new ones have { _id, email, username }.
// Support both so users don't get logged out after the upgrade.
const getMe = async (req) => {
  if (req.user?._id) {
    const user = await UserModel.findById(req.user._id);
    if (user) return user;
  }
  // Fallback: look up by email for old tokens
  if (req.user?.email) {
    const user = await UserModel.findOne({ email: req.user.email });
    if (user) return user;
  }
  throw Object.assign(new Error("User not found"), { status: 401 });
};

// ── Member / admin guards ─────────────────────────────────────────────────────
// FIX: after populate(), project.users contains full documents.
// Use (u._id || u).toString() so it works for BOTH ObjectIds and populated docs.
const assertMember = (project, userId) => {
  const uid = userId.toString();
  const ok  = project.users.some(u => (u._id ?? u).toString() === uid);
  if (!ok) throw Object.assign(new Error("Access denied"), { status: 403 });
};

const assertAdmin = (project, userId) => {
  const uid = userId.toString();
  const ok  = project.admins?.some(a => (a._id ?? a).toString() === uid);
  if (!ok) throw Object.assign(new Error("Admin only"), { status: 403 });
};

// ── POST /projects/create ─────────────────────────────────────────────────────
export const createProject = async (req, res) => {
  try {
    const me      = await getMe(req);
    const project = await svc.createProject({ name: req.body.name, userId: me._id });
    res.status(201).json({ project });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
};

// ── GET /projects/all ─────────────────────────────────────────────────────────
export const getAllProject = async (req, res) => {
  try {
    const me       = await getMe(req);
    const projects = await svc.getAllProjectByUserId({ userId: me._id });
    res.status(200).json({ projects });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
};

// ── GET /projects/get-project/:projectId ──────────────────────────────────────
export const getProjectById = async (req, res) => {
  try {
    const me      = await getMe(req);
    const project = await ProjectModel.findById(req.params.projectId)
      .populate("users",  "_id email username")
      .populate("admins", "_id email username");
    if (!project) return res.status(404).json({ error: "Project not found" });
    assertMember(project, me._id);
    res.status(200).json({ project });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
};

// ── DELETE /projects/:projectId ───────────────────────────────────────────────
export const deleteProject = async (req, res) => {
  try {
    const me      = await getMe(req);
    const project = await ProjectModel.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Not found" });
    assertAdmin(project, me._id);
    await project.deleteOne();
    io.to(req.params.projectId).emit("project-deleted", { projectId: req.params.projectId });
    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
};

// ── PUT /projects/add-user ────────────────────────────────────────────────────
export const addUserProject = async (req, res) => {
  try {
    const { projectId, users } = req.body;
    const me      = await getMe(req);
    const project = await svc.addUserToProject({ projectId, users, userId: me._id });
    res.status(200).json({ project });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ── DELETE /projects/:projectId/members/:targetUserId ────────────────────────
export const removeMember = async (req, res) => {
  try {
    const me      = await getMe(req);
    const project = await ProjectModel.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Not found" });
    assertAdmin(project, me._id);

    project.users  = project.users.filter(u => (u._id ?? u).toString() !== req.params.targetUserId);
    project.admins = project.admins.filter(a => (a._id ?? a).toString() !== req.params.targetUserId);
    await project.save();

    io.to(req.params.projectId).emit("member-removed", { userId: req.params.targetUserId });
    io.to(req.params.projectId).emit("kicked", { projectId: req.params.projectId, userId: req.params.targetUserId });
    res.status(200).json({ message: "Removed" });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
};

// ── POST /projects/:projectId/exit ────────────────────────────────────────────
export const exitProject = async (req, res) => {
  try {
    const me      = await getMe(req);
    const project = await ProjectModel.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Not found" });

    const myIdStr     = me._id.toString();
    const isLastAdmin = project.admins.some(a => (a._id ?? a).toString() === myIdStr)
      && project.admins.length === 1
      && project.users.length  > 1;
    if (isLastAdmin)
      return res.status(400).json({ error: "Transfer admin rights before leaving" });

    project.users  = project.users.filter(u => (u._id ?? u).toString() !== myIdStr);
    project.admins = project.admins.filter(a => (a._id ?? a).toString() !== myIdStr);
    await project.save();
    res.status(200).json({ message: "Left project" });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
};

// ── PUT /projects/:projectId/promote/:targetUserId ────────────────────────────
export const promoteToAdmin = async (req, res) => {
  try {
    const me      = await getMe(req);
    const project = await ProjectModel.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Not found" });
    assertAdmin(project, me._id);

    const targetId = req.params.targetUserId;
    if (!project.admins.some(a => (a._id ?? a).toString() === targetId)) {
      project.admins.push(targetId);
      await project.save();
    }
    io.to(req.params.projectId).emit("member-promoted", { userId: targetId });
    res.status(200).json({ message: "Promoted" });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
};

// ── POST /projects/join ───────────────────────────────────────────────────────
export const joinProjectByCode = async (req, res) => {
  try {
    const me      = await getMe(req);
    const project = await ProjectModel.findOne({ inviteCode: req.body.inviteCode.trim() });
    if (!project) return res.status(404).json({ error: "Invalid invite code" });

    if (!project.users.some(u => (u._id ?? u).toString() === me._id.toString())) {
      project.users.push(me._id);
      await project.save();
    }
    const populated = await project.populate("users", "_id email username");
    res.status(200).json({ project: populated });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
};

// ── POST /projects/regenerate-invite/:projectId ───────────────────────────────
export const regenerateInviteCode = async (req, res) => {
  try {
    const me      = await getMe(req);
    const project = await ProjectModel.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Not found" });
    assertAdmin(project, me._id);

    const { randomBytes } = await import("crypto");
    project.inviteCode = randomBytes(10).toString("hex");
    await project.save();
    res.status(200).json({ inviteCode: project.inviteCode });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
};

// ═══ FILE TREE PERSISTENCE ════════════════════════════════════════════════════

// ── PUT /projects/:projectId/files — replace entire fileTree ──────────────────
export const saveFileTree = async (req, res) => {
  try {
    const me      = await getMe(req);
    const project = await ProjectModel.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Not found" });
    assertMember(project, me._id);

    const { fileTree } = req.body;
    if (!fileTree || typeof fileTree !== "object")
      return res.status(400).json({ error: "fileTree object required" });

    project.fileTree = encodeFileTree(fileTree);
    project.markModified("fileTree");
    await project.save();
    res.status(200).json({ message: "Saved" });
  } catch (err) {
    console.error("saveFileTree error:", err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
};

// ── PATCH /projects/:projectId/files/:encodedPath — upsert one file ───────────
export const saveOneFile = async (req, res) => {
  try {
    const me      = await getMe(req);
    const project = await ProjectModel.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Not found" });
    assertMember(project, me._id);

    const path               = decodeURIComponent(req.params.encodedPath);
    const { content = "", lang = "plaintext" } = req.body;
    const encodedPath = encodeFileKey(path);
    project.fileTree = {
      ...(project.fileTree || {}),
      [encodedPath]: normalizeFileEntry({ content, lang }),
    };
    project.markModified("fileTree");
    await project.save();
    res.status(200).json({ message: "Saved" });
  } catch (err) {
    console.error("saveOneFile error:", err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
};

// ── DELETE /projects/:projectId/files/:encodedPath — remove file or dir ───────
export const deleteFileFromTree = async (req, res) => {
  try {
    const me      = await getMe(req);
    const project = await ProjectModel.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Not found" });
    assertMember(project, me._id);

    const path = decodeURIComponent(req.params.encodedPath);
    const type = req.query.type ?? "file";

    const nextTree = { ...(project.fileTree || {}) };
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
    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    console.error("deleteFileFromTree error:", err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
};
