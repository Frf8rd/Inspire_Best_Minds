import { Router } from "express";
import { protect, restrictTo } from "../../common/middleware/auth.middleware.js";
import {
  listCategoriesController,
  createProblemController,
  listProblemsController,
  getProblemController,
  updateStatusController,
  updateProblemController,
  deleteProblemController,
  historyController,
  toggleSupportController,
  confirmResolutionController,
} from "./problems.controller.js";
import {
  listCommentsController,
  createCommentController,
  deleteCommentController,
} from "../comments/comments.controller.js";
import { uploadProblemPhotos } from "./problems.upload.js";

const router = Router();

router.use(protect);

router.get("/categories", listCategoriesController);
router.get("/", listProblemsController);
router.post("/", uploadProblemPhotos, createProblemController); // orice utilizator autentificat
router.get("/:id", getProblemController);
router.get("/:id/history", historyController);
router.put("/:id", updateProblemController);
router.delete("/:id", deleteProblemController);
router.patch("/:id/status", restrictTo("STAFF", "ADMIN"), updateStatusController);
router.post("/:id/support", toggleSupportController);
router.post("/:id/confirm-resolution", confirmResolutionController);

// Comentarii pe sesizare
router.get("/:id/comments", listCommentsController);
router.post("/:id/comments", createCommentController);
router.delete("/:id/comments/:commentId", deleteCommentController);

export default router;
