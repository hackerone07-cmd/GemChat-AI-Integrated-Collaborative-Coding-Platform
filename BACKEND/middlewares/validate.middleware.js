import { validationResult } from "express-validator";

// Always returns { error: "first error message" } — never an array
// so every frontend screen reads err.response.data.error consistently
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};