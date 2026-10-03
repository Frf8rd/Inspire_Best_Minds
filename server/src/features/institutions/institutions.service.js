import { prisma } from "../../config/database.js";
import { HttpError } from "../../common/utils/httpError.js";

export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function assertCanManageInstitution(actor, institutionId) {
  if (!actor) throw new HttpError(401, "Neautorizat.");
  if (actor.role === "ADMIN") return true;
  if (actor.role !== "STAFF") {
    throw new HttpError(403, "Nu ai permisiuni de administrare.");
  }
  const membership = await prisma.membership.findUnique({
    where: {
      userId_institutionId: {
        userId: actor.id,
        institutionId,
      },
    },
  });
  if (!membership || membership.role !== "MANAGER") {
    throw new HttpError(403, "Trebuie să fii MANAGER al acestei instituții pentru această acțiune.");
  }
  return true;
}

export async function listInstitutions({ type, search }) {
  const where = {
    ...(type ? { type } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  return prisma.institution.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      profileStatus: true,
      description: true,
      contactEmail: true,
      contactPhone: true,
      website: true,
      responseDeadlineDays: true,
      parentId: true,
      parent: { select: { id: true, name: true, slug: true } },
      departments: { select: { id: true, name: true, contactEmail: true } },
      _count: {
        select: {
          departments: true,
          memberships: true,
        },
      },
    },
  });
}

export async function getInstitution(idOrSlug, actor = null) {
  const institution = await prisma.institution.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      children: { select: { id: true, name: true, slug: true, type: true } },
      departments: {
        select: {
          id: true,
          name: true,
          contactEmail: true,
          _count: { select: { reports: true } },
        },
      },
      memberships: {
        select: {
          id: true,
          role: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true, role: true } },
          department: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!institution) throw new HttpError(404, "Instituția nu a fost găsită.");

  // Membrii detaliați sunt expuși doar pentru ADMIN sau membrii instituției
  const canSeeMembers =
    actor &&
    (actor.role === "ADMIN" ||
      institution.memberships.some((m) => m.user.id === actor.id));

  if (!canSeeMembers) {
    const { memberships, ...publicData } = institution;
    return {
      ...publicData,
      membersCount: memberships.length,
    };
  }

  return institution;
}

export async function createInstitution(data) {
  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (name.length < 2) throw new HttpError(400, "Numele instituției este obligatoriu (min 2 caractere).");

  let slug = data.slug ? slugify(data.slug) : slugify(name);
  if (!slug) slug = `inst-${Date.now()}`;

  const existing = await prisma.institution.findUnique({ where: { slug } });
  if (existing) throw new HttpError(409, "O instituție cu acest slug există deja.");

  const validTypes = [
    "MUNICIPALITY",
    "DISTRICT_COUNCIL",
    "MUNICIPAL_SERVICE",
    "UTILITY",
    "CONTRACTOR",
    "OTHER",
  ];
  const type = validTypes.includes(data.type) ? data.type : "MUNICIPAL_SERVICE";

  return prisma.institution.create({
    data: {
      name,
      slug,
      type,
      profileStatus: data.profileStatus || "UNCLAIMED",
      description: data.description || null,
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null,
      website: data.website || null,
      responseDeadlineDays: Number(data.responseDeadlineDays) || 30,
      parentId: data.parentId || null,
    },
    include: {
      departments: true,
      parent: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function updateInstitution(id, data, actor) {
  await assertCanManageInstitution(actor, id);

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.contactEmail !== undefined) updateData.contactEmail = data.contactEmail || null;
  if (data.contactPhone !== undefined) updateData.contactPhone = data.contactPhone || null;
  if (data.website !== undefined) updateData.website = data.website || null;
  if (data.responseDeadlineDays !== undefined) {
    updateData.responseDeadlineDays = Math.max(1, Number(data.responseDeadlineDays) || 30);
  }

  // Doar ADMIN poate schimba tipul, slug-ul sau ierarhia părinte
  if (actor.role === "ADMIN") {
    if (data.type) updateData.type = data.type;
    if (data.profileStatus) updateData.profileStatus = data.profileStatus;
    if (data.parentId !== undefined) updateData.parentId = data.parentId || null;
    if (data.slug) updateData.slug = slugify(data.slug);
  }

  return prisma.institution.update({
    where: { id },
    data: updateData,
    include: {
      departments: true,
      parent: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function addDepartment(institutionId, data, actor) {
  await assertCanManageInstitution(actor, institutionId);

  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!name) throw new HttpError(400, "Numele departamentului este obligatoriu.");

  const existing = await prisma.department.findUnique({
    where: { institutionId_name: { institutionId, name } },
  });
  if (existing) throw new HttpError(409, "Un departament cu acest nume există deja în această instituție.");

  return prisma.department.create({
    data: {
      institutionId,
      name,
      contactEmail: data.contactEmail || null,
    },
  });
}

export async function deleteDepartment(institutionId, departmentId, actor) {
  await assertCanManageInstitution(actor, institutionId);

  const dept = await prisma.department.findUnique({
    where: { id: departmentId },
    include: { _count: { select: { reports: true } } },
  });
  if (!dept || dept.institutionId !== institutionId) {
    throw new HttpError(404, "Departamentul nu a fost găsit în această instituție.");
  }
  if (dept._count.reports > 0) {
    throw new HttpError(400, "Nu poți șterge un departament care are deja sesizări atribuite.");
  }

  await prisma.department.delete({ where: { id: departmentId } });
}

export async function addOrUpdateMember(institutionId, { userId, email, departmentId, role = "HANDLER" }, actor) {
  await assertCanManageInstitution(actor, institutionId);

  let targetUserId = userId;
  const normalizedEmail = typeof email === "string" ? email.toLowerCase().trim() : null;
  if (!targetUserId && normalizedEmail) {
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) throw new HttpError(404, `Utilizatorul cu emailul ${normalizedEmail} nu există.`);
    targetUserId = user.id;
  }
  if (!targetUserId) throw new HttpError(400, "userId sau email este obligatoriu.");

  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) throw new HttpError(404, "Utilizatorul nu există.");

  if (departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept || dept.institutionId !== institutionId) {
      throw new HttpError(400, "Departamentul specificat nu aparține acestei instituții.");
    }
  }

  const validRoles = ["HANDLER", "MANAGER"];
  const finalRole = validRoles.includes(role) ? role : "HANDLER";

  return prisma.$transaction(async (tx) => {
    // Dacă userul este CITIZEN, îl promovăm automat la STAFF
    if (user.role === "CITIZEN") {
      await tx.user.update({
        where: { id: targetUserId },
        data: { role: "STAFF" },
      });
    }

    const membership = await tx.membership.upsert({
      where: {
        userId_institutionId: {
          userId: targetUserId,
          institutionId,
        },
      },
      update: {
        departmentId: departmentId || null,
        role: finalRole,
      },
      create: {
        userId: targetUserId,
        institutionId,
        departmentId: departmentId || null,
        role: finalRole,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        department: { select: { id: true, name: true } },
      },
    });

    return membership;
  });
}

export async function removeMember(institutionId, userId, actor) {
  await assertCanManageInstitution(actor, institutionId);

  const membership = await prisma.membership.findUnique({
    where: { userId_institutionId: { userId, institutionId } },
  });
  if (!membership) throw new HttpError(404, "Membrul nu a fost găsit în această instituție.");

  await prisma.membership.delete({
    where: { id: membership.id },
  });

  // Dacă utilizatorul nu mai are niciun membership și nu e ADMIN, îl readucem la CITIZEN
  const remaining = await prisma.membership.count({ where: { userId } });
  if (remaining === 0) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user && user.role === "STAFF") {
      await prisma.user.update({
        where: { id: userId },
        data: { role: "CITIZEN" },
      });
    }
  }
}

// ==========================================
// REGULI DE RUTARE (ROUTING RULES)
// ==========================================

export async function listRoutingRules() {
  return prisma.routingRule.findMany({
    orderBy: [{ categoryId: "asc" }, { precedence: "desc" }],
    include: {
      category: { select: { id: true, name: true, slug: true } },
      department: {
        select: {
          id: true,
          name: true,
          institution: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });
}

export async function createRoutingRule({ categoryId, departmentId, precedence = 0 }) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) throw new HttpError(404, "Categoria nu există.");

  const department = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!department) throw new HttpError(404, "Departamentul nu există.");

  return prisma.routingRule.upsert({
    where: {
      categoryId_departmentId: { categoryId, departmentId },
    },
    update: { precedence: Number(precedence) || 0 },
    create: {
      categoryId,
      departmentId,
      precedence: Number(precedence) || 0,
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      department: {
        select: {
          id: true,
          name: true,
          institution: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });
}

export async function deleteRoutingRule(id) {
  const exists = await prisma.routingRule.findUnique({ where: { id } });
  if (!exists) throw new HttpError(404, "Regula de rutare nu există.");
  await prisma.routingRule.delete({ where: { id } });
}
