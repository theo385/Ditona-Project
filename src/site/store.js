import { DEFAULT_ADMIN_PASSWORD, defaults } from "./defaults.js";

import { adminItem, clearTimers, dashboardActivity, logo, messageConversation, requestConversation } from "./components.js";
import { countNew } from "./format.js";

export function requireAdmin() {
  if (!isAdminLoggedIn()) {
    adminLogin();
    return false;
  }
  return true;
}

// ── Supabase config ─────────────────────────────────────────
const SUPABASE_URL = "https://zwbwsiyvoqdpxyqiylfb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3YndzaXl2b3FkcHh5cWl5bGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2ODc1MDcsImV4cCI6MjA5NzI2MzUwN30.6Kzstz0oEkkQATQVhKUMt1oMOaXnj8F_ouNXSINEDjc";
const STORAGE_BUCKET = "ditona-media";

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

// ── Clés localStorage ─
export const STORAGE_KEY = "ditona_site_data_v3";
export const SESSION_KEY = "ditona_admin_session";
export const PASSWORD_KEY = "ditona_admin_password";
export const CUSTOMER_SESSION_KEY = "ditona_customer_session";
export const GUEST_STARTED_KEY = "ditona_guest_started_at";

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

// ── Helpers Supabase REST ───────────────────────────────────

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

async function sbUpsert(table, row, conflictKey = "id") {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${conflictKey}`, {
      method: "POST",
      headers: upsertHeaders,
      body: JSON.stringify(row),
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (err) {
    console.error(`[Supabase] UPSERT ${table}:`, err);
    return null;
  }
}

function stripDataUrls(value) {
  if (typeof value === "string") return value.startsWith("data:") ? "" : value;
  if (Array.isArray(value)) return value.map(stripDataUrls);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, stripDataUrls(item)]));
  }
  return value;
}

function pkceVerifier() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function pkceChallenge(verifier) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function uploadMediaFile(file, folder = "admin") {
  if (!file) return "";
  const extension = file.name?.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const cleanFolder = String(folder).replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const path = `${cleanFolder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  let lastError = "";
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${path}`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": file.type || "application/octet-stream",
          "x-upsert": "true",
        },
        body: file,
      });
      if (!res.ok) throw new Error(await res.text());
      return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
    } catch (err) {
      lastError = err?.message || String(err);
      console.warn(`[Supabase] upload tentative ${attempt + 1}/3:`, err);
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
  throw new Error(lastError || "Upload impossible vers le cloud.");
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

// ── Chargement données locales ─

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
      maintenanceServices: parsed.maintenanceServices?.length ? parsed.maintenanceServices : clone(defaults.maintenanceServices),
      formations: parsed.formations?.length ? parsed.formations : clone(defaults.formations),
      services: parsed.services?.length ? parsed.services : clone(defaults.services),
      ads: parsed.ads?.length ? parsed.ads : clone(defaults.ads || []),
      adsSettings: { ...clone(defaults.adsSettings || {}), ...(parsed.adsSettings || {}) },
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
    maintenanceServices: normalizeCollection(next.maintenanceServices || fallback.maintenanceServices, fallback.maintenanceServices),
    formations: normalizeCollection(next.formations || fallback.formations, fallback.formations),
    services: normalizeCollection(next.services, fallback.services),
    ads: normalizeCollection(next.ads || fallback.ads || [], fallback.ads || []),
    adsSettings: { ...clone(fallback.adsSettings || {}), ...(next.adsSettings || {}) },
    maintenanceRequests: next.maintenanceRequests || [],
  };
}

function appRequestFromSupabase(row = {}) {
  return {
    ...row,
    machineId: row.machine_id ?? row.machineId,
    autoReply: row.auto_reply ?? row.autoReply ?? "",
    photoUrl: row.photo_url ?? row.photoUrl ?? "",
    photoName: row.photo_name ?? row.photoName ?? "",
    purchasedFromDitona: row.purchased_from_ditona ?? row.purchasedFromDitona ?? "",
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
  if ("photoUrl" in next) {
    next.photo_url = next.photoUrl;
    delete next.photoUrl;
  }
  if ("photoName" in next) {
    next.photo_name = next.photoName;
    delete next.photoName;
  }
  if ("purchasedFromDitona" in next) {
    next.purchased_from_ditona = next.purchasedFromDitona;
    delete next.purchasedFromDitona;
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
    maintenanceServices: data.maintenanceServices,
    formations: data.formations,
    services: data.services,
    ads: data.ads || [],
    adsSettings: data.adsSettings || clone(defaults.adsSettings || {}),
    messages: [],
    orders: [],
    appointments: [],
    trainingRequests: [],
  });
}

// ── Objet data principal ─────────────────────────────────────
export let data = loadLocalData();

function applyRemoteContent(remoteContent) {
  if (!remoteContent) return false;
  const synced = normalizeData({
    ...clone(defaults),
    ...remoteContent,
    messages: [],
    orders: [],
    appointments: [],
    trainingRequests: [],
  });
  const current = JSON.stringify(localContentSnapshot());
  const incoming = JSON.stringify(synced);
  if (current === incoming) return false;
  Object.assign(data, synced);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(synced));
  return true;
}

// ── Charger les données Supabase au démarrage ────────────────
export async function loadRemoteData() {
  const [orders, messages, appointments, trainingRequests, maintenanceRequests, accounts, comments, remoteContent] = await Promise.all([
    sbSelect("orders"),
    sbSelect("messages"),
    sbSelect("appointments"),
    sbSelect("training_requests"),
    sbSelect("maintenance_requests"),
    sbSelect("customer_accounts", "last_login_at"),
    sbSelect("machine_comments"),
    sbSelectContent(),
  ]);
  applyRemoteContent(remoteContent);
  data.orders = orders.map(appRequestFromSupabase);
  data.messages = messages.map(appRequestFromSupabase);
  data.appointments = appointments.map(appRequestFromSupabase);
  data.trainingRequests = trainingRequests.map(appRequestFromSupabase);
  data.maintenanceRequests = maintenanceRequests.map(appRequestFromSupabase);
  data.customerAccounts = accounts;
  data.machineComments = comments.map(appRequestFromSupabase);
}

export async function refreshSiteContent() {
  const remoteContent = await sbSelectContent();
  return applyRemoteContent(remoteContent);
}

// ── saveData ─────────────────────────────────────────────────
export async function saveData() {
  const localOnly = localContentSnapshot();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(localOnly));
  const cloudPayload = stripDataUrls(localOnly);
  const synced = await sbUpsertContent(cloudPayload);
  if (!synced) throw new Error("Synchronisation cloud impossible. Verifiez votre connexion internet.");
  return true;
}

// ── API publique : ajouter ───────────────────────────────────
export async function addOrder(order) {
  const row = { ...order };
  data.orders.unshift(row);
  await sbInsert("orders", requestToSupabase(row));
}

export async function addMessage(message) {
  const row = { ...message };
  data.messages.unshift(row);
  await sbInsert("messages", requestToSupabase(row));
}

export async function addAppointment(appointment) {
  const row = { ...appointment };
  data.appointments.unshift(row);
  await sbInsert("appointments", requestToSupabase(row));
}

export async function addTrainingRequest(request) {
  const row = { ...request };
  data.trainingRequests.unshift(row);
  await sbInsert("training_requests", requestToSupabase(row));
}

export async function addMaintenanceRequest(request) {
  const row = { ...request };
  data.maintenanceRequests = data.maintenanceRequests || [];
  data.maintenanceRequests.unshift(row);
  const saved = await sbInsert("maintenance_requests", requestToSupabase(row));
  if (!saved) localStorage.setItem(STORAGE_KEY, JSON.stringify(localContentSnapshot()));
}

export async function addMachineComment(comment) {
  const row = { ...comment };
  data.machineComments = data.machineComments || [];
  data.machineComments.unshift(row);
  const saved = await sbInsert("machine_comments", requestToSupabase(row));
  if (!saved) throw new Error("Commentaire non synchronise. Verifiez votre connexion.");
  return saved;
}

async function authErrorMessage(res, fallback) {
  try {
    const payload = await res.json();
    if (payload.error_code === "email_not_confirmed") {
      return "Compte cree mais e-mail non confirme. Ouvrez le lien recu par e-mail.";
    }
    return payload.msg || payload.error_description || payload.message || fallback;
  } catch {
    return fallback;
  }
}

export async function loginCustomer(email, password) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPassword = String(password || "");
  if (!cleanEmail || !cleanPassword) throw new Error("E-mail et mot de passe requis.");
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
  });
  if (!res.ok) throw new Error(await authErrorMessage(res, "Connexion impossible. Verifiez l'e-mail et le mot de passe."));
  const session = await res.json();
  if (!session.access_token) throw new Error("Connexion incomplete. Verifiez votre e-mail.");
  await rememberCustomer(session.user, "email");
  sessionStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function signupCustomer(email, password, role = "acheteur", confirmPassword = password) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPassword = String(password || "");
  const cleanConfirm = String(confirmPassword || "");
  if (!cleanEmail || !cleanPassword) throw new Error("E-mail et mot de passe requis.");
  if (cleanPassword !== cleanConfirm) throw new Error("Les mots de passe ne correspondent pas.");
  if (cleanPassword.length < 6) throw new Error("Le mot de passe doit contenir au moins 6 caracteres.");
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email: cleanEmail, password: cleanPassword, data: { role } }),
  });
  if (!res.ok) throw new Error(await authErrorMessage(res, "Inscription impossible. Essayez un autre e-mail."));
  const session = await res.json();
  if (!session.access_token) return { pendingConfirmation: true, user: { id: cleanEmail, email: cleanEmail } };
  await rememberCustomer(session.user || { id: cleanEmail, email: cleanEmail }, role);
  sessionStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function loginWithGoogle(role = "acheteur") {
  localStorage.setItem("ditona_customer_role", role);
  const verifier = pkceVerifier();
  sessionStorage.setItem("ditona_pkce_verifier", verifier);
  const challenge = await pkceChallenge(verifier);
  const redirectTo = encodeURIComponent(`${location.origin}/login`);
  location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}&code_challenge=${challenge}&code_challenge_method=S256&apikey=${SUPABASE_ANON_KEY}`;
}

async function sessionFromAccessToken(accessToken) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) return null;
  const user = await res.json();
  const session = { access_token: accessToken, user };
  sessionStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(session));
  await rememberCustomer(user, localStorage.getItem("ditona_customer_role") || "google");
  history.replaceState({}, "", "/login");
  return session;
}

export async function restoreCustomerFromUrl() {
  const query = new URLSearchParams(location.search);
  const code = query.get("code");
  if (code) {
    const verifier = sessionStorage.getItem("ditona_pkce_verifier");
    sessionStorage.removeItem("ditona_pkce_verifier");
    if (!verifier) return null;
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
      method: "POST",
      headers,
      body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
    });
    if (!res.ok) return null;
    const session = await res.json();
    if (!session.access_token) return null;
    sessionStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(session));
    await rememberCustomer(session.user, localStorage.getItem("ditona_customer_role") || "google");
    history.replaceState({}, "", "/login");
    return session;
  }

  const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
  const accessToken = hash.get("access_token");
  if (!accessToken) return null;
  return sessionFromAccessToken(accessToken);
}

export function currentCustomer() {
  try {
    return JSON.parse(sessionStorage.getItem(CUSTOMER_SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function logoutCustomer() {
  sessionStorage.removeItem(CUSTOMER_SESSION_KEY);
}

async function rememberCustomer(user, role) {
  if (!user?.email && !user?.id) return;
  await sbUpsert("customer_accounts", {
    id: user.id || user.email,
    email: user.email || "",
    name: user.user_metadata?.full_name || user.user_metadata?.name || "",
    role,
    provider: user.app_metadata?.provider || role,
    last_login_at: new Date().toISOString(),
  });
}

// ─ API publique : réinitialisation mot de passe ────────────
export async function requestPasswordReset(email) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!cleanEmail) throw new Error("E-mail requis.");
  
  const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
    method: "POST",
    headers,
    body: JSON.stringify({ 
      email: cleanEmail,
      redirectTo: `${location.origin}/reset-password`
    }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.msg || error.error_description || "Envoi impossible. Verifiez l'e-mail.");
  }
  return true;
}

export async function resetPassword(newPassword, accessToken) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error("Le mot de passe doit contenir au moins 6 caracteres.");
  }
  
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: "PUT",
    headers: {
      ...headers,
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ password: newPassword }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.msg || error.error_description || "Modification impossible.");
  }
  return true;
}

export async function exchangeCodeForSession(code) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=recovery`, {
    method: "POST",
    headers,
    body: JSON.stringify({ auth_code: code }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.msg || error.error_description || "Lien invalide ou expire.");
  }
  
  const session = await res.json();
  return session.access_token;
}

// ── API admin : mettre à jour ────────────────────────────────
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

export async function deleteMaintenanceRequest(id) {
  data.maintenanceRequests = (data.maintenanceRequests || []).filter((t) => String(t.id) !== String(id));
  await sbDelete("maintenance_requests", id);
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
