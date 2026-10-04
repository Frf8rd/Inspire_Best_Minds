import { prisma } from "../../config/database.js";
import { HttpError } from "../../common/utils/httpError.js";
import { inspectImage } from "../../common/utils/image.js";
import { analyzeReportPhotos, getAiStatus, isAiEnabled } from "./ai.service.js";
import { reviewReportWithAi } from "../problems/problems.service.js";

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error instanceof HttpError) return res.status(error.status).json({ message: error.message });
    console.error("AI error:", error);
    return res.status(500).json({ message: "Eroare internă de server." });
  }
};

export const aiStatusController = handle(async (req, res) => {
  res.json(getAiStatus());
});

// Previzualizare înainte de trimiterea sesizării: nu salvează nimic.
export const analyzePhotosController = handle(async (req, res) => {
  const files = req.files ?? [];
  if (!files.length) throw new HttpError(400, "Încarcă cel puțin o fotografie în câmpul 'photos'.");
  for (const f of files) {
    const img = inspectImage(f.buffer);
    if (!img || img.mimeType !== f.mimetype) {
      throw new HttpError(400, "Conținutul unei fotografii nu corespunde unui JPEG, PNG sau WebP valid.");
    }
  }
  const categories = await prisma.category.findMany({
    where: { isActive: true }, select: { id: true, slug: true, name: true },
  });
  const result = await analyzeReportPhotos({
    images: files,
    title: String(req.body.title || ""),
    description: String(req.body.description || ""),
    categories,
    selectedCategoryId: req.body.categoryId ? String(req.body.categoryId) : undefined,
  });
  const suggestedCategory = categories.find((c) => c.id === result.suggestedCategoryId) ?? null;
  res.json({
    enabled: isAiEnabled(),
    verdict: result.verdict, // VERIFIED | FLAGGED | REJECTED | SKIPPED
    accepted: result.verdict !== "REJECTED",
    reasons: result.reasons,
    summary: result.analysis?.summary ?? null,
    severity: result.analysis?.severity ?? null,
    containsFaces: result.analysis?.containsFaces ?? null,
    containsLicensePlates: result.analysis?.containsLicensePlates ?? null,
    suggestedCategory,
  });
});

// Personal: reanalizează fotografiile unei sesizări existente.
export const reviewReportController = handle(async (req, res) => {
  res.json({ message: "Analiza AI a fost actualizată.", review: await reviewReportWithAi(req.params.id) });
});
