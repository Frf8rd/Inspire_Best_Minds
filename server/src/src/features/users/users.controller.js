import * as service from "./users.service.js";
import { HttpError } from "../../common/utils/httpError.js";

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Users error:", error);
    return res.status(500).json({ message: "Eroare internă de server." });
  }
};

export const listUsersController = handle(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const { search, role, isActive } = req.query;

  const result = await service.listUsers({
    page,
    limit,
    search,
    role,
    isActive,
  });

  res.json(result);
});

export const getUserController = handle(async (req, res) => {
  const user = await service.getUser(req.params.id);
  res.json({ user });
});

export const updateUserRoleController = handle(async (req, res) => {
  const { role } = req.body;
  const user = await service.updateUserRole(req.params.id, role, req.user);
  res.json({
    message: "Rolul utilizatorului a fost actualizat.",
    user,
  });
});

export const updateUserStatusController = handle(async (req, res) => {
  const { isActive } = req.body;
  const user = await service.updateUserStatus(req.params.id, isActive, req.user);
  res.json({
    message: isActive ? "Contul a fost activat." : "Contul a fost dezactivat.",
    user,
  });
});
