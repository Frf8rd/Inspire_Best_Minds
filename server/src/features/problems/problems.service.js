import { prisma } from "../../config/database.js";
import { HttpError } from "../../common/utils/httpError.js";
import { STATUS_TRANSITIONS, formatReportCode } from "./problems.constants.js";
import crypto from "node:crypto";
import path from "node:path";
import { mkdir, unlink, writeFile } from "node:fs/promises";

const withCode = (report) => (report ? { ...report, code: formatReportCode(report.number) } : report);

const listSelect = {
  id: true,
  number: true,
  title: true,
  description: true,
  status: true,
  priority: true,
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
        },
        select: listSelect,
      });

      await tx.statusHistory.create({
        data: {
          reportId: created.id,
          fromStatus: null,
          toStatus: created.status,
          authorId: reporterId,
          comment: "Sesizarea a fost creată.",
        },
      });
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

  return withCode(report);
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

export async function getReport(id) {
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
    },
  });

  if (!report) throw new HttpError(404, "Sesizarea nu există.");
  return withCode(report);
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

  return withCode(updated);
}
