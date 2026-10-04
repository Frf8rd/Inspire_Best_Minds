import { Router } from "express";
import { protect, restrictTo, optionalAuth } from "../../common/middleware/auth.middleware.js";
import {
  getRecurringZonesController,
  getDashboardController,
  getInstitutionTransparencyController,
} from "./analytics.controller.js";

const router = Router();

// Raport de transparență public pentru instituție
router.get("/transparency/:idOrSlug", optionalAuth, getInstitutionTransparencyController);

// Dashboard și statistici protejate pentru STAFF și ADMIN
router.use(protect);
router.use(restrictTo("STAFF", "ADMIN"));

router.get("/dashboard", getDashboardController);
router.get("/recurring-zones", getRecurringZonesController);

export default router;
