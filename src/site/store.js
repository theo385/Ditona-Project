import { DEFAULT_ADMIN_PASSWORD, defaults } from "./defaults.js";

export const STORAGE_KEY = "ditona_site_data_v3";
export const SESSION_KEY = "ditona_admin_session";
export const PASSWORD_KEY = "ditona_admin_password";

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return clone(defaults);
  try {
    const parsed = JSON.parse(saved);
    const slides = parsed.homeMedia || parsed.heroSlides;
    return {
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
    };
  } catch {
    return clone(defaults);
  }
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
