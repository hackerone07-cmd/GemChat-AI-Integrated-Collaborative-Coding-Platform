import { Router }  from "express";
import { body, param } from "express-validator";
import * as C from "../controllers/Project.controller.js";
import * as auth from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();
const mongoId = (field) => param(field).isMongoId().withMessage(`Invalid ${field}`);

// ── Create ─────────────────────────────────────────────────────────────────
router.post("/create", auth.authUser,
  body("name").isString().notEmpty().withMessage("name required"),
  validate, C.createProject);

// ── List all for current user ───────────────────────────────────────────────
router.get("/all", auth.authUser, C.getAllProject);

// ── Get single project ─────────────────────────────────────────────────────
router.get("/get-project/:projectId", auth.authUser,
  mongoId("projectId"), validate, C.getProjectById);

// ── Delete (admin only) ────────────────────────────────────────────────────
router.delete("/:projectId", auth.authUser,
  mongoId("projectId"), validate, C.deleteProject);

// ── Add users ──────────────────────────────────────────────────────────────
router.put("/add-user", auth.authUser,
  body("projectId").notEmpty(),
  body("users").isArray({ min: 1 }),
  validate, C.addUserProject);

// ── Remove member (admin only) ─────────────────────────────────────────────
router.delete("/:projectId/members/:targetUserId", auth.authUser,
  mongoId("projectId"), mongoId("targetUserId"), validate, C.removeMember);

// ── Exit project ────────────────────────────────────────────────────────────
router.post("/:projectId/exit", auth.authUser,
  mongoId("projectId"), validate, C.exitProject);

// ── Promote to admin ────────────────────────────────────────────────────────
router.put("/:projectId/promote/:targetUserId", auth.authUser,
  mongoId("projectId"), mongoId("targetUserId"), validate, C.promoteToAdmin);

// ── Join via invite code ────────────────────────────────────────────────────
router.post("/join", auth.authUser,
  body("inviteCode").notEmpty().withMessage("inviteCode required"),
  validate, C.joinProjectByCode);

// ── Regenerate invite code ──────────────────────────────────────────────────
router.post("/regenerate-invite/:projectId", auth.authUser,
  mongoId("projectId"), validate, C.regenerateInviteCode);

// ── FILE TREE PERSISTENCE ───────────────────────────────────────────────────
// PUT   /:projectId/files            → replace entire tree
// PATCH /:projectId/files/:path      → upsert one file
// DELETE/:projectId/files/:path      → delete file or dir

router.put("/:projectId/files", auth.authUser,
  mongoId("projectId"), validate, C.saveFileTree);

router.patch("/:projectId/files/:encodedPath", auth.authUser,
  mongoId("projectId"), validate, C.saveOneFile);

router.delete("/:projectId/files/:encodedPath", auth.authUser,
  mongoId("projectId"), validate, C.deleteFileFromTree);

export default router;