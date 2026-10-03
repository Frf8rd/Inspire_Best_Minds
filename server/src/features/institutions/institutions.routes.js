import { Router } from "express";
import { protect, restrictTo, optionalAuth } from "../../common/middleware/auth.middleware.js";
import {
  listInstitutionsController,
  getInstitutionController,
  createInstitutionController,
  updateInstitutionController,
  addDepartmentController,
  deleteDepartmentController,
  addOrUpdateMemberController,
  removeMemberController,
  listRoutingRulesController,
  createRoutingRuleController,
  deleteRoutingRuleController,
} from "./institutions.controller.js";

const router = Router();

// Reguli de rutare (ADMIN)
router.get("/routing-rules", protect, restrictTo("ADMIN"), listRoutingRulesController);
router.post("/routing-rules", protect, restrictTo("ADMIN"), createRoutingRuleController);
router.delete("/routing-rules/:id", protect, restrictTo("ADMIN"), deleteRoutingRuleController);

// Profiluri publice instituții
router.get("/", optionalAuth, listInstitutionsController);
router.get("/:idOrSlug", optionalAuth, getInstitutionController);

// Administrare instituții
router.post("/", protect, restrictTo("ADMIN"), createInstitutionController);
router.put("/:id", protect, updateInstitutionController);

// Departamente
router.post("/:id/departments", protect, addDepartmentController);
router.delete("/:id/departments/:departmentId", protect, deleteDepartmentController);

// Membri
router.post("/:id/members", protect, addOrUpdateMemberController);
router.delete("/:id/members/:userId", protect, removeMemberController);

export default router;
