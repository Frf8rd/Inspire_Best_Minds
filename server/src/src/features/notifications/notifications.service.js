import { prisma } from "../../config/database.js";
import { HttpError } from "../../common/utils/httpError.js";
import { sendEmail, escapeHtml } from "../../common/utils/email.js";

export async function createNotification({
  userId,
  title,
  message,
  type = "SYSTEM",
  link = null,
  sendEmailNotification = false,
}) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      link,
    },
  });

  if (sendEmailNotification) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: `[UrbanPulse] ${title}`,
        html: `
          <h3>Salut, ${escapeHtml(user.name || "Cetățean")}</h3>
          <p>${escapeHtml(message)}</p>
          ${link ? `<p><a href="${process.env.CLIENT_URL || "http://localhost:5173"}${escapeHtml(link)}">Vezi detalii în aplicație</a></p>` : ""}
        `,
      }).catch(() => null);
    }
  }

  return notification;
}

export async function listNotifications({ userId, unreadOnly = false, page = 1, limit = 30 }) {
  const where = {
    userId,
    ...(unreadOnly ? { isRead: false } : {}),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    notifications,
    unreadCount,
    total,
    page,
    limit,
  };
}

export async function markAsRead({ notificationId, userId }) {
  const notif = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { id: true, userId: true },
  });

  if (!notif || notif.userId !== userId) {
    throw new HttpError(404, "Notificarea nu a fost găsită.");
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllAsRead({ userId }) {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  return { updatedCount: result.count };
}

export async function deleteNotification({ notificationId, userId }) {
  const notif = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { id: true, userId: true },
  });

  if (!notif || notif.userId !== userId) {
    throw new HttpError(404, "Notificarea nu a fost găsită.");
  }

  await prisma.notification.delete({ where: { id: notificationId } });
}
