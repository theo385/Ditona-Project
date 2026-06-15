import { DEFAULT_ADMIN_PASSWORD, defaults } from "./defaults.js";

export const STORAGE_KEY = "ditona_site_data_v3";
export const SESSION_KEY = "ditona_admin_session";
export const PASSWORD_KEY = "ditona_admin_password";

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return normalizeData(clone(defaults));
  try {
    const parsed = JSON.parse(saved);
    const slides = parsed.homeMedia || parsed.heroSlides;
    return normalizeData({
      ...clone(defaults),
      ...parsed,
      homeMedia: slides?.length ? slides : clone(defaults.homeMedia),
      homeProof: parsed.homeProof?.length ? parsed.homeProof : clone(defaults.homeProof),
      sectionMedia: { ...clone(defaults.sectionMedia), ...(parsed.sectionMedia || {}) },
      machines: parsed.machines?.length ? parsed.machines : clone(defaults.machines),
      realisations: parsed.realisations?.length ? parsed.realisations : clone(defaults.realisations),
      services: parsed.services?.length ? parsed.services : clone(defaults.services),
      messages: parsed.messages || [],
      orders: parsed.orders || [],
      appointments: parsed.appointments || [],
      trainingRequests: parsed.trainingRequests || [],
    });
  } catch {
    return normalizeData(clone(defaults));
  }
}

function normalizeImage(item, fallback = {}) {
  const image = String(item?.image || "");
  const backImage = String(item?.backImage || "");
  return {
    ...item,
    title: normalizeBrandText(item?.title),
    subtitle: normalizeBrandText(item?.subtitle),
    name: normalizeBrandText(item?.name),
    image: image.includes("images.unsplash.com") ? fallback.image || "/realisations/cnc-3w-iso.jpeg" : image,
    backImage: backImage.includes("images.unsplash.com") ? fallback.backImage || fallback.image || item.image : backImage || item.backImage || fallback.backImage || item.image,
  };
}

function normalizeBrandText(value) {
  if (typeof value !== "string") return value;
  return value
    .replaceAll("DITONA ENGINEERS", "DITONA Engineering")
    .replaceAll("DITONA  ENGINEERS", "DITONA Engineering")
    .replaceAll("DITONA Engineers", "DITONA Engineering")
    .replaceAll("Ingenieur DITONA", "DITONA Engineering")
    .replaceAll("l'ingenieur DITONA", "DITONA Engineering")
    .replaceAll("l'equipe", "l'equipe");
}

function normalizeCollection(items = [], fallbacks = []) {
  return items.map((item, index) => {
    const fallback = fallbacks.find((row) => String(row.id) === String(item.id)) || fallbacks[index] || {};
    return normalizeImage(item, fallback);
  });
}

function normalizeData(next) {
  const fallback = clone(defaults);
  return {
    ...next,
    sectionMedia: Object.fromEntries(Object.entries(next.sectionMedia || {}).map(([key, item]) => [key, normalizeImage(item, fallback.sectionMedia[key])])),
    homeMedia: normalizeCollection(next.homeMedia, fallback.homeMedia),
    homeProof: normalizeCollection(next.homeProof, fallback.homeProof),
    machines: normalizeCollection(next.machines, fallback.machines),
    realisations: normalizeCollection(next.realisations, fallback.realisations),
    services: normalizeCollection(next.services, fallback.services),
  };
}

export let data = loadData();

export function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getAdminPassword() {
  return localStorage.getItem(PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
}

export function setAdminPassword(password) {
  localStorage.setItem(PASSWORD_KEY, password);
}

export function isAdminLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === "true";
}

export function loginAdmin() {
  sessionStorage.setItem(SESSION_KEY, "true");
}

export function logoutAdmin() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
