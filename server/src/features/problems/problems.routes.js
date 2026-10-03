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
} from "./problems.controller.js";
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

export default router;
