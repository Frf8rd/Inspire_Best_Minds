import express from "express";
import passport from "../../config/passport.js";
import { protect } from "../../common/middleware/auth.middleware.js";
import {
  register,
  login,
  logout,
  getMe,
  refreshTokens,
  googleCallback,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
} from "./auth.controller.js";
import {
  validate,
  loginLimiter,
  forgotPasswordLimiter,
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
} from "./auth.validator.js";

const router = express.Router();
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

// Autentificare clasică
router.post("/register", registerRules, validate, register);
router.post("/login", loginLimiter, loginRules, validate, login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.post("/refresh", refreshTokens);

// Resetare parolă
router.post("/forgot-password", forgotPasswordLimiter, forgotPasswordRules, validate, forgotPassword);
router.post("/reset-password", resetPasswordRules, validate, resetPassword);

// Verificare email
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", protect, resendVerification);

// Google OAuth 2.0
router.get(
  "/google",
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(503).json({
        message: "Google OAuth is not configured on this server.",
      });
    }
    passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
    })(req, res, next);
  }
);

router.get(
  "/google/callback",
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.redirect(`${clientUrl}/login?error=google_not_configured`);
    }
    passport.authenticate("google", {
      session: false,
      failureRedirect: `${clientUrl}/login?error=google_auth_failed`,
    })(req, res, next);
  },
  googleCallback
);

export default router;
