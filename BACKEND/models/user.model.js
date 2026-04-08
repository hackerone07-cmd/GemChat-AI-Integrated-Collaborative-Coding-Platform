import mongoose from "mongoose";
import bcrypt   from "bcrypt";
import jwt      from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String, required: true, unique: true, trim: true, lowercase: true,
      minLength: [6,  "Email must be at least 6 characters long"],
      maxLength: [50, "Email must be at most 50 characters long"],
    },
    username: {
      type: String, trim: true,
      minLength: [2, "Username must be at least 2 characters"],
      maxLength: [30, "Username must be at most 30 characters"],
      default: "",
    },
    password: {
      type: String, required: [true, "Password is required"], select: false,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isValidPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// ── JWT carries _id + email + username ───────────────────────────────────────
// BUG FIX: old version only had { email }, so req.user._id was always
// undefined in every controller → findById(undefined) → CastError → 500/403.
userSchema.methods.generateJWT = function () {
  return jwt.sign(
    {
      _id:      this._id.toString(),
      email:    this.email,
      username: this.username || this.email.split("@")[0],
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
};

export default mongoose.model("User", userSchema);