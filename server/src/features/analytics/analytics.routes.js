import { Router } from "express";
import { protect, restrictTo } from "../../common/middleware/auth.middleware.js";
import { getRecurringZonesController } from "./analytics.controller.js";

const router = Router();

router.use(protect);
router.use(restrictTo("STAFF", "ADMIN"));

router.get("/recurring-zones", getRecurringZonesController);

export default router;
