import mongoose from "mongoose";
import crypto from "crypto";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String, lowercase: true, unique: true, required: true, trim: true,
    },
    users:  [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    inviteCode: {
      type: String, unique: true,
      default: () => crypto.randomBytes(10).toString("hex"),
    },

    // Persistent file system — stores every file the project has ever created
    // { "src/App.jsx": { content: "...", lang: "javascript" }, ... }
    fileTree: {
      type: Map,
      of: new mongoose.Schema({ content: { type: String, default: "" }, lang: { type: String, default: "plaintext" } }, { _id: false }),
      default: {},
    },

    sharedCode: { type: String, default: "// Start coding here...\n" },
    language:   { type: String, enum: ["javascript","typescript","python","java","cpp","c","go","rust","php","ruby","swift","kotlin","bash","html","css","json","sql","plaintext"], default: "javascript" },
    lastRunOutput: { type: String, default: "" },
    lastRunAt:     { type: Date },

    messages: {
      type: [{
        sender:         { type: String, required: true },
        senderUsername: { type: String, default: "" },
        message:        { type: String, required: true },
        isAI:           { type: Boolean, default: false },
        timestamp:      { type: Date, default: Date.now },
      }],
      default: [],
    },
  },
  { timestamps: true }
);

const Project = mongoose.model("project", projectSchema);
export default Project;