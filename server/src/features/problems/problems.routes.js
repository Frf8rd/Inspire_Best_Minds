import { Router } from "express";
import { protect, restrictTo, optionalAuth } from "../../common/middleware/auth.middleware.js";
import {
  listCategoriesController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
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
import {
  listComplaintsController,
  createComplaintController,
} from "../complaints/complaints.controller.js";
import { uploadProblemPhotos } from "./problems.upload.js";

const router = Router();

// Categorii
router.get("/categories", optionalAuth, listCategoriesController);
router.post("/categories", protect, restrictTo("ADMIN"), createCategoryController);
router.put("/categories/:id", protect, restrictTo("ADMIN"), updateCategoryController);
router.delete("/categories/:id", protect, restrictTo("ADMIN"), deleteCategoryController);

// Sesizări publice (citire)
router.get("/", optionalAuth, listProblemsController);
router.get("/:id", optionalAuth, getProblemController);
router.get("/:id/history", optionalAuth, historyController);
router.get("/:id/comments", optionalAuth, listCommentsController);
router.get("/:id/complaints", optionalAuth, listComplaintsController);

// Acțiuni protejate pe sesizări (creare, editare, susținere, status, comentarii)
router.post("/", protect, uploadProblemPhotos, createProblemController);
router.put("/:id", protect, updateProblemController);
router.delete("/:id", protect, deleteProblemController);
router.patch("/:id/status", protect, restrictTo("STAFF", "ADMIN"), updateStatusController);
router.post("/:id/support", protect, toggleSupportController);
router.post("/:id/confirm-resolution", protect, confirmResolutionController);

// Comentarii
router.post("/:id/comments", protect, createCommentController);
router.delete("/:id/comments/:commentId", protect, deleteCommentController);

// Reclamații formale
router.post("/:id/complaints", protect, createComplaintController);

export default router;
