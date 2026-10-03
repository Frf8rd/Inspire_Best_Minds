import { prisma } from "../../config/database.js";
import { HttpError } from "../../common/utils/httpError.js";
import { createNotification } from "../notifications/notifications.service.js";

/**
 * Verifică dacă utilizatorul curent are dreptul de a citi/scrie comentarii interne.
 * Doar administratorii și membrii STAFF ai instituției responsabile au acces.
 */
async function canAccessInternal(actor, institutionId) {
  if (!actor) return false;
  if (actor.role === "ADMIN") return true;
  if (actor.role !== "STAFF" || !institutionId) return false;

  const membership = await prisma.membership.findUnique({
    where: {
      userId_institutionId: {
        userId: actor.id,
        institutionId,
      },
    },
  });

  return Boolean(membership);
}

export async function addComment({ reportId, actor, body, visibility = "PUBLIC" }) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      reporterId: true,
      department: { select: { institutionId: true } },
    },
  });

  if (!report) throw new HttpError(404, "Sesizarea nu există.");

  const validVisibilities = ["PUBLIC", "INTERNAL"];
  const finalVisibility = visibility || "PUBLIC";
  if (!validVisibilities.includes(finalVisibility)) {
    throw new HttpError(400, "Vizibilitate invalidă. Valori permise: 'PUBLIC', 'INTERNAL'.");
  }

  if (finalVisibility === "INTERNAL") {
    const hasAccess = await canAccessInternal(actor, report.department?.institutionId);
    if (!hasAccess) {
      throw new HttpError(403, "Doar personalul instituției responsabile sau administratorii pot adăuga comentarii interne.");
    }
  }

  const cleanBody = typeof body === "string" ? body.trim() : "";
  if (cleanBody.length < 1 || cleanBody.length > 2000) {
    throw new HttpError(400, "Comentariul trebuie să aibă între 1 și 2000 de caractere.");
  }

  const comment = await prisma.comment.create({
    data: {
      reportId,
      authorId: actor.id,
      body: cleanBody,
      visibility: finalVisibility,
    },
    select: {
      id: true,
      reportId: true,
      body: true,
      visibility: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  // Notificare către autorul sesizării dacă altcineva a adăugat un comentariu
  if (report.reporterId && report.reporterId !== actor.id && finalVisibility === "PUBLIC") {
    createNotification({
      userId: report.reporterId,
      title: "Comentariu nou la sesizarea ta",
      message: `${comment.author.name} a adăugat un comentariu.`,
      type: "COMMENT",
      link: `/problems/${reportId}`,
    }).catch(() => null);
  }

  return comment;
}

export async function listComments({ reportId, actor, page = 1, limit = 50 }) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      department: { select: { institutionId: true } },
    },
  });

  if (!report) throw new HttpError(404, "Sesizarea nu există.");

  const hasAccessToInternal = await canAccessInternal(actor, report.department?.institutionId);

  const where = {
    reportId,
    ...(hasAccessToInternal ? {} : { visibility: "PUBLIC" }),
  };

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        reportId: true,
        body: true,
        visibility: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    }),
    prisma.comment.count({ where }),
  ]);

  return { comments, total, page, limit };
}

export async function deleteComment({ reportId, commentId, actor }) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, reportId: true, authorId: true },
  });

  if (!comment || (reportId && comment.reportId !== reportId)) {
    throw new HttpError(404, "Comentariul nu există.");
  }

  if (actor.role !== "ADMIN" && comment.authorId !== actor.id) {
    throw new HttpError(403, "Poți șterge doar propriile comentarii.");
  }

  await prisma.comment.delete({ where: { id: commentId } });
}
