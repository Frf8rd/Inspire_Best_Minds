import * as service from "./notifications.service.js";
import { HttpError } from "../../common/utils/httpError.js";

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Notifications error:", error);
    return res.status(500).json({ message: "Eroare internă de server." });
  }
};

export const listNotificationsController = handle(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
  const unreadOnly = req.query.unreadOnly === "true";

  const result = await service.listNotifications({
    userId: req.user.id,
    unreadOnly,
    page,
    limit,
  });

  res.json(result);
});

export const markAsReadController = handle(async (req, res) => {
  const notification = await service.markAsRead({
    notificationId: req.params.id,
    userId: req.user.id,
  });

  res.json({
    message: "Notificarea a fost marcată ca citită.",
    notification,
  });
});

export const markAllAsReadController = handle(async (req, res) => {
  const result = await service.markAllAsRead({ userId: req.user.id });
  res.json({
    message: "Toate notificările au fost marcate ca citite.",
    ...result,
  });
});

export const deleteNotificationController = handle(async (req, res) => {
  await service.deleteNotification({
    notificationId: req.params.id,
    userId: req.user.id,
  });
  res.json({ message: "Notificarea a fost ștearsă." });
});
