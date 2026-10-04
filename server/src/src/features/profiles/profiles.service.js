import path from "node:path";
import crypto from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { prisma } from "../../config/database.js";
import { HttpError } from "../../common/utils/httpError.js";
import { inspectImage } from "../../common/utils/image.js";
import { moderateAvatar } from "../ai/ai.service.js";
import { formatReportCode } from "../problems/problems.constants.js";

const avatarsDirectory = path.resolve(process.cwd(), "uploads", "avatars");
export const avatarUrlOf = (avatarPath) => (avatarPath ? `/${avatarPath}` : null);

async function computeStats(userId) {
  const [created, resolved, supportsGiven, comments, received] = await Promise.all([
    prisma.report.count({ where: { reporterId: userId, status: { not: "DUPLICATE" } } }),
    prisma.report.count({ where: { reporterId: userId, status: "RESOLVED" } }),
    prisma.reportConfirmation.count({ where: { userId, type: "SUPPORT" } }),
    prisma.comment.count({ where: { authorId: userId, visibility: "PUBLIC" } }),
    prisma.report.aggregate({ where: { reporterId: userId }, _sum: { supportCount: true } }),
  ]);
  const supportsReceived = received._sum.supportCount ?? 0;
  return {
    reportsCreated: created,
    reportsResolved: resolved,
    supportsGiven,
    supportsReceived,
    commentsCount: comments,
    // Scor simplu de reputație civică, calculat din date (nu se stochează)
    reputation: created + resolved * 3 + supportsReceived + Math.floor(supportsGiven / 2),
  };
}

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  role: u.role,
  bio: u.bio ?? null,
  avatarUrl: avatarUrlOf(u.avatarPath),
  createdAt: u.createdAt,
});

async function recentReports(userId, limit = 10) {
  const items = await prisma.report.findMany({
    where: { reporterId: userId, duplicateOfId: null },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true, number: true, title: true, status: true, priority: true, createdAt: true,
      category: { select: { id: true, name: true, slug: true } },
    },
  });
  return items.map((r) => ({ ...r, code: formatReportCode(r.number) }));
}

export async function getMyProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: {
          institution: { select: { id: true, name: true, slug: true, type: true } },
          department: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!user) throw new HttpError(404, "Utilizatorul nu a fost găsit.");
  const [stats, reports] = await Promise.all([computeStats(userId), recentReports(userId)]);
  return {
    ...publicUser(user),
    email: user.email,
    phone: user.phone ?? null,
    isActive: user.isActive,
    memberships: user.memberships.map((m) => ({
      id: m.id, role: m.role, institution: m.institution, department: m.department,
    })),
    stats,
    recentReports: reports,
  };
}

export async function getPublicProfile(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) throw new HttpError(404, "Profilul nu există.");
  const [stats, reports] = await Promise.all([computeStats(userId), recentReports(userId)]);
  // Fără email/telefon în profilul public
  return { ...publicUser(user), stats, recentReports: reports };
}

const removeFile = (relativePath) =>
  relativePath ? unlink(path.join(process.cwd(), relativePath)).catch(() => undefined) : undefined;

export async function setAvatar(userId, file) {
  if (!file) throw new HttpError(400, "Încarcă o imagine în câmpul 'avatar'.");
  const image = inspectImage(file.buffer);
  if (!image || image.mimeType !== file.mimetype) {
    throw new HttpError(400, "Fișierul nu este un JPEG, PNG sau WebP valid.");
  }

  const moderation = await moderateAvatar(file.buffer);
  if (!moderation.allowed) {
    throw new HttpError(422, "Imaginea a fost respinsă: conține conținut nepotrivit.");
  }

  await mkdir(avatarsDirectory, { recursive: true });
  const filename = `${crypto.randomUUID()}.${image.extension}`;
  const relativePath = path.posix.join("uploads", "avatars", filename);
  await writeFile(path.join(avatarsDirectory, filename), file.buffer, { flag: "wx" });

  const previous = await prisma.user.findUnique({ where: { id: userId }, select: { avatarPath: true } });
  try {
    await prisma.user.update({ where: { id: userId }, data: { avatarPath: relativePath } });
  } catch (error) {
    await removeFile(relativePath);
    throw error;
  }
  await removeFile(previous?.avatarPath);
  return { avatarUrl: avatarUrlOf(relativePath), moderated: moderation.checked };
}

export async function removeAvatar(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { avatarPath: true } });
  if (!user) throw new HttpError(404, "Utilizatorul nu a fost găsit.");
  await prisma.user.update({ where: { id: userId }, data: { avatarPath: null } });
  await removeFile(user.avatarPath);
}
