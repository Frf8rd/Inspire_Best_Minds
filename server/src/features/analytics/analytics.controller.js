import { calculateRecurringZones } from "../problems/problems.intelligence.js";
import * as service from "./analytics.service.js";
import { HttpError } from "../../common/utils/httpError.js";

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Analytics error:", error);
    return res.status(500).json({ message: "Eroare internă de server." });
  }
};

export const getRecurringZonesController = handle(async (req, res) => {
  const months = Math.min(12, Math.max(1, parseInt(req.query.months, 10) || 3));
  const cellMeters = Math.min(1000, Math.max(50, parseInt(req.query.cellMeters, 10) || 150));
  const minCount = Math.max(1, parseInt(req.query.minCount, 10) || 3);
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const refLat = Number.isFinite(Number(req.query.refLat)) ? Number(req.query.refLat) : 47;

  const data = await calculateRecurringZones({
    months,
    cellMeters,
    minCount,
    limit,
    refLat,
  });

  res.json(data);
});

export const getDashboardController = handle(async (req, res) => {
  const { institutionId, startDate, endDate } = req.query;
  const stats = await service.getDashboardStats({
    actor: req.user,
    institutionId,
    startDate,
    endDate,
  });
  res.json(stats);
});

export const getInstitutionTransparencyController = handle(async (req, res) => {
  const report = await service.getInstitutionTransparency(req.params.idOrSlug);
  res.json(report);
});
