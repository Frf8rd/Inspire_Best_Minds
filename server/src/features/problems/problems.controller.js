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
  const includeInactive = req.query.all === "true" && req.user?.role === "ADMIN";
  res.json({ categories: await service.listCategories(includeInactive) });
});

export const createCategoryController = handle(async (req, res) => {
  const category = await service.createCategory(req.body);
  res.status(201).json(category);
});

export const updateCategoryController = handle(async (req, res) => {
  const category = await service.updateCategory(req.params.id, req.body);
  res.json(category);
});

export const deleteCategoryController = handle(async (req, res) => {
  await service.deleteCategory(req.params.id);
  res.json({ message: "Categoria a fost ștearsă sau dezactivată." });
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

  const result = await service.createReport({
    reporterId: req.user.id,
    title,
    description,
    categoryId,
    latitude,
    longitude,
    address,
    photos: req.files ?? [],
  });

  if (result.duplicate) {
    return res.status(201).json({
      message: `Există deja o sesizare similară în apropiere (${result.parentCode}). A fost grupată cu ea.`,
      duplicate: true,
      problem: result.problem,
    });
  }

  res.status(201).json({
    message: "Sesizarea a fost creată cu succes.",
    duplicate: false,
    problem: result.problem,
  });
});

export const listProblemsController = handle(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const status = str(req.query.status);
  const priority = str(req.query.priority);
  if (status && !REPORT_STATUSES.includes(status)) {
    throw new HttpError(400, "Status invalid.");
  }
  if (priority && !["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(priority)) {
    throw new HttpError(400, "Prioritate invalidă.");
  }

  const result = await service.listReports({
    status: status || undefined,
    category: str(req.query.categoryId || req.query.category) || undefined,
    priority: priority || undefined,
    zone: str(req.query.zone) || undefined,
    boundingBox: parseBoundingBox(req.query),
    reporterId: req.query.mine === "true" ? req.user.id : undefined,
    page,
    limit,
  });
  res.json(result);
});

function parseCoordinate(value, label) {
  if (value === undefined || value === "") return undefined;
  const coordinate = Number(value);
  if (!Number.isFinite(coordinate)) throw new HttpError(400, `${label} trebuie să fie un număr.`);
  return coordinate;
}

function parseBoundingBox(query) {
  // bbox = minLng,minLat,maxLng,maxLat. Acceptăm și parametrii expliciți,
  // mai practici pentru clienții care construiesc URLSearchParams.
  let values;
  if (query.bbox) {
    values = String(query.bbox).split(",").map((value) => Number(value.trim()));
    if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) {
      throw new HttpError(400, "bbox trebuie să fie minLng,minLat,maxLng,maxLat.");
    }
    const [minLongitude, minLatitude, maxLongitude, maxLatitude] = values;
    if (minLatitude > maxLatitude || minLongitude > maxLongitude) {
      throw new HttpError(400, "bbox are limite inverse.");
    }
    return { minLatitude, maxLatitude, minLongitude, maxLongitude };
  }

  const minLatitude = parseCoordinate(query.minLat, "minLat");
  const maxLatitude = parseCoordinate(query.maxLat, "maxLat");
  const minLongitude = parseCoordinate(query.minLng, "minLng");
  const maxLongitude = parseCoordinate(query.maxLng, "maxLng");
  const valuesArePresent = [minLatitude, maxLatitude, minLongitude, maxLongitude].some(
    (value) => value !== undefined
  );
  if (!valuesArePresent) return undefined;
  if ([minLatitude, maxLatitude, minLongitude, maxLongitude].some((value) => value === undefined)) {
    throw new HttpError(400, "Bounding box-ul necesită minLat, maxLat, minLng și maxLng.");
  }
  if (minLatitude > maxLatitude || minLongitude > maxLongitude) {
    throw new HttpError(400, "Bounding box are limite inverse.");
  }
  return { minLatitude, maxLatitude, minLongitude, maxLongitude };
}

export const getProblemController = handle(async (req, res) => {
  res.json({ problem: await service.getReport(req.params.id, req.user?.id) });
});

export const listMyProblemsController = handle(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  res.json(await service.listReports({ reporterId: req.user.id, page, limit }));
});

export const updateProblemController = handle(async (req, res) => {
  const data = {};
  if (req.body.title !== undefined) {
    const title = str(req.body.title);
    if (title.length < 3 || title.length > 150) {
      throw new HttpError(400, "Titlul trebuie să aibă între 3 și 150 de caractere.");
    }
    data.title = title;
  }
  if (req.body.description !== undefined) data.description = str(req.body.description) || null;
  if (req.body.address !== undefined) data.address = str(req.body.address) || null;
  if (req.body.categoryId !== undefined) data.categoryId = str(req.body.categoryId);
  if (req.body.latitude !== undefined) {
    const latitude = Number(req.body.latitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new HttpError(400, "Latitudine invalidă.");
    data.latitude = latitude;
  }
  if (req.body.longitude !== undefined) {
    const longitude = Number(req.body.longitude);
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new HttpError(400, "Longitudine invalidă.");
    data.longitude = longitude;
  }
  if (!Object.keys(data).length) throw new HttpError(400, "Nu ai transmis câmpuri de actualizat.");

  res.json({
    message: "Sesizarea a fost actualizată.",
    problem: await service.updateReport({ reportId: req.params.id, actor: req.user, data }),
  });
});

export const deleteProblemController = handle(async (req, res) => {
  await service.deleteReport({ reportId: req.params.id, actor: req.user });
  res.status(204).send();
});

export const historyController = handle(async (req, res) => {
  res.json({ history: await service.getReportHistory(req.params.id) });
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

export const toggleSupportController = handle(async (req, res) => {
  const result = await service.toggleSupport({
    reportId: req.params.id,
    userId: req.user.id,
  });
  res.json({
    message: result.supported ? "Ai adăugat susținere (+1) pentru această sesizare." : "Ai retras susținerea (-1).",
    ...result,
  });
});

export const confirmResolutionController = handle(async (req, res) => {
  let confirmed = req.body.confirmed;
  if (confirmed === undefined && req.body.status) {
    if (req.body.status === "RESOLVED") confirmed = true;
    else if (req.body.status === "REOPENED") confirmed = false;
  }

  if (typeof confirmed !== "boolean") {
    throw new HttpError(400, "Specifică 'confirmed' (true/false) sau 'status' ('RESOLVED'/'REOPENED').");
  }

  const problem = await service.confirmResolution({
    reportId: req.params.id,
    actor: req.user,
    confirmed,
    comment: str(req.body.comment),
  });

  res.json({
    message: confirmed
      ? "Rezolvarea sesizării a fost confirmată."
      : "Rezolvarea a fost infirmată; sesizarea a fost redeschisă.",
    problem,
  });
});
