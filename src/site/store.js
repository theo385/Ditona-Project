// ============================================================
// DITONA Engineering — store.js
// Données dynamiques (commandes, messages, RDV, formations)
// synchronisées via Supabase. Machines/services restent en
// localStorage pour les modifs admin offline.
// ============================================================

import { DEFAULT_ADMIN_PASSWORD, defaults } from "./defaults.js";

// ── Supabase config ─────────────────────────────────────────
const SUPABASE_URL = "https://zwbwsiyvoqdpxyqiylfb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3YndzaXl2b3FkcHh5cWl5bGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2ODc1MDcsImV4cCI6MjA5NzI2MzUwN30.6Kzstz0oEkkQATQVhKUMt1oMOaXnj8F_ouNXSINEDjc";

const headers = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  "Prefer": "return=representation",
};
const upsertHeaders = {
  ...headers,
  "Prefer": "resolution=merge-duplicates,return=representation",
};

// ── Clés localStorage (uniquement pour contenu admin: machines, médias) ──
export const STORAGE_KEY = "ditona_site_data_v3";
export const SESSION_KEY = "ditona_admin_session";
export const PASSWORD_KEY = "ditona_admin_password";

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

// ── Helpers Supabase REST ────────────────────────────────────

async function sbSelect(table, order = "created_at") {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?order=${order}.desc`,
      { headers }
    );
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (err) {
    console.error(`[Supabase] SELECT ${table}:`, err);
    return [];
  }
}

async function sbSelectContent() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/site_content?key=eq.main&select=value`,
      { headers }
    );
    if (!res.ok) throw new Error(await res.text());
    const rows = await res.json();
    return rows[0]?.value || null;
  } catch (err) {
    console.warn("[Supabase] site_content indisponible, fallback localStorage:", err);
    return null;
  }
}

async function sbInsert(table, row) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers,
      body: JSON.stringify(row),
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (err) {
    console.error(`[Supabase] INSERT ${table}:`, err);
    return null;
  }
}

async function sbUpsertContent(value) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/site_content?on_conflict=key`, {
      method: "POST",
      headers: upsertHeaders,
      body: JSON.stringify({ key: "main", value, updated_at: new Date().toISOString() }),
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  } catch (err) {
    console.warn("[Supabase] UPSERT site_content:", err);
    return false;
  }
}

async function sbUpdate(table, id, updates) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify(updates),
      }
    );
    if (!res.ok) throw new Error(await res.text());
    return true;
  } catch (err) {
    console.error(`[Supabase] UPDATE ${table}:`, err);
    return false;
  }
}

async function sbDelete(table, id) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`,
      { method: "DELETE", headers }
    );
    if (!res.ok) throw new Error(await res.text());
    return true;
  } catch (err) {
    console.error(`[Supabase] DELETE ${table}:`, err);
    return false;
  }
}

// ── Chargement données locales (machines, médias, services) ─

function loadLocalData() {
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
      // Ces 4 collections viennent maintenant de Supabase
      messages: [],
      orders: [],
      appointments: [],
      trainingRequests: [],
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
    .replaceAll("DITONA ENGINEERING", "DITONA Engineering")
    .replaceAll("DITONA  ENGINEERING", "DITONA Engineering")
    .replaceAll("Ingenieur DITONA", "DITONA Engineering")
    .replaceAll("l'ingenieur DITONA", "DITONA Engineering");
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

function appRequestFromSupabase(row = {}) {
  return {
    ...row,
    machineId: row.machine_id ?? row.machineId,
    autoReply: row.auto_reply ?? row.autoReply ?? "",
    seenAt: row.seen_at ?? row.seenAt ?? "",
    createdAt: row.created_at ?? row.createdAt ?? "",
  };
}

function requestToSupabase(row = {}) {
  const next = { ...row };
  if ("machineId" in next) {
    next.machine_id = next.machineId;
    delete next.machineId;
  }
  if ("autoReply" in next) {
    next.auto_reply = next.autoReply;
    delete next.autoReply;
  }
  if ("seenAt" in next) {
    next.seen_at = next.seenAt;
    delete next.seenAt;
  }
  if ("createdAt" in next) {
    next.created_at = next.createdAt;
    delete next.createdAt;
  }
  return next;
}

function localContentSnapshot() {
  return normalizeData({
    ...clone(defaults),
    homeMedia: data.homeMedia,
    homeProof: data.homeProof,
    sectionMedia: data.sectionMedia,
    machines: data.machines,
    realisations: data.realisations,
    services: data.services,
    messages: [],
    orders: [],
    appointments: [],
    trainingRequests: [],
  });
}

// ── Objet data principal ─────────────────────────────────────
export let data = loadLocalData();

// ── Charger les données Supabase au démarrage ────────────────
export async function loadRemoteData() {
  const [orders, messages, appointments, trainingRequests, remoteContent] = await Promise.all([
    sbSelect("orders"),
    sbSelect("messages"),
    sbSelect("appointments"),
    sbSelect("training_requests"),
    sbSelectContent(),
  ]);
  if (remoteContent) {
    const synced = normalizeData({
      ...clone(defaults),
      ...remoteContent,
      messages: [],
      orders: [],
      appointments: [],
      trainingRequests: [],
    });
    Object.assign(data, synced);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(synced));
  }
  data.orders = orders.map(appRequestFromSupabase);
  data.messages = messages.map(appRequestFromSupabase);
  data.appointments = appointments.map(appRequestFromSupabase);
  data.trainingRequests = trainingRequests.map(appRequestFromSupabase);
}

// ── saveData : garde machines/médias en local uniquement ─────
export function saveData() {
  const localOnly = localContentSnapshot();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(localOnly));
  sbUpsertContent(localOnly);
}

// ── API publique : ajouter une commande ──────────────────────
export async function addOrder(order) {
  const row = { ...order };
  data.orders.unshift(row);
  await sbInsert("orders", requestToSupabase(row));
}

// ── API publique : ajouter un message ───────────────────────
export async function addMessage(message) {
  const row = { ...message };
  data.messages.unshift(row);
  await sbInsert("messages", requestToSupabase(row));
}

// ── API publique : ajouter un rendez-vous ───────────────────
export async function addAppointment(appointment) {
  const row = { ...appointment };
  data.appointments.unshift(row);
  await sbInsert("appointments", requestToSupabase(row));
}

// ── API publique : ajouter une demande de formation ─────────
export async function addTrainingRequest(request) {
  const row = { ...request };
  data.trainingRequests.unshift(row);
  await sbInsert("training_requests", requestToSupabase(row));
}

// ── API admin : mettre à jour statut/réponse ─────────────────
export async function updateOrder(id, updates) {
  const item = data.orders.find((o) => String(o.id) === String(id));
  if (item) Object.assign(item, appRequestFromSupabase(updates));
  await sbUpdate("orders", id, updates);
}

export async function updateMessage(id, updates) {
  const item = data.messages.find((m) => String(m.id) === String(id));
  if (item) Object.assign(item, appRequestFromSupabase(updates));
  await sbUpdate("messages", id, updates);
}

export async function updateAppointment(id, updates) {
  const item = data.appointments.find((a) => String(a.id) === String(id));
  if (item) Object.assign(item, appRequestFromSupabase(updates));
  await sbUpdate("appointments", id, updates);
}

export async function updateTrainingRequest(id, updates) {
  const item = data.trainingRequests.find((t) => String(t.id) === String(id));
  if (item) Object.assign(item, appRequestFromSupabase(updates));
  await sbUpdate("training_requests", id, updates);
}

// ── API admin : supprimer ────────────────────────────────────
export async function deleteOrder(id) {
  data.orders = data.orders.filter((o) => String(o.id) !== String(id));
  await sbDelete("orders", id);
}

export async function deleteMessage(id) {
  data.messages = data.messages.filter((m) => String(m.id) !== String(id));
  await sbDelete("messages", id);
}

export async function deleteAppointment(id) {
  data.appointments = data.appointments.filter((a) => String(a.id) !== String(id));
  await sbDelete("appointments", id);
}

export async function deleteTrainingRequest(id) {
  data.trainingRequests = data.trainingRequests.filter((t) => String(t.id) !== String(id));
  await sbDelete("training_requests", id);
}

// ── Auth admin ───────────────────────────────────────────────
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
