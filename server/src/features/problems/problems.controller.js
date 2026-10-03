import * as service from "./problems.service.js";
import { REPORT_STATUSES } from "./problems.constants.js";
import { HttpError } from "../../common/utils/httpError.js";

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Problems error:", error);
    return res.status(500).json({ message: "Eroare internă de server." });
  }
};

const str = (v) => (typeof v === "string" ? v.trim() : "");

export const listCategoriesController = handle(async (req, res) => {
  res.json({ categories: await service.listCategories() });
});

export const createProblemController = handle(async (req, res) => {
  const title = str(req.body.title);
  const description = str(req.body.description);
  const address = str(req.body.address);
  const categoryId = str(req.body.categoryId);
  const latitude = Number(req.body.latitude);
  const longitude = Number(req.body.longitude);

  if (title.length < 3 || title.length > 150) {
    throw new HttpError(400, "Titlul trebuie să aibă între 3 și 150 de caractere.");
  }
  if (!categoryId) throw new HttpError(400, "Categoria este obligatorie.");
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new HttpError(400, "Latitudine invalidă.");
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new HttpError(400, "Longitudine invalidă.");
  }

  const problem = await service.createReport({
    reporterId: req.user.id,
    title,
    description,
    categoryId,
    latitude,
    longitude,
    address,
  });

  res.status(201).json({ message: "Sesizarea a fost creată cu succes.", problem });
});

export const listProblemsController = handle(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const status = str(req.query.status);
  if (status && !REPORT_STATUSES.includes(status)) {
    throw new HttpError(400, "Status invalid.");
  }

  const result = await service.listReports({
    status: status || undefined,
    categoryId: str(req.query.categoryId) || undefined,
    reporterId: req.query.mine === "true" ? req.user.id : undefined,
    page,
    limit,
  });
  res.json(result);
});

export const getProblemController = handle(async (req, res) => {
  res.json({ problem: await service.getReport(req.params.id) });
});

export const updateStatusController = handle(async (req, res) => {
  const toStatus = str(req.body.status);
  if (!REPORT_STATUSES.includes(toStatus)) {
    throw new HttpError(400, "Status invalid.");
  }

  const problem = await service.changeStatus({
    reportId: req.params.id,
    actor: req.user,
    toStatus,
    comment: str(req.body.comment),
    assigneeId: str(req.body.assigneeId) || undefined,
  });
  res.json({ message: "Statusul a fost actualizat.", problem });
});
