import { Router } from "express";
import { protect } from "../../common/middleware/auth.middleware.js";
import {
  listNotificationsController,
  markAsReadController,
  markAllAsReadController,
  deleteNotificationController,
} from "./notifications.controller.js";

const router = Router();

router.use(protect);

router.get("/", listNotificationsController);
router.patch("/read-all", markAllAsReadController);
router.patch("/:id/read", markAsReadController);
router.delete("/:id", deleteNotificationController);

export default router;
