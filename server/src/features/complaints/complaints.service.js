import { prisma } from "../../config/database.js";
import { HttpError } from "../../common/utils/httpError.js";
import { sendEmail } from "../../common/utils/email.js";
import { formatReportCode } from "../problems/problems.constants.js";
import { createNotification } from "../notifications/notifications.service.js";

export async function generateReferenceNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.complaint.count();
  return `#REF-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function createComplaint({ reportId, actor, institutionId, channel = "EMAIL" }) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      department: { select: { id: true, name: true, institutionId: true } },
    },
  });

  if (!report) throw new HttpError(404, "Sesizarea nu există.");

  // Identificare instituție responsabilă
  const targetInstitutionId = institutionId || report.department?.institutionId;
  if (!targetInstitutionId) {
    throw new HttpError(
      400,
      "Sesizarea nu este repartizată unei instituții căreia să-i poată fi adresată o reclamație formală."
    );
  }

  // Verificare permisiune: doar autorul, susținătorii (+1) sau administratorii pot formula sesizarea
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
        "Doar autorul sesizării sau cetățenii care au susținut-o pot depune o sesizare formală."
      );
    }
  }

  const institution = await prisma.institution.findUnique({
    where: { id: targetInstitutionId },
    select: {
      id: true,
      name: true,
      slug: true,
      contactEmail: true,
      responseDeadlineDays: true,
    },
  });

  if (!institution) throw new HttpError(404, "Instituția nu a fost găsită.");

  const referenceNumber = await generateReferenceNumber();
  const now = new Date();
  const dueDays = institution.responseDeadlineDays || 30;
  const dueAt = new Date(now.getTime() + dueDays * 24 * 60 * 60 * 1000);

  const complaint = await prisma.$transaction(async (tx) => {
    const created = await tx.complaint.create({
      data: {
        reportId,
        institutionId: institution.id,
        referenceNumber,
        status: "SENT",
        channel,
        sentAt: now,
        dueAt,
        escalationLevel: 0,
      },
      include: {
        institution: {
          select: { id: true, name: true, slug: true, contactEmail: true },
        },
        report: {
          select: { id: true, number: true, title: true, address: true },
        },
      },
    });

    await tx.statusHistory.create({
      data: {
        reportId,
        fromStatus: report.status,
        toStatus: report.status,
        authorId: actor.id,
        comment: `A fost depusă sesizarea formală ${referenceNumber} către „${institution.name}” (termen legal: ${dueDays} zile).`,
      },
    });

    return created;
  });

  // Notificare email către instituție (simulată sau reală prin Resend)
  if (institution.contactEmail) {
    await sendEmail({
      to: institution.contactEmail,
      subject: `Sesizare formală nouă: ${referenceNumber} — ${report.title}`,
      html: `
        <h2>Sesizare formală înregistrată</h2>
        <p>A fost expediată o nouă sesizare oficială pentru problema <strong>${formatReportCode(report.number)}</strong>.</p>
        <p><strong>Titlu:</strong> ${report.title}</p>
        <p><strong>Adresă:</strong> ${report.address || "Nesemnată"}</p>
        <p><strong>Număr referință:</strong> ${referenceNumber}</p>
        <p><strong>Termen legal de răspuns:</strong> ${dueDays} zile (până la ${dueAt.toLocaleDateString("ro-RO")}).</p>
      `,
    }).catch(() => null);
  }

  return complaint;
}

export async function listComplaints({ reportId, status, institutionId, actor, page = 1, limit = 50 }) {
  const where = {
    ...(reportId ? { reportId } : {}),
    ...(status ? { status } : {}),
    ...(institutionId ? { institutionId } : {}),
  };

  // Restricții pe roluri
  if (actor.role === "STAFF") {
    const memberships = await prisma.membership.findMany({
      where: { userId: actor.id },
      select: { institutionId: true },
    });
    const allowedInstIds = memberships.map((m) => m.institutionId);
    where.institutionId = { in: allowedInstIds };
  } else if (actor.role === "CITIZEN") {
    // Cetățenii își văd reclamațiile din propriile sesizări
    where.report = { reporterId: actor.id };
  }

  const [complaints, total] = await Promise.all([
    prisma.complaint.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        institution: { select: { id: true, name: true, slug: true } },
        report: { select: { id: true, number: true, title: true, address: true, status: true } },
        escalatedFrom: { select: { id: true, referenceNumber: true } },
      },
    }),
    prisma.complaint.count({ where }),
  ]);

  return {
    complaints: complaints.map((c) => ({
      ...c,
      report: c.report ? { ...c.report, code: formatReportCode(c.report.number) } : c.report,
    })),
    total,
    page,
    limit,
  };
}

export async function getComplaint(id, actor) {
  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      institution: {
        select: {
          id: true,
          name: true,
          slug: true,
          contactEmail: true,
          contactPhone: true,
          responseDeadlineDays: true,
        },
      },
      report: {
        select: {
          id: true,
          number: true,
          title: true,
          description: true,
          address: true,
          status: true,
          reporter: { select: { id: true, name: true } },
        },
      },
      escalatedFrom: {
        select: {
          id: true,
          referenceNumber: true,
          institution: { select: { id: true, name: true } },
        },
      },
      escalations: {
        select: {
          id: true,
          referenceNumber: true,
          status: true,
          institution: { select: { id: true, name: true } },
          createdAt: true,
        },
      },
    },
  });

  if (!complaint) throw new HttpError(404, "Sesizarea formală nu a fost găsită.");

  // Verificare acces
  if (actor.role === "STAFF") {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_institutionId: {
          userId: actor.id,
          institutionId: complaint.institutionId,
        },
      },
    });
    if (!membership) {
      throw new HttpError(403, "Nu ai permisiunea de a vizualiza această reclamație.");
    }
  } else if (actor.role === "CITIZEN" && complaint.report.reporter.id !== actor.id) {
    throw new HttpError(403, "Nu ai acces la această reclamație.");
  }

  return {
    ...complaint,
    report: complaint.report
      ? { ...complaint.report, code: formatReportCode(complaint.report.number) }
      : complaint.report,
  };
}

export async function answerComplaint({ complaintId, actor, answerText }) {
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: {
      institution: { select: { id: true, name: true } },
      report: { select: { id: true, number: true, status: true, reporterId: true } },
    },
  });

  if (!complaint) throw new HttpError(404, "Sesizarea formală nu există.");

  if (actor.role !== "ADMIN") {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_institutionId: {
          userId: actor.id,
          institutionId: complaint.institutionId,
        },
      },
    });
    if (!membership) {
      throw new HttpError(403, "Trebuie să fii angajat al instituției responsabile pentru a răspunde.");
    }
  }

  if (complaint.status === "ANSWERED") {
    throw new HttpError(400, "Această sesizare formală are deja un răspuns înregistrat.");
  }
  if (complaint.status === "CLOSED" || complaint.status === "ESCALATED") {
    throw new HttpError(400, `Nu poți răspunde la o sesizare în starea ${complaint.status}.`);
  }

  const cleanText = typeof answerText === "string" ? answerText.trim() : "";
  if (cleanText.length < 5) {
    throw new HttpError(400, "Răspunsul oficial trebuie să aibă cel puțin 5 caractere.");
  }

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const updated = await tx.complaint.update({
      where: { id: complaintId },
      data: {
        status: "ANSWERED",
        answeredAt: now,
        answerText: cleanText,
      },
      include: {
        institution: { select: { id: true, name: true } },
      },
    });

    await tx.statusHistory.create({
      data: {
        reportId: complaint.report.id,
        fromStatus: complaint.report.status,
        toStatus: complaint.report.status,
        authorId: actor.id,
        comment: `Instituția „${complaint.institution.name}” a transmis răspunsul oficial la sesizarea ${complaint.referenceNumber}.`,
      },
    });

    return updated;
  });

  if (complaint.report?.reporterId) {
    createNotification({
      userId: complaint.report.reporterId,
      title: `Răspuns oficial: ${complaint.referenceNumber}`,
      message: `Instituția „${complaint.institution.name}” a transmis un răspuns oficial la sesizarea ta.`,
      type: "COMPLAINT",
      link: `/complaints/${complaintId}`,
      sendEmailNotification: true,
    }).catch(() => null);
  }

  return updated;
}

export async function acknowledgeComplaint({ complaintId, actor }) {
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    select: { id: true, institutionId: true, status: true },
  });
  if (!complaint) throw new HttpError(404, "Sesizarea formală nu există.");

  if (actor.role !== "ADMIN") {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_institutionId: {
          userId: actor.id,
          institutionId: complaint.institutionId,
        },
      },
    });
    if (!membership) throw new HttpError(403, "Neautorizat.");
  }

  if (complaint.status !== "SENT") {
    throw new HttpError(400, "Doar sesizările expediate (SENT) pot fi confirmate de primire.");
  }

  return prisma.complaint.update({
    where: { id: complaintId },
    data: { status: "ACKNOWLEDGED" },
  });
}

/**
 * Verifică reclamațiile cu termen depășit (dueAt < now) și le escaladează
 * automat către instituția părinte (dacă există).
 */
export async function checkAndEscalateOverdue() {
  const now = new Date();

  const overdueCandidates = await prisma.complaint.findMany({
    where: {
      status: { in: ["SENT", "ACKNOWLEDGED"] },
      dueAt: { lt: now },
    },
    include: {
      institution: {
        select: {
          id: true,
          name: true,
          parentId: true,
          parent: {
            select: {
              id: true,
              name: true,
              responseDeadlineDays: true,
              contactEmail: true,
            },
          },
        },
      },
      report: {
        select: {
          id: true,
          number: true,
          title: true,
          status: true,
        },
      },
    },
  });

  let escalatedCount = 0;
  let overdueCount = 0;

  for (const item of overdueCandidates) {
    const parent = item.institution.parent;

    if (parent) {
      // Escaladare către instituția superioară
      const newRef = await generateReferenceNumber();
      const parentDueDays = parent.responseDeadlineDays || 30;
      const parentDueAt = new Date(now.getTime() + parentDueDays * 24 * 60 * 60 * 1000);

      await prisma.$transaction(async (tx) => {
        await tx.complaint.update({
          where: { id: item.id },
          data: { status: "ESCALATED" },
        });

        await tx.complaint.create({
          data: {
            reportId: item.reportId,
            institutionId: parent.id,
            referenceNumber: newRef,
            status: "SENT",
            channel: item.channel,
            sentAt: now,
            dueAt: parentDueAt,
            escalationLevel: item.escalationLevel + 1,
            escalatedFromId: item.id,
          },
        });

        await tx.statusHistory.create({
          data: {
            reportId: item.reportId,
            fromStatus: item.report.status,
            toStatus: item.report.status,
            comment: `Termenul de răspuns pentru ${item.referenceNumber} a expirat. Sesizarea a fost escaladată automat la „${parent.name}” (${newRef}).`,
          },
        });
      });

      escalatedCount++;
    } else {
      // Nu există părinte ierarhic: rămâne marcat ca OVERDUE
      await prisma.complaint.update({
        where: { id: item.id },
        data: { status: "OVERDUE" },
      });
      overdueCount++;
    }
  }

  return {
    checked: overdueCandidates.length,
    escalated: escalatedCount,
    overdue: overdueCount,
  };
}
