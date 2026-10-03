import express from "express";
import authRoutes from "./features/auth/auth.routes.js";
import problemsRoutes from "./features/problems/problems.routes.js";
import { listMyProblemsController } from "./features/problems/problems.controller.js";
import { protect } from "./common/middleware/auth.middleware.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.get("/me/problems", protect, listMyProblemsController);
router.use("/problems", problemsRoutes);

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
