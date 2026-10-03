import * as service from "./institutions.service.js";
import { HttpError } from "../../common/utils/httpError.js";

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Institutions error:", error);
    return res.status(500).json({ message: "Eroare internă de server." });
  }
};

export const listInstitutionsController = handle(async (req, res) => {
  const { type, search } = req.query;
  const institutions = await service.listInstitutions({ type, search });
  res.json({ institutions });
});

export const getInstitutionController = handle(async (req, res) => {
  const institution = await service.getInstitution(req.params.idOrSlug, req.user);
  res.json({ institution });
});

export const createInstitutionController = handle(async (req, res) => {
  const institution = await service.createInstitution(req.body);
  res.status(201).json({
    message: "Instituția a fost creată cu succes.",
    institution,
  });
});

export const updateInstitutionController = handle(async (req, res) => {
  const institution = await service.updateInstitution(req.params.id, req.body, req.user);
  res.json({
    message: "Instituția a fost actualizată.",
    institution,
  });
});

export const addDepartmentController = handle(async (req, res) => {
  const department = await service.addDepartment(req.params.id, req.body, req.user);
  res.status(201).json({
    message: "Departamentul a fost adăugat.",
    department,
  });
});

export const deleteDepartmentController = handle(async (req, res) => {
  await service.deleteDepartment(req.params.id, req.params.departmentId, req.user);
  res.json({ message: "Departamentul a fost șters." });
});

export const addOrUpdateMemberController = handle(async (req, res) => {
  const membership = await service.addOrUpdateMember(req.params.id, req.body, req.user);
  res.json({
    message: "Membrul instituției a fost actualizat.",
    membership,
  });
});

export const removeMemberController = handle(async (req, res) => {
  await service.removeMember(req.params.id, req.params.userId, req.user);
  res.json({ message: "Membrul a fost revocat din instituție." });
});

export const listRoutingRulesController = handle(async (req, res) => {
  const rules = await service.listRoutingRules();
  res.json({ rules });
});

export const createRoutingRuleController = handle(async (req, res) => {
  const rule = await service.createRoutingRule(req.body);
  res.status(201).json({
    message: "Regula de rutare a fost configurată.",
    rule,
  });
});

export const deleteRoutingRuleController = handle(async (req, res) => {
  await service.deleteRoutingRule(req.params.id);
  res.json({ message: "Regula de rutare a fost ștearsă." });
});
