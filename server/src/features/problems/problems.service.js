import { prisma } from "../../config/database.js";
import { HttpError } from "../../common/utils/httpError.js";
import { STATUS_TRANSITIONS, formatReportCode } from "./problems.constants.js";

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

export async function listCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, description: true },
  });
}

export async function createReport({ reporterId, title, description, categoryId, latitude, longitude, address }) {
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

  const report = await prisma.$transaction(async (tx) => {
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

  return withCode(report);
}

export async function listReports({ status, categoryId, reporterId, page, limit }) {
  const where = {
    ...(status ? { status } : {}),
    ...(categoryId ? { categoryId } : {}),
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
  