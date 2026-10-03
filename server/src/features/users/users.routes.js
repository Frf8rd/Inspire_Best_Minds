import { Router } from "express";
import { protect, restrictTo } from "../../common/middleware/auth.middleware.js";
import {
  listUsersController,
  getUserController,
  updateUserRoleController,
  updateUserStatusController,
} from "./users.controller.js";

const router = Router();

router.use(protect);
router.use(restrictTo("ADMIN"));

router.get("/", listUsersController);
router.get("/:id", getUserController);
router.patch("/:id/role", updateUserRoleController);
router.patch("/:id/status", updateUserStatusController);

export default router;
