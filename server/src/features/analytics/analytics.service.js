import { prisma } from "../../config/database.js";
import { HttpError } from "../../common/utils/httpError.js";
import { formatReportCode } from "../problems/problems.constants.js";

const TERMINAL_STATUSES = ["RESOLVED", "REJECTED", "DUPLICATE"];

export async function getDashboardStats({ actor, institutionId, startDate, endDate }) {
  let targetInstitutionId = institutionId;

  if (actor.role === "STAFF") {
    const memberships = await prisma.membership.findMany({
      where: { userId: actor.id },
      select: { institutionId: true },
    });
    const allowedInstIds = memberships.map((m) => m.institutionId);

    if (targetInstitutionId && !allowedInstIds.includes(targetInstitutionId)) {
      throw new HttpError(403, "Nu ai acces la datele acestei instituții.");
    }
    if (!targetInstitutionId && allowedInstIds.length > 0) {
      targetInstitutionId = allowedInstIds[0];
    }
  }

  const dateFilter = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) dateFilter.lte = new Date(endDate);

  const reportWhere = {
    ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
    ...(targetInstitutionId
      ? { department: { institutionId: targetInstitutionId } }
      : {}),
  };

  // 1. Agregare statusuri
  const statusGroups = await prisma.report.groupBy({
    by: ["status"],
    where: reportWhere,
    _count: { _all: true },
  });

  const statusCounts = {};
  let totalReports = 0;
  let openReports = 0;
  let resolvedReports = 0;

  for (const group of statusGroups) {
    statusCounts[group.status] = group._count._all;
    totalReports += group._count._all;
    if (!TERMINAL_STATUSES.includes(group.status)) {
      openReports += group._count._all;
    }
    if (group.status === "RESOLVED" || group.status === "RESOLVED_PENDING_CONFIRMATION") {
      resolvedReports += group._count._all;
    }
  }

  // 2. Agregare prioritate (doar pe sesizările deschise)
  const priorityGroups = await prisma.report.groupBy({
    by: ["priority"],
    where: {
      ...reportWhere,
      status: { notIn: TERMINAL_STATUSES },
    },
    _count: { _all: true },
  });

  const priorityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  for (const group of priorityGroups) {
    priorityCounts[group.priority] = group._count._all;
  }

  // 3. Top categorii
  const categoryGroups = await prisma.report.groupBy({
    by: ["categoryId"],
    where: reportWhere,
    _count: { _all: true },
    orderBy: { _count: { categoryId: "desc" } },
    take: 6,
  });

  const categoryIds = categoryGroups.map((g) => g.categoryId);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, slug: true },
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const topCategories = categoryGroups.map((g) => ({
    category: categoryMap.get(g.categoryId) ?? { id: g.categoryId, name: "Necunoscut" },
    count: g._count._all,
    percentage: totalReports > 0 ? Number(((g._count._all / totalReports) * 100).toFixed(1)) : 0,
  }));

  // 4. Timpi medii de răspuns și rezolvare
  const reportsWithTimes = await prisma.report.findMany({
    where: {
      ...reportWhere,
      OR: [
        { firstResponseAt: { not: null } },
        { resolvedAt: { not: null } },
      ],
    },
    select: {
      createdAt: true,
      firstResponseAt: true,
      resolvedAt: true,
    },
  });

  let totalFirstResponseMs = 0;
  let firstResponseCount = 0;
  let totalResolutionMs = 0;
  let resolutionCount = 0;

  for (const r of reportsWithTimes) {
    if (r.firstResponseAt) {
      const diff = new Date(r.firstResponseAt).getTime() - new Date(r.createdAt).getTime();
      if (diff >= 0) {
        totalFirstResponseMs += diff;
        firstResponseCount++;
      }
    }
    if (r.resolvedAt) {
      const diff = new Date(r.resolvedAt).getTime() - new Date(r.createdAt).getTime();
      if (diff >= 0) {
        totalResolutionMs += diff;
        resolutionCount++;
      }
    }
  }

  const avgFirstResponseHours =
    firstResponseCount > 0
      ? Number((totalFirstResponseMs / (firstResponseCount * 1000 * 60 * 60)).toFixed(1))
      : null;

  const avgResolutionDays =
    resolutionCount > 0
      ? Number((totalResolutionMs / (resolutionCount * 1000 * 60 * 60 * 24)).toFixed(1))
      : null;

  // 5. Rata de confirmare cetățeni (RESOLVED vs REOPENED)
  const resolvedCount = statusCounts["RESOLVED"] ?? 0;
  const reopenedCount = statusCounts["REOPENED"] ?? 0;
  const confirmationTotal = resolvedCount + reopenedCount;
  const confirmationRate =
    confirmationTotal > 0
      ? Number(((resolvedCount / confirmationTotal) * 100).toFixed(1))
      : null;

  // 6. Evoluție lunară (ultimele 6 luni)
  const monthlyTrends = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);

    const monthCount = await prisma.report.count({
      where: {
        ...reportWhere,
        createdAt: { gte: d, lt: nextMonth },
        duplicateOfId: null,
      },
    });

    monthlyTrends.push({ month: monthKey, count: monthCount });
  }

  // 7. Sarcini repartizate utilizatorului curent (pentru STAFF)
  let staffAssigned = null;
  if (actor.role === "STAFF") {
    const [assignedCount, recentAssigned] = await Promise.all([
      prisma.report.count({
        where: {
          assigneeId: actor.id,
          status: { notIn: TERMINAL_STATUSES },
        },
      }),
      prisma.report.findMany({
        where: {
          assigneeId: actor.id,
          status: { notIn: TERMINAL_STATUSES },
        },
        orderBy: { priorityScore: "desc" },
        take: 5,
        select: {
          id: true,
          number: true,
          title: true,
          status: true,
          priority: true,
          priorityScore: true,
          address: true,
          createdAt: true,
        },
      }),
    ]);

    staffAssigned = {
      openCount: assignedCount,
      topPriorityTasks: recentAssigned.map((r) => ({
        ...r,
        code: formatReportCode(r.number),
      })),
    };
  }

  // 8. Reclamații formale (Complaints) count
  const complaintsWhere = targetInstitutionId ? { institutionId: targetInstitutionId } : {};
  const totalComplaints = await prisma.complaint.count({ where: complaintsWhere });
  const overdueComplaints = await prisma.complaint.count({
    where: { ...complaintsWhere, status: "OVERDUE" },
  });

  return {
    overview: {
      totalReports,
      openReports,
      resolvedReports,
      resolutionRatePercentage:
        totalReports > 0 ? Number(((resolvedReports / totalReports) * 100).toFixed(1)) : 0,
      totalComplaints,
      overdueComplaints,
    },
    performance: {
      avgFirstResponseHours,
      avgResolutionDays,
      citizenConfirmationRate: confirmationRate,
    },
    statusCounts,
    priorityCounts,
    topCategories,
    monthlyTrends,
    staffAssigned,
  };
}

export async function getInstitutionTransparency(idOrSlug) {
  const institution = await prisma.institution.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      profileStatus: true,
      description: true,
      contactEmail: true,
      responseDeadlineDays: true,
      departments: { select: { id: true, name: true } },
    },
  });

  if (!institution) throw new HttpError(404, "Instituția nu a fost găsită.");

  const departmentIds = institution.departments.map((d) => d.id);

  const reportWhere = {
    departmentId: { in: departmentIds },
  };

  const [totalReports, resolvedReports, confirmedReports] = await Promise.all([
    prisma.report.count({ where: reportWhere }),
    prisma.report.count({
      where: {
        ...reportWhere,
        status: { in: ["RESOLVED", "RESOLVED_PENDING_CONFIRMATION"] },
      },
    }),
    prisma.report.count({
      where: {
        ...reportWhere,
        status: "RESOLVED",
      },
    }),
  ]);

  // Timpi de răspuns
  const sampleReports = await prisma.report.findMany({
    where: {
      ...reportWhere,
      OR: [{ firstResponseAt: { not: null } }, { resolvedAt: { not: null } }],
    },
    select: { createdAt: true, firstResponseAt: true, resolvedAt: true },
    take: 100,
  });

  let sumResponseHours = 0;
  let countResponse = 0;
  let sumResolutionDays = 0;
  let countResolution = 0;

  for (const r of sampleReports) {
    if (r.firstResponseAt) {
      sumResponseHours += (new Date(r.firstResponseAt) - new Date(r.createdAt)) / (1000 * 60 * 60);
      countResponse++;
    }
    if (r.resolvedAt) {
      sumResolutionDays += (new Date(r.resolvedAt) - new Date(r.createdAt)) / (1000 * 60 * 60 * 24);
      countResolution++;
    }
  }

  const avgFirstResponseHours =
    countResponse > 0 ? Number((sumResponseHours / countResponse).toFixed(1)) : null;
  const avgResolutionDays =
    countResolution > 0 ? Number((sumResolutionDays / countResolution).toFixed(1)) : null;

  // Reclamații
  const [totalComplaints, answeredComplaints, overdueComplaints] = await Promise.all([
    prisma.complaint.count({ where: { institutionId: institution.id } }),
    prisma.complaint.count({ where: { institutionId: institution.id, status: "ANSWERED" } }),
    prisma.complaint.count({ where: { institutionId: institution.id, status: "OVERDUE" } }),
  ]);

  // Calcul scor de transparență & reputație (0–100)
  let score = 50; // bază
  if (totalReports > 0) {
    const resRate = resolvedReports / totalReports;
    score += Math.round(resRate * 30); // max +30
  }
  if (avgFirstResponseHours !== null) {
    if (avgFirstResponseHours <= 24) score += 15;
    else if (avgFirstResponseHours <= 72) score += 10;
  }
  if (totalComplaints > 0) {
    const overdueRatio = overdueComplaints / totalComplaints;
    score -= Math.round(overdueRatio * 25); // penalizare dacă sunt reclamații restante
  }
  score = Math.min(100, Math.max(10, score));
  const stars = Number(((score / 100) * 5).toFixed(1));

  return {
    institution: {
      id: institution.id,
      name: institution.name,
      slug: institution.slug,
      type: institution.type,
      profileStatus: institution.profileStatus,
      description: institution.description,
      departmentsCount: institution.departments.length,
    },
    transparencyScore: score,
    reputationRating: stars, // din 5.0 stele
    metrics: {
      totalReportsReceived: totalReports,
      resolvedReportsCount: resolvedReports,
      citizenConfirmedCount: confirmedReports,
      resolutionRatePercentage:
        totalReports > 0 ? Number(((resolvedReports / totalReports) * 100).toFixed(1)) : 0,
      avgFirstResponseHours,
      avgResolutionDays,
    },
    formalComplaints: {
      total: totalComplaints,
      answered: answeredComplaints,
      overdue: overdueComplaints,
    },
  };
}
