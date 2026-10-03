import { Router } from "express";
import { createProblemController } from "./problems.controller.js";
import { testAuth } from "./problems.testAuth.js";

const router = Router();

router.post("/", testAuth, createProblemController);

export default router;
