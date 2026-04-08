import mongoose from "mongoose";
import crypto   from "crypto";
import { decodeFileTree } from "../utils/fileTree.js";

const fileEntrySchema = new mongoose.Schema(
  { content: { type: String, default: "" }, lang: { type: String, default: "plaintext" } },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    sender:         { type: String, required: true },
    senderUsername: { type: String, default: "" },
    message:        { type: String, required: true },
    isAI:           { type: Boolean, default: false },
    timestamp:      { type: Date, default: Date.now },
  },
  { _id: false }
);

const fileTreeSchema = new mongoose.Schema({}, { _id: false, strict: false });

const projectSchema = new mongoose.Schema(
  {
    name:   { type: String, lowercase: true, unique: true, required: true, trim: true },
    users:  [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    inviteCode: {
      type: String, unique: true,
      default: () => crypto.randomBytes(10).toString("hex"),
    },

    // ── Persistent file tree ────────────────────────────────────────────────
    // Keys = file paths like "src/App.jsx" or "package.json"
    // Values = { content, lang }
    fileTree: { type: fileTreeSchema, default: {} },

    // ── Chat messages (capped at 500 in socket handler) ─────────────────────
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

projectSchema.set("toJSON", {
  transform(_doc, ret) {
    ret.fileTree = decodeFileTree(ret.fileTree || {});
    return ret;
  },
});

export default mongoose.model("Project", projectSchema);
