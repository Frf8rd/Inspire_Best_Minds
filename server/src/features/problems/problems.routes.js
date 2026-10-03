import { Router } from "express";
import { protect, restrictTo } from "../../common/middleware/auth.middleware.js";
import {
  listCategoriesController,
  createProblemController,
  listProblemsController,
  getProblemController,
  updateStatusController,
} from "./problems.controller.js";

const router = Router();

router.use(protect);

router.get("/categories", listCategoriesController);
router.get("/", listProblemsController);
router.post("/", createProblemController); // orice utilizator autentificat
router.get("/:id", getProblemController);
router.patch("/:id/status", restrictTo("STAFF", "ADMIN"), updateStatusController);

export default router;
