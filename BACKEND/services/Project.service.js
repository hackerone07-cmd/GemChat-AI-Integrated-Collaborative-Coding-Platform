import mongoose    from "mongoose";
import ProjectModel from "../models/Project.model.js";

// ── Create a new project ─────────────────────────────────────────────────────
export const createProject = async ({ name, userId }) => {
  if (!name)   throw new Error("name is required");
  if (!userId) throw new Error("userId is required");
  try {
    // Creator becomes first member and first admin
    return await ProjectModel.create({ name, users: [userId], admins: [userId] });
  } catch (err) {
    if (err.code === 11000) throw new Error("A project with that name already exists");
    throw err;
  }
};

// ── Get all projects for a user ───────────────────────────────────────────────
export const getAllProjectByUserId = async ({ userId }) => {
  if (!userId) throw new Error("userId is required");
  return ProjectModel.find({ users: userId }).select("-fileTree -messages").lean();
};

// ── Add users to project ──────────────────────────────────────────────────────
export const addUserToProject = async ({ projectId, users, userId }) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) throw new Error("Invalid projectId");
  const project = await ProjectModel.findOne({ _id: projectId, users: userId });
  if (!project) throw new Error("Not a member of this project");
  return ProjectModel.findByIdAndUpdate(
    projectId,
    { $addToSet: { users: { $each: users } } },
    { new: true }
  ).populate("users", "_id email username");
};

// ── Join by invite code ───────────────────────────────────────────────────────
export const joinProjectByInviteCode = async ({ inviteCode, userId }) => {
  const project = await ProjectModel.findOne({ inviteCode: inviteCode.trim() });
  if (!project) throw new Error("Invalid invite code");
  if (project.users.some(u => u.toString() === userId.toString())) return project;
  return ProjectModel.findByIdAndUpdate(
    project._id,
    { $addToSet: { users: userId } },
    { new: true }
  ).populate("users", "_id email username");
};

// ── Get project by ID ─────────────────────────────────────────────────────────
export const getProjectByIdIn = async ({ projectId }) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) throw new Error("Invalid projectId");
  return ProjectModel.findById(projectId)
    .populate("users",  "_id email username")
    .populate("admins", "_id email username");
};

// ── Delete project ────────────────────────────────────────────────────────────
export const deleteProject = async ({ projectId, userId }) => {
  const project = await ProjectModel.findById(projectId);
  if (!project) throw new Error("Project not found");
  const isAdmin = project.admins?.some(a => a.toString() === userId.toString());
  if (!isAdmin) throw Object.assign(new Error("Admin only"), { status: 403 });
  await project.deleteOne();
};