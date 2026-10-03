import express from "express";
import authRoutes from "./features/auth/auth.routes.js";
import problemsRoutes from "./features/problems/problems.routes.js";
import { listMyProblemsController } from "./features/problems/problems.controller.js";
import { protect } from "./common/middleware/auth.middleware.js";

import { deleteCommentController } from "./features/comments/comments.controller.js";
import analyticsRoutes from "./features/analytics/analytics.routes.js";
import institutionsRoutes from "./features/institutions/institutions.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.get("/me/problems", protect, listMyProblemsController);
router.use("/problems", problemsRoutes);
router.use("/institutions", institutionsRoutes);
router.use("/analytics", analyticsRoutes);
router.delete("/comments/:id", protect, deleteCommentController);

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
