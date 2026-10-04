import { categoriesApi } from "../../api/categories.js";
import { assetUrl } from "../../api/client.js";
import { problemsApi } from "../../api/problems.js";

const STATUS_TO_DESIGN = {
  NEW: "new",
  IN_REVIEW: "progress",
  CONFIRMED: "progress",
  ASSIGNED: "progress",
  IN_PROGRESS: "progress",
  RESOLVED_PENDING_CONFIRMATION: "progress",
  RESOLVED: "done",
  REOPENED: "progress",
  REJECTED: "new",
  DUPLICATE: "new",
  NEEDS_INFO: "progress",
};

const STATUS_TO_SERVER = {
  new: "NEW",
  progress: "IN_PROGRESS",
  done: "RESOLVED_PENDING_CONFIRMATION",
};

function emojiForCategory(category) {
  const text = `${category.name} ${category.slug}`.toLocaleLowerCase();
  if (/drum|groap|asfalt|road/.test(text)) return "▰";
  if (/ilumin|electric|light/.test(text)) return "☼";
  if (/gunoi|salub|deșeu|deseu|waste/.test(text)) return "♲";
  if (/parc|trafic|transport/.test(text)) return "↗";
  if (/apă|apa|canal|water/.test(text)) return "≈";
  return "●";
}

function normalizeReport(report) {
  const photo = report.photos?.find((item) => item.kind === "REPORT") || report.photos?.[0];
  return {
    id: report.id,
    code: report.code,
    title: report.title,
    cat: report.category?.id || report.categoryId,
    st: STATUS_TO_DESIGN[report.status] || "new",
    lat: report.latitude,
    lng: report.longitude,
    conf: report.supportCount || 0,
    confBy: [],
    date: report.createdAt ? new Date(report.createdAt).getTime() : Date.now(),
    resolvedAt: report.resolvedAt ? new Date(report.resolvedAt).getTime() : 0,
    by: report.reporter?.name || report.createdBy?.name || report.reporterName || "Cetățean",
    desc: report.description || "",
    address: report.address || "",
    cameraPhoto: photo?.publicPath ? assetUrl(photo.publicPath) : "",
    originalStatus: report.status,
  };
}

async function createProblem(report) {
  const formData = new FormData();
  formData.append("title", report.title);
  formData.append("description", report.desc || "");
  formData.append("categoryId", report.cat);
  formData.append("address", report.address || "");
  formData.append("latitude", String(report.lat));
  formData.append("longitude", String(report.lng));

  if (report.cameraPhoto) {
    const photo = await fetch(report.cameraPhoto).then((response) => response.blob());
    formData.append("photos", photo, "sesizare.jpg");
  }

  const result = await problemsApi.createProblem(formData);
  return {
    ...normalizeReport(result.problem),
    duplicate: result.duplicate,
    parentCode: result.parentCode,
    ai: result.ai,
  };
}

export const api = {
  async getCategories() {
    const result = await categoriesApi.getCategories();
    return Object.fromEntries(
      (result.categories || []).map((category) => [
        category.id,
        [category.name, category.department?.name || "", emojiForCategory(category)],
      ]),
    );
  },

  async list() {
    const result = await problemsApi.getProblems({ page: 1, limit: 100 });
    return (result.items || []).map(normalizeReport);
  },

  async listMine(userName) {
    const result = await problemsApi.getMyProblems({ page: 1, limit: 100 });
    return (result.items || []).map((report) => ({
      ...normalizeReport(report),
      by: report.reporter?.name || userName,
    }));
  },

  async getProblem(id) {
    const report = await problemsApi.getProblem(id);
    return { ...normalizeReport(report), isSupported: report.hasSupported };
  },

  create: createProblem,

  async confirm(id) {
    return problemsApi.toggleSupport(id);
  },

  async setStatus(id, status) {
    const serverStatus = STATUS_TO_SERVER[status];
    if (!serverStatus) throw new Error(`Statusul "${status}" nu este acceptat.`);
    return problemsApi.updateStatus(id, { toStatus: serverStatus });
  },
};
