import { prisma } from "../../config/database.js";

/**
 * Calculează distanța ortodromică (Haversine) dintre două coordonate GPS, în metri.
 */
export function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // raza Pământului în metri
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Caută o sesizare deschisă similară în apropiere:
 * - aceeași categorie
 * - creată în ultimele DUPLICATE_WINDOW_DAYS zile (implicit 14)
 * - pe o rază sub DUPLICATE_RADIUS_M metri (implicit 30)
 * - status activ (nu RESOLVED, REJECTED sau DUPLICATE)
 * - nu este ea însăși un duplicat (duplicateOfId: null)
 */
export async function findNearbyOpenDuplicate({
  latitude,
  longitude,
  categoryId,
  radiusMeters = Number(process.env.DUPLICATE_RADIUS_M) || 30,
  windowDays = Number(process.env.DUPLICATE_WINDOW_DAYS) || 14,
}) {
  const sinceDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  // Filtrare rapidă folosind o casetă de delimitare (bounding box)
  const latDelta = radiusMeters / 111139;
  const lonDelta = radiusMeters / (111139 * Math.cos((latitude * Math.PI) / 180));

  const candidates = await prisma.report.findMany({
    where: {
      categoryId,
      createdAt: { gte: sinceDate },
      status: { notIn: ["RESOLVED", "REJECTED", "DUPLICATE"] },
      duplicateOfId: null,
      latitude: { gte: latitude - latDelta * 1.5, lte: latitude + latDelta * 1.5 },
      longitude: { gte: longitude - lonDelta * 1.5, lte: longitude + lonDelta * 1.5 },
    },
    select: {
      id: true,
      number: true,
      latitude: true,
      longitude: true,
      supportCount: true,
      createdAt: true, // necesar pentru recalcularea corectă a priorității părintelui
    },
  });

  let closest = null;
  let minDistance = Infinity;

  for (const candidate of candidates) {
    const distance = haversineDistanceMeters(
      latitude,
      longitude,
      candidate.latitude,
      candidate.longitude
    );
    if (distance <= radiusMeters && distance < minDistance) {
      minDistance = distance;
      closest = candidate;
    }
  }

  return closest ? { report: closest, distance: minDistance } : null;
}

/**
 * Calculează scorul de prioritate 0–100 și prioritatea corespunzătoare:
 * ≥ 75 -> CRITICAL
 * ≥ 50 -> HIGH
 * ≥ 25 -> MEDIUM
 * < 25 -> LOW
 */
export function calculatePriorityScore({
  supportCount = 0,
  createdAt = new Date(),
  categorySlug = "",
  aiSeverity = null, // severitate estimată de AI din fotografii
}) {
  let score = 10; // scor de bază inițial

  // 1. Număr susțineri / voturi cetățeni (max 40 puncte)
  score += Math.min(40, supportCount * 5);

  // 2. Vechime tichet deschis (max 30 puncte, ~2 pct pe zi)
  const ageInDays = Math.max(
    0,
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  score += Math.min(30, Math.floor(ageInDays * 2));

  // 3. Ponderare după tipul categoriei (max 20 puncte)
  const slug = (categorySlug || "").toLowerCase();
  if (
    slug.includes("drum") ||
    slug.includes("gropi") ||
    slug.includes("avarie") ||
    slug.includes("pericol") ||
    slug.includes("siguranta")
  ) {
    score += 20;
  } else if (
    slug.includes("iluminat") ||
    slug.includes("salubrizare") ||
    slug.includes("canalizare")
  ) {
    score += 10;
  }

  // 4. Pericol estimat de AI din fotografii (max 15 puncte)
  if (aiSeverity === "CRITICAL") score += 15;
  else if (aiSeverity === "HIGH") score += 8;

  score = Math.min(100, Math.max(0, score));

  let priority = "LOW";
  if (score >= 75) priority = "CRITICAL";
  else if (score >= 50) priority = "HIGH";
  else if (score >= 25) priority = "MEDIUM";

  return { priorityScore: score, priority };
}

/**
 * Calculează zonele recurente pe o grilă spațială.
 * Sesizările marcate DUPLICATE nu se numără.
 */
export async function calculateRecurringZones({
  months = 3,
  cellMeters = 150,
  minCount = 3,
  limit = 50,
  refLat = 47,
  institutionId = null,
}) {
  const since = new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000);

  const reports = await prisma.report.findMany({
    where: {
      createdAt: { gte: since },
      duplicateOfId: null,
      status: { not: "DUPLICATE" },
      ...(institutionId ? { department: { institutionId } } : {}),
    },
    select: {
      id: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  const metersPerDegLat = 111139;
  const metersPerDegLon = 111139 * Math.cos((refLat * Math.PI) / 180);

  const gridMap = new Map();

  for (const report of reports) {
    const cellY = Math.floor((report.latitude * metersPerDegLat) / cellMeters);
    const cellX = Math.floor((report.longitude * metersPerDegLon) / cellMeters);
    const key = `${cellX}:${cellY}:${report.category.id}`;

    if (!gridMap.has(key)) {
      gridMap.set(key, {
        category: report.category,
        count: 0,
        sumLat: 0,
        sumLon: 0,
        firstReportAt: report.createdAt,
        lastReportAt: report.createdAt,
      });
    }

    const cell = gridMap.get(key);
    cell.count += 1;
    cell.sumLat += report.latitude;
    cell.sumLon += report.longitude;
    if (new Date(report.createdAt) < new Date(cell.firstReportAt)) {
      cell.firstReportAt = report.createdAt;
    }
    if (new Date(report.createdAt) > new Date(cell.lastReportAt)) {
      cell.lastReportAt = report.createdAt;
    }
  }

  const zones = [];
  for (const cell of gridMap.values()) {
    if (cell.count >= minCount) {
      zones.push({
        latitude: Number((cell.sumLat / cell.count).toFixed(6)),
        longitude: Number((cell.sumLon / cell.count).toFixed(6)),
        count: cell.count,
        category: cell.category,
        firstReportAt: cell.firstReportAt,
        lastReportAt: cell.lastReportAt,
      });
    }
  }

  zones.sort((a, b) => b.count - a.count);

  return {
    since: since.toISOString(),
    periodMonths: months,
    cellMeters,
    minCount,
    zones: zones.slice(0, limit),
  };
}

/**
 * Recalculează periodic scorul de prioritate pentru toate sesizările active deschise.
 */
export async function recalculateOpenReportsPriorities() {
  const openReports = await prisma.report.findMany({
    where: {
      status: { notIn: ["RESOLVED", "REJECTED", "DUPLICATE"] },
    },
    select: {
      id: true,
      createdAt: true,
      supportCount: true,
      priorityScore: true,
      priority: true,
      aiSeverity: true,
      category: { select: { slug: true } },
    },
  });

  let updatedCount = 0;
  for (const report of openReports) {
    const { priorityScore, priority } = calculatePriorityScore({
      supportCount: report.supportCount,
      createdAt: report.createdAt,
      categorySlug: report.category?.slug,
      aiSeverity: report.aiSeverity,
    });

    if (report.priorityScore !== priorityScore || report.priority !== priority) {
      await prisma.report.update({
        where: { id: report.id },
        data: { priorityScore, priority },
      });
      updatedCount++;
    }
  }

  return { totalChecked: openReports.length, updated: updatedCount };
}

/**
 * Inițializează jobul orar de recalculare prioritate.
 */
export function startPriorityRecalculationJob(intervalMs = 60 * 60 * 1000) {
  const timer = setInterval(async () => {
    try {
      await recalculateOpenReportsPriorities();
    } catch (err) {
      console.error("[CRON] Priority recalculation error:", err);
    }
  }, intervalMs);
  timer.unref();
  return timer;
}

