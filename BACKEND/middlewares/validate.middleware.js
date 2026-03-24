import { validationResult } from "express-validator";

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return first error as a plain `error` string so every client
    // can read it the same way: err.response.data.error
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};