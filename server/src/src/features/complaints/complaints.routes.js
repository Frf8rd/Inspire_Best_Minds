import { Router } from "express";
import { protect, restrictTo } from "../../common/middleware/auth.middleware.js";
import {
  listComplaintsController,
  getComplaintController,
  createComplaintController,
  answerComplaintController,
  acknowledgeComplaintController,
  checkEscalationsController,
} from "./complaints.controller.js";

const router = Router();

router.use(protect);

router.get("/", listComplaintsController);
router.post("/", createComplaintController);
router.post("/check-escalations", restrictTo("STAFF", "ADMIN"), checkEscalationsController);

router.get("/:id", getComplaintController);
router.patch("/:id/answer", answerComplaintController);
router.patch("/:id/acknowledge", acknowledgeComplaintController);

export default router;
