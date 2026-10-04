import * as service from "./complaints.service.js";
import { HttpError } from "../../common/utils/httpError.js";

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Complaints error:", error);
    return res.status(500).json({ message: "Eroare internă de server." });
  }
};

export const createComplaintController = handle(async (req, res) => {
  const reportId = req.params.id || req.body.reportId;
  if (!reportId) throw new HttpError(400, "ID-ul sesizării este obligatoriu.");

  const { institutionId, channel } = req.body;
  const complaint = await service.createComplaint({
    reportId,
    actor: req.user,
    institutionId,
    channel,
  });

  res.status(201).json({
    message: `Sesizarea formală ${complaint.referenceNumber} a fost înregistrată cu succes.`,
    complaint,
  });
});

export const listComplaintsController = handle(async (req, res) => {
  const reportId = req.params.id || req.query.reportId;
  const { status, institutionId } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

  const result = await service.listComplaints({
    reportId,
    status,
    institutionId,
    actor: req.user,
    page,
    limit,
  });

  res.json(result);
});

export const getComplaintController = handle(async (req, res) => {
  const complaint = await service.getComplaint(req.params.id, req.user);
  res.json({ complaint });
});

export const answerComplaintController = handle(async (req, res) => {
  const { answerText } = req.body;
  const complaint = await service.answerComplaint({
    complaintId: req.params.id,
    actor: req.user,
    answerText,
  });

  res.json({
    message: "Răspunsul oficial a fost înregistrat.",
    complaint,
  });
});

export const acknowledgeComplaintController = handle(async (req, res) => {
  const complaint = await service.acknowledgeComplaint({
    complaintId: req.params.id,
    actor: req.user,
  });

  res.json({
    message: "Confirmarea de primire a fost marcată.",
    complaint,
  });
});

export const checkEscalationsController = handle(async (req, res) => {
  const summary = await service.checkAndEscalateOverdue();
  res.json({
    message: "Verificarea termenelor și procesul de escaladare s-au finalizat.",
    ...summary,
  });
});
