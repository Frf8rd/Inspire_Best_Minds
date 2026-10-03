import { prisma } from "../../config/database.js";
import { HttpError } from "../../common/utils/httpError.js";
import { STATUS_TRANSITIONS, formatReportCode } from "./problems.constants.js";
import crypto from "node:crypto";
import path from "node:path";
import { mkdir, unlink, writeFile } from "node:fs/promises";

import {
  findNearbyOpenDuplicate,
  calculatePriorityScore,
} from "./problems.intelligence.js";
import { createNotification } from "../notifications/notifications.service.js";

const withCode = (report) => {
  if (!report) return report;
  const res = { ...report, code: formatReportCode(report.number) };
  if (res.duplicateOf?.number) {
    res.duplicateOf = {
      ...res.duplicateOf,
      code: formatReportCode(res.duplicateOf.number),
    };
  }
  return res;
};

const listSelect = {
  id: true,
  number: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  priorityScore: true,
  duplicateOfId: true,
  duplicateOf: { select: { id: true, number: true } },
  supportCount: true,
  latitude: true,
  longitude: true,
  address: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, slug: true } },
  department: { select: { id: true, name: true, institutionId: true } },
};

const uploadsDirectory = path.resolve(process.cwd(), "uploads", "reports");

function inspectImage(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: "image/jpeg", extension: "jpg" };
  }
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { mimeType: "image/png", extension: "png" };
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { mimeType: "image/webp", extension: "webp" };
  }
  return null;
}

async function storePhotos(files, reportId, uploadedById) {
  if (!files.length) return [];
  await mkdir(uploadsDirectory, { recursive: true });
  const stored = [];
  try {
    for (const file of files) {
      const image = inspectImage(file.buffer);
      // Apărăm și împotriva unui fișier cu MIME fals declarat de client.
      if (!image || image.mimeType !== file.mimetype) {
        throw new HttpError(400, "Conținutul unei fotografii nu corespunde unui JPEG, PNG sau WebP valid.");
      }
      const filename = `${crypto.randomUUID()}.${image.extension}`;
      const relativePath = path.posix.join("uploads", "reports", filename);
      await writeFile(path.join(uploadsDirectory, filename), file.buffer, { flag: "wx" });
      stored.push({
        reportId,
        uploadedById,
        originalPath: relativePath,
        publicPath: `/${relativePath}`,
        sha256: crypto.createHash("sha256").update(file.buffer).digest("hex"),
        sizeBytes: file.size,
      });
    }
    return stored;
  } catch (error) {
    await Promise.allSettled(
      stored.map((photo) => unlink(path.join(process.cwd(), photo.originalPath)))
    );
    throw error;
  }
}

async function removeStoredPhotos(photos) {
  await Promise.allSettled(
    photos.map((photo) => unlink(path.join(process.cwd(), photo.originalPath)))
  );
}

async function assertReportOwnerOrAdmin(reportId, actor) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { id: true, reporterId: true },
  });
  if (!report) throw new HttpError(404, "Sesizarea nu există.");
  if (actor.role !== "ADMIN" && report.reporterId !== actor.id) {
    throw new HttpError(403, "Poți modifica sau șterge doar propriile sesizări.");
  }
  return report;
}

export async function listCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, description: true },
  });
}

export async function createReport({ reporterId, title, description, categoryId, latitude, longitude, address, photos = [] }) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category || !category.isActive) {
    throw new HttpError(400, "Categoria nu există.");
  }

  // Rutare: regula cu precedence cel mai mare pentru categoria respectivă.
  const rule = await prisma.routingRule.findFirst({
    where: { categoryId },
    orderBy: { precedence: "desc" },
    select: { departmentId: true },
  });

  // Inteligență: Căutare duplicate deschise în apropiere (ex: < 30m, 14 zile)
  const nearbyDuplicate = await findNearbyOpenDuplicate({
    latitude,
    longitude,
    categoryId,
  });

  const isDuplicate = Boolean(nearbyDuplicate);
  const parentReport = nearbyDuplicate?.report ?? null;

  // Scor prioritate inițial
  const initialPriority = isDuplicate
    ? { priorityScore: 0, priority: "LOW" }
    : calculatePriorityScore({
        supportCount: 0,
        createdAt: new Date(),
        categorySlug: category.slug,
      });

  let savedPhotos = [];
  let report;
  try {
    report = await prisma.$transaction(async (tx) => {
      const created = await tx.report.create({
        data: {
          title,
          description: description || null,
          latitude,
          longitude,
          address: address || null,
          reporterId,
          categoryId,
          departmentId: rule?.departmentId ?? null,
          status: isDuplicate ? "DUPLICATE" : "NEW",
          duplicateOfId: parentReport ? parentReport.id : null,
          priorityScore: initialPriority.priorityScore,
          priority: initialPriority.priority,
        },
        select: listSelect,
      });

      const initialComment = isDuplicate
        ? `Marcat automat ca duplicat al sesizării ${formatReportCode(parentReport.number)}.`
        : "Sesizarea a fost creată.";

      await tx.statusHistory.create({
        data: {
          reportId: created.id,
          fromStatus: null,
          toStatus: created.status,
          authorId: reporterId,
          comment: initialComment,
        },
      });

      // Dacă este duplicat, adăugăm automat un vot (+1) la sesizarea părinte și îi recalculăm prioritatea
      if (isDuplicate && parentReport) {
        const newParentSupport = parentReport.supportCount + 1;
        const parentPriority = calculatePriorityScore({
          supportCount: newParentSupport,
          createdAt: parentReport.createdAt,
          categorySlug: category.slug,
        });

        await tx.report.update({
          where: { id: parentReport.id },
          data: {
            supportCount: newParentSupport,
            priorityScore: parentPriority.priorityScore,
            priority: parentPriority.priority,
          },
        });
      }

      return created;
    });

    savedPhotos = await storePhotos(photos, report.id, reporterId);
    if (savedPhotos.length) {
      await prisma.photo.createMany({ data: savedPhotos });
    }
  } catch (error) {
    if (savedPhotos.length) await removeStoredPhotos(savedPhotos);
    if (report) await prisma.report.delete({ where: { id: report.id } }).catch(() => undefined);
    throw error;
  }

  return {
    problem: withCode(report),
    duplicate: isDuplicate,
    parentCode: parentReport ? formatReportCode(parentReport.number) : null,
  };
}

export async function listReports({ status, category, priority, zone, boundingBox, reporterId, page, limit }) {
  const where = {
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(category
      ? { category: { is: { OR: [{ id: category }, { slug: category }] } } }
      : {}),
    ...(zone ? { address: { contains: zone, mode: "insensitive" } } : {}),
    ...(boundingBox
      ? {
          latitude: { gte: boundingBox.minLatitude, lte: boundingBox.maxLatitude },
          longitude: { gte: boundingBox.minLongitude, lte: boundingBox.maxLongitude },
        }
      : {}),
    ...(reporterId ? { reporterId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.report.findMany({
      where,
      select: listSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.report.count({ where }),
  ]);

  return { items: items.map(withCode), total, page, limit };
}

export async function updateReport({ reportId, actor, data }) {
  await assertReportOwnerOrAdmin(reportId, actor);

  let departmentId;
  if (data.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category || !category.isActive) throw new HttpError(400, "Categoria nu există.");
    const rule = await prisma.routingRule.findFirst({
      where: { categoryId: data.categoryId },
      orderBy: { precedence: "desc" },
      select: { departmentId: true },
    });
    departmentId = rule?.departmentId ?? null;
  }

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: { ...data, ...(data.categoryId ? { departmentId, assigneeId: null } : {}) },
    select: listSelect,
  });
  return withCode(updated);
}

export async function deleteReport({ reportId, actor }) {
  await assertReportOwnerOrAdmin(reportId, actor);
  const photos = await prisma.photo.findMany({
    where: { reportId },
    select: { originalPath: true },
  });
  await prisma.report.delete({ where: { id: reportId } });
  await removeStoredPhotos(photos);
}

export async function getReportHistory(reportId) {
  const exists = await prisma.report.findUnique({ where: { id: reportId }, select: { id: true } });
  if (!exists) throw new HttpError(404, "Sesizarea nu există.");
  return prisma.statusHistory.findMany({
    where: { reportId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      fromStatus: true,
      toStatus: true,
      comment: true,
      createdAt: true,
      author: { select: { id: true, name: true } },
    },
  });
}

export async function getReport(id, currentUserId = null) {
  const report = await prisma.report.findUnique({
    where: { id },
    select: {
      ...listSelect,
      source: true,
      reporter: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
      firstResponseAt: true,
      resolvedAt: true,
      resolutionConfirmedAt: true,
      // originalPath rămâne privat; expunem doar varianta publică
      photos: { select: { id: true, kind: true, publicPath: true, createdAt: true } },
      history: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          fromStatus: true,
          toStatus: true,
          comment: true,
          createdAt: true,
          author: { select: { id: true, name: true } },
        },
      },
      confirmations: {
        select: {
          userId: true,
          type: true,
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });

  if (!report) throw new HttpError(404, "Sesizarea nu există.");

  const hasSupported = currentUserId
    ? report.confirmations.some((c) => c.userId === currentUserId && c.type === "SUPPORT")
    : false;

  const userConfirmation = currentUserId
    ? report.confirmations.find(
        (c) => c.userId === currentUserId && (c.type === "RESOLVED_YES" || c.type === "RESOLVED_NO")
      )?.type ?? null
    : null;

  const confirmationsSummary = {
    support: report.confirmations.filter((c) => c.type === "SUPPORT").length,
    resolvedYes: report.confirmations.filter((c) => c.type === "RESOLVED_YES").length,
    resolvedNo: report.confirmations.filter((c) => c.type === "RESOLVED_NO").length,
  };

  const { confirmations, _count, ...reportData } = report;

  return {
    ...withCode(reportData),
    hasSupported,
    userConfirmation,
    confirmationsSummary,
    commentsCount: _count?.comments ?? 0,
  };
}

export async function toggleSupport({ reportId, userId }) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      supportCount: true,
      createdAt: true,
      category: { select: { slug: true } },
    },
  });

  if (!report) throw new HttpError(404, "Sesizarea nu există.");

  const existing = await prisma.reportConfirmation.findUnique({
    where: {
      reportId_userId_type: {
        reportId,
        userId,
        type: "SUPPORT",
      },
    },
  });

  if (existing) {
    // Retrage susținerea (-1)
    const newCount = Math.max(0, report.supportCount - 1);
    const { priorityScore, priority } = calculatePriorityScore({
      supportCount: newCount,
      createdAt: report.createdAt,
      categorySlug: report.category?.slug,
    });

    const updated = await prisma.$transaction(async (tx) => {
      await tx.reportConfirmation.delete({
        where: { id: existing.id },
      });
      return tx.report.update({
        where: { id: reportId },
        data: {
          supportCount: newCount,
          priorityScore,
          priority,
        },
        select: { id: true, supportCount: true, priorityScore: true, priority: true },
      });
    });

    return { supported: false, supportCount: updated.supportCount, priorityScore: updated.priorityScore, priority: updated.priority };
  } else {
    // Adaugă susținerea (+1)
    const newCount = report.supportCount + 1;
    const { priorityScore, priority } = calculatePriorityScore({
      supportCount: newCount,
      createdAt: report.createdAt,
      categorySlug: report.category?.slug,
    });

    const updated = await prisma.$transaction(async (tx) => {
      await tx.reportConfirmation.create({
        data: {
          reportId,
          userId,
          type: "SUPPORT",
        },
      });
      return tx.report.update({
        where: { id: reportId },
        data: {
          supportCount: newCount,
          priorityScore,
          priority,
        },
        select: { id: true, supportCount: true, priorityScore: true, priority: true },
      });
    });

    return { supported: true, supportCount: updated.supportCount, priorityScore: updated.priorityScore, priority: updated.priority };
  }
}

export async function confirmResolution({ reportId, actor, confirmed, comment }) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { id: true, status: true },
  });

  if (!report) throw new HttpError(404, "Sesizarea nu există.");

  if (report.status !== "RESOLVED_PENDING_CONFIRMATION") {
    throw new HttpError(
      400,
      `Confirmarea rezolvării este permisă doar pentru sesizările în starea RESOLVED_PENDING_CONFIRMATION. Starea curentă este ${report.status}.`
    );
  }

  const toStatus = confirmed ? "RESOLVED" : "REOPENED";
  const confType = confirmed ? "RESOLVED_YES" : "RESOLVED_NO";
  const defaultComment = confirmed
    ? "Cetățeanul a confirmat rezolvarea sesizării."
    : "Cetățeanul a infirmat rezolvarea; sesizarea a fost redeschisă.";

  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    // Șterge voturile anterioare de rezolvare ale utilizatorului pe această sesizare
    await tx.reportConfirmation.deleteMany({
      where: {
        reportId,
        userId: actor.id,
        type: { in: ["RESOLVED_YES", "RESOLVED_NO"] },
      },
    });

    // Înregistrează confirmarea
    await tx.reportConfirmation.create({
      data: {
        reportId,
        userId: actor.id,
        type: confType,
      },
    });

    // Actualizează statusul sesizării
    const rep = await tx.report.update({
      where: { id: reportId },
      data: {
        status: toStatus,
        ...(confirmed ? { resolutionConfirmedAt: now } : {}),
      },
      select: listSelect,
    });

    // Înregistrează în istoric
    await tx.statusHistory.create({
      data: {
        reportId,
        fromStatus: "RESOLVED_PENDING_CONFIRMATION",
        toStatus,
        authorId: actor.id,
        comment: comment || defaultComment,
      },
    });

    return rep;
  });

  return withCode(updated);
}

/**
 * Schimbare de status de către personalul instituției.
 * ADMIN: orice sesizare. STAFF: doar sesizările departamentelor instituțiilor
 * în care are Membership.
 */
export async function changeStatus({ reportId, actor, toStatus, comment, assigneeId }) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { department: { select: { institutionId: true } } },
  });
  if (!report) throw new HttpError(404, "Sesizarea nu există.");

  const institutionId = report.department?.institutionId ?? null;

  if (actor.role !== "ADMIN") {
    if (!institutionId) {
      throw new HttpError(403, "Sesizarea nu este încă repartizată unei instituții.");
    }
    const membership = await prisma.membership.findUnique({
      where: { userId_institutionId: { userId: actor.id, institutionId } },
    });
    if (!membership) {
      throw new HttpError(403, "Nu faci parte din instituția responsabilă de această sesizare.");
    }
  }

  const allowed = STATUS_TRANSITIONS[report.status] ?? [];
  if (!allowed.includes(toStatus)) {
    throw new HttpError(400, `Tranziția ${report.status} → ${toStatus} nu este permisă.`);
  }

  if (assigneeId) {
    if (!institutionId) {
      throw new HttpError(400, "Sesizarea nu are o instituție căreia să-i poți atribui un responsabil.");
    }
    const assigneeMembership = await prisma.membership.findUnique({
      where: { userId_institutionId: { userId: assigneeId, institutionId } },
    });
    if (!assigneeMembership) {
      throw new HttpError(400, "Responsabilul trebuie să facă parte din instituția sesizării.");
    }
  }

  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const r = await tx.report.update({
      where: { id: reportId },
      data: {
        status: toStatus,
        ...(assigneeId ? { assigneeId } : {}),
        ...(report.firstResponseAt ? {} : { firstResponseAt: now }),
        ...(toStatus === "RESOLVED_PENDING_CONFIRMATION" ? { resolvedAt: now } : {}),
      },
      select: listSelect,
    });

    await tx.statusHistory.create({
      data: {
        reportId,
        fromStatus: report.status,
        toStatus,
        authorId: actor.id,
        comment: comment || null,
      },
    });

    return r;
  });

  const formatted = withCode(updated);

  // Notificare automată către autorul sesizării
  if (report.reporterId && report.reporterId !== actor.id) {
    createNotification({
      userId: report.reporterId,
      title: `Actualizare status ${formatted.code}`,
      message: `Sesizarea ta a trecut în starea "${toStatus}".`,
      type: "STATUS_CHANGE",
      link: `/problems/${reportId}`,
      sendEmailNotification: true,
    }).catch(() => null);
  }

  // Notificare către responsabil dacă a fost atribuit
  if (assigneeId && assigneeId !== actor.id) {
    createNotification({
      userId: assigneeId,
      title: `Nouă sarcină alocată: ${formatted.code}`,
      message: `Ți-a fost repartizată sesizarea: „${report.title}”.`,
      type: "ASSIGNMENT",
      link: `/problems/${reportId}`,
    }).catch(() => null);
  }

  return formatted;
}
