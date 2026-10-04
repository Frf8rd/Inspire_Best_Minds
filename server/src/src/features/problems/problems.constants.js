// Statusurile vin din enum-ul ReportStatus din schema.prisma.
// Tranzițiile pe care le poate face personalul instituției (STAFF/ADMIN).
// RESOLVED și REOPENED NU sunt aici: ele rezultă din confirmările cetățenilor
// (ReportConfirmation), nu dintr-o schimbare manuală de status.
export const STATUS_TRANSITIONS = {
  NEW: ["IN_REVIEW", "REJECTED", "NEEDS_INFO"],
  IN_REVIEW: ["CONFIRMED", "REJECTED", "DUPLICATE", "NEEDS_INFO"],
  NEEDS_INFO: ["IN_REVIEW", "REJECTED"],
  CONFIRMED: ["ASSIGNED", "DUPLICATE"],
  ASSIGNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED_PENDING_CONFIRMATION"],
  REOPENED: ["ASSIGNED", "IN_PROGRESS"],
  RESOLVED_PENDING_CONFIRMATION: [],
  RESOLVED: [],
  REJECTED: [],
  DUPLICATE: [],
};

export const REPORT_STATUSES = Object.keys(STATUS_TRANSITIONS);

export const formatReportCode = (number) => `#UP-${String(number).padStart(4, "0")}`;

// Limitele sunt intenționat centralizate, ca API-ul și interfața să poată folosi
// aceleași reguli fără valori "magice" împrăștiate prin proiect.
export const MAX_PHOTOS_PER_REPORT = 5;
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
