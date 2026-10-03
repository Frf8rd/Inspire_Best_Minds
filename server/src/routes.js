import express from "express";
import authRoutes from "./features/auth/auth.routes.js";
import problemsRoutes from "./features/problems/problems.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/problems", problemsRoutes);

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
