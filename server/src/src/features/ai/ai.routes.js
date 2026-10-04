import { Router } from "express";
import rateLimit from "express-rate-limit";
import { protect, restrictTo } from "../../common/middleware/auth.middleware.js";
import { uploadProblemPhotos } from "../problems/problems.upload.js";
import { aiStatusController, analyzePhotosController, reviewReportController } from "./ai.controller.js";

const router = Router();

// Fiecare analiză costă bani: limităm per utilizator
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator: (req) => req.user?.id || "anon",
  validate: { keyGeneratorIpFallback: false },
  message: { message: "Prea multe analize. Încearcă din nou într-un minut." },
});

router.get("/status", aiStatusController);
router.post("/analyze-photos", protect, aiLimiter, uploadProblemPhotos, analyzePhotosController);
router.post("/reports/:id/review", protect, restrictTo("STAFF", "ADMIN"), aiLimiter, reviewReportController);

export default router;
