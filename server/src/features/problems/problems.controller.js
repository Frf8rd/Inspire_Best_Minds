import { createProblem } from "./problems.service.js";

export async function createProblemController(req, res) {
  try {
    const {
      title,
      categoryId,
      description,
      latitude,
      longitude,
    } = req.body;

    const userId = req.user.id;

    const problem = await createProblem({
      userId,
      title,
      categoryId: Number(categoryId),
      description,
      latitude: latitude !== undefined ? Number(latitude) : null,
      longitude: longitude !== undefined ? Number(longitude) : null,
    });

    return res.status(201).json({
      message: "Problema a fost creată cu succes.",
      problem,
    });
  } catch (error) {
    console.error("Create problem error:", error);

    return res.status(400).json({
      message: error.message || "Nu s-a putut crea problema.",
    });
  }
}
