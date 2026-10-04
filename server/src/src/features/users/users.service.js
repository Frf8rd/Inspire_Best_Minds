import { prisma } from "../../config/database.js";
import { HttpError } from "../../common/utils/httpError.js";

export async function listUsers({ page = 1, limit = 20, search, role, isActive }) {
  const where = {
    ...(role ? { role } : {}),
    ...(isActive !== undefined ? { isActive: isActive === "true" || isActive === true } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          select: {
            id: true,
            role: true,
            institution: { select: { id: true, name: true, slug: true } },
            department: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: {
            reportsCreated: true,
            reportsAssigned: true,
            comments: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, limit };
}

export async function getUser(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      memberships: {
        select: {
          id: true,
          role: true,
          institution: { select: { id: true, name: true, slug: true } },
          department: { select: { id: true, name: true } },
        },
      },
      _count: {
        select: {
          reportsCreated: true,
          reportsAssigned: true,
          comments: true,
          confirmations: true,
        },
      },
    },
  });

  if (!user) throw new HttpError(404, "Utilizatorul nu a fost găsit.");
  return user;
}

export async function updateUserRole(id, role, actor) {
  const validRoles = ["CITIZEN", "STAFF", "ADMIN"];
  if (!validRoles.includes(role)) {
    throw new HttpError(400, "Rol invalid. Valori permise: 'CITIZEN', 'STAFF', 'ADMIN'.");
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new HttpError(404, "Utilizatorul nu există.");

  // Prevenim eliminarea ultimului administrator
  if (user.role === "ADMIN" && role !== "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN", isActive: true } });
    if (adminCount <= 1) {
      throw new HttpError(400, "Nu poți retrograda ultimul administrator activ al platformei.");
    }
  }

  return prisma.user.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      updatedAt: true,
    },
  });
}

export async function updateUserStatus(id, isActive, actor) {
  if (typeof isActive !== "boolean") {
    throw new HttpError(400, "Câmpul 'isActive' (boolean: true/false) este obligatoriu.");
  }

  if (id === actor.id && !isActive) {
    throw new HttpError(400, "Nu îți poți dezactiva propriul cont de administrator.");
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new HttpError(404, "Utilizatorul nu există.");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Dacă utilizatorul a fost dezactivat, revocăm imediat toate refresh token-urile active
    if (!isActive) {
      await tx.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return updated;
  });
}
