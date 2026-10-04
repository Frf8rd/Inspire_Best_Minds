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

// Variantă publică (servită static prin /uploads) și original privat (NU e servit static).
const uploadsDirectory = path.resolve(process.cwd(), "uploads", "reports");
const privateDirectory = path.resolve(process.cwd(), "private-uploads", "reports");

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

// Salvează fișierele pe disc ÎNAINTE de tranzacția DB și întoarce rândurile pentru Photo
// (fără reportId, care se adaugă în tranzacție). Originalul merge într-un folder privat,
// iar în /uploads ajunge doar copia publică. (Blur-ul pentru fețe/numere se poate adăuga
// aici, între cele două scrieri, fără alte modificări.)
async function storePhotos(files, uploadedById) {
  if (!files.length) return [];
  await mkdir(uploadsDirectory, { recursive: true });
  await mkdir(privateDirectory, { recursive: true });
  const stored = [];
  try {
    for (const file of files) {
      const image = inspectImage(file.buffer);
      // Apărăm și împotriva unui fișier cu MIME fals declarat de client.
      if (!image || image.mimeType !== file.mimetype) {
        throw new HttpError(400, "Conținutul unei fotografii nu corespunde unui JPEG, PNG sau WebP valid.");
      }
      const filename = `${crypto.randomUUID()}.${image.extension}`;
      const photo = {
        uploadedById,
        originalPath: path.posix.join("private-uploads", "reports", filename),
        publicPath: `/${path.posix.join("uploads", "reports", filename)}`,
        sha256: crypto.createHash("sha256").update(file.buffer).digest("hex"),
        sizeBytes: file.size,
      };
      // Îl adăugăm înainte de scriere, ca la eroare să curățăm și fișierele parțiale.
      stored.push(photo);
      await writeFile(path.join(privateDirectory, filename), file.buffer, { flag: "wx" });
      await writeFile(path.join(uploadsDirectory, filename), file.buffer, { flag: "wx" });
    }
    return stored;
  } catch (error) {
    await removeStoredPhotos(stored);
    throw error;
  }
}

async function removeStoredPhotos(photos) {
  const paths = photos.flatMap((photo) => [
    photo.originalPath,
    photo.publicPath ? photo.publicPath.replace(/^\//, "") : null,
  ]);
  await Promise.allSettled(
    [...new Set(paths.filter(Boolean))].map((relative) => unlink(path.join(process.cwd(), relative)))
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

export async function listCategories(includeInactive = false) {
  return prisma.category.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createCategory({ name, slug, description }) {
  if (!name) throw new HttpError(400, "Numele categoriei este obligatoriu.");
  const cleanSlug = (slug || name).toLowerCase().trim().replace(/\s+/g, "-");
  const existing = await prisma.category.findFirst({
    where: { OR: [{ name }, { slug: cleanSlug }] },
  });
  if (existing) throw new HttpError(400, "O categorie cu acest nume sau slug există deja.");

  return prisma.category.create({
    data: {
      name,
      slug: cleanSlug,
      description: description || null,
      isActive: true,
    },
  });
}

export async function updateCategory(id, { name, slug, description, isActive }) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Categoria nu există.");

  const cleanSlug = slug ? slug.toLowerCase().trim().replace(/\s+/g, "-") : undefined;

  return prisma.category.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(cleanSlug ? { slug: cleanSlug } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
    },
  });
}

export async function deleteCategory(id) {
  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { reports: true, routingRules: true } } },
  });
  if (!existing) throw new HttpError(404, "Categoria nu există.");

  if (existing._count.reports > 0 || existing._count.routingRules > 0) {
    return prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }

  return prisma.category.delete({ where: { id } });
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

  // Fotografiile se validează și se salvează înainte de tranzacție; în tranzacție se scriu
  // doar rândurile din DB. Dacă ceva eșuează, se anulează tot (inclusiv +1 la părinte).
  const savedPhotos = await storePhotos(photos, reporterId);
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

      if (savedPhotos.length) {
        await tx.photo.createMany({
          data: savedPhotos.map((photo) => ({ ...photo, reportId: created.id })),
        });
      }

      return created;
    });
  } catch (error) {
    await removeStoredPhotos(savedPhotos);
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
  let priorityData = {};
  if (data.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category || !category.isActive) throw new HttpError(400, "Categoria nu există.");
    const rule = await prisma.routingRule.findFirst({
      where: { categoryId: data.categoryId },
      orderBy: { precedence: "desc" },
      select: { departmentId: true },
    });
    departmentId = rule?.departmentId ?? null;

    const current = await prisma.report.findUnique({
      where: { id: reportId },
      select: { supportCount: true, createdAt: true },
    });
    if (current) {
      const p = calculatePriorityScore({
        supportCount: current.supportCount,
        createdAt: current.createdAt,
        categorySlug: category.slug,
      });
      priorityData = { priorityScore: p.priorityScore, priority: p.priority };
    }
  }

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      ...data,
      ...priorityData,
      ...(data.categoryId ? { departmentId, assigneeId: null } : {}),
    },
    select: listSelect,
  });
  return withCode(updated);
}

export async function deleteReport({ reportId, actor }) {
  await assertReportOwnerOrAdmin(reportId, actor);

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      duplicateOfId: true,
      duplicates: {
        select: {
          id: true,
          supportCount: true,
          createdAt: true,
          category: { select: { slug: true } },
        },
      },
    },
  });

  if (!report) throw new HttpError(404, "Sesizarea nu există.");

  const photos = await prisma.photo.findMany({
    where: { reportId },
    select: { originalPath: true, publicPath: true },
  });

  await prisma.$transaction(async (tx) => {
    // 1. Dacă sesizarea ștearsă este un duplicat, scădem supportCount-ul sesizării principale și îi recalculăm prioritatea
    if (report.duplicateOfId) {
      const parent = await tx.report.findUnique({
        where: { id: report.duplicateOfId },
        select: {
          id: true,
          supportCount: true,
          createdAt: true,
          category: { select: { slug: true } },
        },
      });

      if (parent) {
        const newSupport = Math.max(0, parent.supportCount - 1);
        const { priorityScore, priority } = calculatePriorityScore({
          supportCount: newSupport,
          createdAt: parent.createdAt,
          categorySlug: parent.category?.slug,
        });

        await tx.report.update({
          where: { id: parent.id },
          data: {
            supportCount: newSupport,
            priorityScore,
            priority,
          },
        });
      }
    }

    // 2. Dacă sesizarea ștearsă este principală și are duplicate, reactivăm duplicatele ca independente
    if (report.duplicates && report.duplicates.length > 0) {
      for (const child of report.duplicates) {
        const childPriority = calculatePriorityScore({
          supportCount: child.supportCount,
          createdAt: child.createdAt,
          categorySlug: child.category?.slug,
        });

        await tx.report.update({
          where: { id: child.id },
          data: {
            duplicateOfId: null,
            status: "NEW",
            priorityScore: childPriority.priorityScore,
            priority: childPriority.priority,
          },
        });

        await tx.statusHistory.create({
          data: {
            reportId: child.id,
            fromStatus: "DUPLICATE",
            toStatus: "NEW",
            authorId: actor.id,
            comment: "Sesizarea principală a fost ștearsă; sesizarea a fost reactivată din starea de duplicat în starea NOU.",
          },
        });
      }
    }

    await tx.report.delete({ where: { id: reportId } });
  });

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
    select: {
      id: true,
      status: true,
      reporterId: true,
      categoryId: true,
      createdAt: true,
      supportCount: true,
      category: { select: { slug: true } },
    },
  });

  if (!report) throw new HttpError(404, "Sesizarea nu există.");

  if (report.status !== "RESOLVED_PENDING_CONFIRMATION") {
    throw new HttpError(
      400,
      `Confirmarea rezolvării este permisă doar pentru sesizările în starea RESOLVED_PENDING_CONFIRMATION. Starea curentă este ${report.status}.`
    );
  }

  // Verificare permisiune: doar autorul, susținătorii (+1) sau administratorii
  if (actor.role !== "ADMIN" && report.reporterId !== actor.id) {
    const isSupporter = await prisma.reportConfirmation.findUnique({
      where: {
        reportId_userId_type: {
          reportId,
          userId: actor.id,
          type: "SUPPORT",
        },
      },
    });
    if (!isSupporter) {
      throw new HttpError(
        403,
        "Doar autorul sesizării sau cetățenii care au susținut-o pot confirma sau infirma rezolvarea."
      );
    }
  }

  const toStatus = confirmed ? "RESOLVED" : "REOPENED";
  const confType = confirmed ? "RESOLVED_YES" : "RESOLVED_NO";
  const defaultComment = confirmed
    ? "Cetățeanul a confirmat rezolvarea sesizării."
    : "Cetățeanul a infirmat rezolvarea; sesizarea a fost redeschisă.";

  const now = new Date();

  // Dacă sesizarea e redeschisă, recalculăm prioritatea; dacă e confirmată rezolvată, prioritatea devine LOW / scor 0
  const priorityData = confirmed
    ? { priorityScore: 0, priority: "LOW" }
    : calculatePriorityScore({
        supportCount: report.supportCount,
        createdAt: report.createdAt,
        categorySlug: report.category?.slug,
      });

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
        priorityScore: priorityData.priorityScore,
        priority: priorityData.priority,
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
    include: {
      department: { select: { institutionId: true } },
      category: { select: { slug: true } },
    },
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

  // Recalculare prioritate la schimbarea de status
  let priorityData = {};
  if (toStatus === "RESOLVED" || toStatus === "REJECTED") {
    priorityData = { priorityScore: 0, priority: "LOW" };
  } else {
    const p = calculatePriorityScore({
      supportCount: report.supportCount,
      createdAt: report.createdAt,
      categorySlug: report.category?.slug,
    });
    priorityData = { priorityScore: p.priorityScore, priority: p.priority };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const r = await tx.report.update({
      where: { id: reportId },
      data: {
        status: toStatus,
        ...priorityData,
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

/**
 * Calea pe disc a pozei ORIGINALE. Accesibilă doar autorului sesizării, adminului
 * și personalului (STAFF) din instituția responsabilă.
 */
export async function getOriginalPhotoPath({ reportId, photoId, actor }) {
  const photo = await prisma.photo.findFirst({
    where: { id: photoId, reportId },
    select: {
      originalPath: true,
      report: {
        select: { reporterId: true, department: { select: { institutionId: true } } },
      },
    },
  });
  if (!photo) throw new HttpError(404, "Fotografia nu există.");

  let allowed = actor.role === "ADMIN" || photo.report.reporterId === actor.id;
  const institutionId = photo.report.department?.institutionId;
  if (!allowed && actor.role === "STAFF" && institutionId) {
    const membership = await prisma.membership.findUnique({
      where: { userId_institutionId: { userId: actor.id, institutionId } },
    });
    allowed = Boolean(membership);
  }
  if (!allowed) throw new HttpError(403, "Nu ai acces la fotografia originală.");

  return path.resolve(process.cwd(), photo.originalPath);
}