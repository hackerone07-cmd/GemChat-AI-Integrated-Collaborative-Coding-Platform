import User from "../models/user.model.js";
import * as userService from "../services/user.service.js";
import redisClient from "../services/redis.service.js";

// ── Register ───────────────────────────────────────────────────────────────
export const createUserController = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    const user  = await userService.createUser({ email, password, username });
    const token = user.generateJWT();
    delete user._doc.password;
    res.status(201).json({ user, token });
  } catch (error) {
    console.error("Register error:", error);
    if (error.code === 11000 && error.keyPattern?.email)
      return res.status(400).json({ error: "Email already in use" });
    res.status(400).json({ error: error.message });
  }
};

// ── Login ──────────────────────────────────────────────────────────────────
// Accepts { email, password }
// Also accepts { identifier, password } for backward compat (identifier = email or username)
export const loginUserController = async (req, res) => {
  try {
    const { email, identifier, password } = req.body;

    // Resolve the lookup value — prefer explicit `email`, fall back to `identifier`
    const loginValue = (email || identifier || "").trim();

    if (!loginValue || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user — try email first, then username
    let user = await User.findOne({
      email: loginValue.toLowerCase(),
    }).select("+password");

    // If not found by email, try username (handles identifier = username case)
    if (!user) {
      user = await User.findOne({
        username: loginValue,
      }).select("+password");
    }

    if (!user) {
      return res.status(401).json({ error: "No account found with that email" });
    }

    const isMatch = await user.isValidPassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    const token = user.generateJWT();
    delete user._doc.password;
    res.status(200).json({ user, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── Get profile (fresh from DB) ────────────────────────────────────────────
export const getProfileController = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json({ user });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── Update profile ─────────────────────────────────────────────────────────
export const updateProfileController = async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    const user  = await userService.updateProfile({
      userId: req.user._id, username, currentPassword, newPassword,
    });
    const token = user.generateJWT();
    delete user._doc.password;
    res.status(200).json({ user, token });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(400).json({ error: error.message });
  }
};

// ── Logout ─────────────────────────────────────────────────────────────────
export const logoutController = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      req.cookies?.token ||
      (authHeader?.toLowerCase().startsWith("bearer ")
        ? authHeader.split(" ")[1]
        : null);

    if (!token) return res.status(400).json({ error: "No token provided" });

    await redisClient.set(token, "logout", "EX", 60 * 60 * 24);
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── Get all other users ────────────────────────────────────────────────────
export const getAllUsersController = async (req, res) => {
  try {
    const loggedInUser = await User.findById(req.user._id);
    if (!loggedInUser) return res.status(404).json({ error: "User not found" });
    const users = await userService.getAllUsers({ userId: loggedInUser._id });
    res.status(200).json({ users });
  } catch (error) {
    console.error("getAllUsers error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};