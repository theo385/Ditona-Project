import { adminItem, clearTimers, dashboardActivity, logo, messageConversation, requestConversation } from "./components.js";
import { countNew } from "./format.js";
import { data, getAdminPassword, isAdminLoggedIn, loginAdmin, logoutAdmin, saveData, setAdminPassword, today, updateOrder, updateMessage, updateAppointment, updateTrainingRequest, deleteOrder, deleteMessage, deleteAppointment, deleteTrainingRequest, loadRemoteData, uploadMediaFile } from "./store.js";

export function requireAdmin() {
  if (!isAdminLoggedIn()) {
    adminLogin();
    return false;
  }
  return true;
}

function setAdminMode(enabled) {
  document.documentElement.classList.toggle("admin-mode", enabled);
  document.body.classList.toggle("admin-mode", enabled);
}

export function adminLogin() {
  clearTimers();
  setAdminMode(true);
  document.querySelector("#app").innerHTML = `
    <main class="admin-login">
      <form id="login-form" class="panel login-panel">
        ${logo("login-brand")}
        <h1>Administration DITONA</h1>
        <label>Mot de passe<input name="password" type="password" required placeholder="Mot de passe"></label>
        <button class="primary">Connexion</button>
        <button class="ghost" type="button" data-link="/">Retour au site</button>
      </form>
    </main>
  `;
  window.ditonaBindGlobal();
  document.querySelector("#login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (new FormData(event.target).get("password") !== getAdminPassword()) return alert("Mot de passe incorrect.");
    loginAdmin();
    window.ditonaGo("/admin");
  });
}

function notifications() {
  return {
    appointments: countNew(data.appointments),
    orders: countNew(data.orders),
    messages: countNew(data.messages),
    training: countNew(data.trainingRequests || []),
  };
}

function markSeen(key) {
  let changed = false;
  data[key] = (data[key] || []).map((item) => {
    if (item.seenAt) return item;
    changed = true;
    return { ...item, seenAt: today() };
  });
  if (!changed) return;
  const updates = { seen_at: today() };
  data[key].forEach((item) => {
    if (key === "orders") updateOrder(item.id, updates);
    if (key === "appointments") updateAppointment(item.id, updates);
    if (key === "messages") updateMessage(item.id, updates);
    if (key === "trainingRequests") updateTrainingRequest(item.id, updates);
  });
}

export function adminShell(content, active = "dashboard") {
  clearTimers();
  setAdminMode(true);
  const counts = notifications();
  const collapsed = localStorage.getItem("ditona_admin_nav_collapsed") === "true";
  document.querySelector("#app").innerHTML = `
    <div class="admin-app ${collapsed ? "admin-collapsed" : ""}">
      <aside class="admin-side">
        <button class="admin-collapse" data-admin-collapse type="button" title="Reduire / ouvrir la navigation"><span>×</span></button>
        ${logo("admin-logo")}
        ${adminNav("Dashboard", "/admin", active, "dashboard")}
        ${adminNav("Accueil anime", "/admin/home", active, "home")}
        ${adminNav("Medias sections", "/admin/sections", active, "sections")}
        ${adminNav("Machines", "/admin/machines", active, "machines")}
        ${adminNav("Realisations", "/admin/realisations", active, "realisations")}
        ${adminNav("Services", "/admin/services", active, "services")}
        ${adminNav("Formations", "/admin/formations", active, "formations", counts.training)}
        ${adminNav("Rendez-vous", "/admin/appointments", active, "appointments", counts.appointments)}
        ${adminNav("Achats", "/admin/orders", active, "orders", counts.orders)}
        ${adminNav("Messages", "/admin/messages", active, "messages", counts.messages)}
        ${adminNav("Comptes", "/admin/accounts", active, "accounts")}
        ${adminNav("Mot de passe", "/admin/settings", active, "settings")}
        <button data-logout>Deconnexion</button>
        <button data-link="/">Voir le site</button>
      </aside>
      <section class="admin-main">${content}</section>
    </div>
  `;
  window.ditonaBindGlobal();
}

function adminNav(label, path, active, key, count = 0) {
  return `<button class="${active === key ? "active" : ""}" data-link="${path}"><span>${label}</span>${count ? `<b class="nav-badge" title="${count} nouvelle demande">${count}</b>` : ""}</button>`;
}

export async function refreshAdminData() {
  await loadRemoteData();
}

export function adminDashboard() {
  if (!requireAdmin()) return;
  adminShell(`
    <div class="admin-hero">
      <img src="/realisations/ligne-remplissage.jpeg" alt="Atelier DITONA">
      <div>
        <p class="eyebrow">Administration</p>
        <h1>Tableau de bord</h1>
        <p>Suivez les demandes clients, les rendez-vous, les achats et le contenu du site.</p>
      </div>
    </div>
    <div class="admin-stats">
      <button data-link="/admin/home"><strong>${data.homeMedia.length}</strong><span>Medias accueil</span></button>
      <button data-link="/admin/machines"><strong>${data.machines.length}</strong><span>Machines</span></button>
      <button data-link="/admin/formations"><strong>${(data.trainingRequests || []).length}</strong><span>Formations</span></button>
      <button data-link="/admin/appointments"><strong>${data.appointments.length}</strong><span>Rendez-vous</span></button>
      <button data-link="/admin/messages"><strong>${data.messages.length}</strong><span>Messages</span></button>
    </div>
    <section class="panel dashboard-panel">
      <div class="section-head compact"><div><p class="eyebrow">Activite</p><h2>Demandes recentes</h2></div></div>
      <div class="activity-list">${dashboardActivity()}</div>
    </section>
  `, "dashboard");
}

export function adminSections() {
  if (!requireAdmin()) return;
  const labels = {
    machines: "Machines",
    realisations: "Realisations",
    services: "Services",
    formation: "Formation",
    about: "A propos",
    appointment: "Rendez-vous",
    contact: "Contact",
  };
  adminShell(`
    <div class="admin-head"><p class="eyebrow">Pages publiques</p><h1>Images animees et videos des sections</h1><p>Modifiez le grand media d'entete de chaque menu.</p></div>
    <form id="section-media-form" class="panel admin-form">
      <label>Section<select name="key">${Object.entries(labels).map(([key, label]) => `<option value="${key}">${label}</option>`).join("")}</select></label>
      <label>Type<select name="type"><option>image</option><option>video</option></select></label>
      <label>Titre<input name="title" required></label>
      <label>Sous-titre<textarea name="subtitle" rows="3" required></textarea></label>
      <label>Media local<input name="imageFile" type="file" accept="image/*,video/*"></label>
      <input name="image" placeholder="URL image ou video">
      <button class="primary">Enregistrer le media de section</button>
    </form>
    <div class="admin-list">${Object.entries(data.sectionMedia).map(([key, item]) => adminItem({ ...item, id: key, name: labels[key] || key, comment: item.title }, "section")).join("")}</div>
  `, "sections");
  bindSectionMediaForm();
}

export function adminHome() {
  if (!requireAdmin()) return;
  adminShell(`
    <div class="admin-head"><p class="eyebrow">Accueil</p><h1>Images et videos animees</h1><p>Ces medias alimentent la page d'accueil visuelle.</p></div>
    <form id="home-form" class="panel admin-form">
      <input name="id" type="hidden">
      <label>Titre<input name="title" required></label>
      <label>Type<select name="type"><option>image</option><option>video</option></select></label>
      <label>Sous-titre<textarea name="subtitle" rows="3" required></textarea></label>
      <label>Media<input name="imageFile" type="file" accept="image/*,video/*"></label>
      <input name="image" placeholder="URL image ou video">
      <button class="primary">Enregistrer</button>
      <button class="ghost" type="reset">Nouveau media</button>
    </form>
    <div class="admin-list">${data.homeMedia.map((s) => adminItem({ ...s, name: s.title, comment: s.subtitle }, "home")).join("")}</div>
    <div class="admin-head secondary-head"><p class="eyebrow">Bas de l'accueil</p><h1>Images fixes affichees en bas</h1><p>Modifiez les trois visuels qui apparaissent avant le pied de page.</p></div>
    <form id="home-proof-form" class="panel admin-form">
      <input name="id" type="hidden">
      <label>Titre<input name="title" required></label>
      <label>Type<select name="type"><option>image</option><option>video</option></select></label>
      <label>Sous-titre<textarea name="subtitle" rows="3" required></textarea></label>
      <label>Media<input name="imageFile" type="file" accept="image/*,video/*"></label>
      <input name="image" placeholder="URL image ou video">
      <button class="primary">Enregistrer l'image du bas</button>
      <button class="ghost" type="reset">Nouveau visuel</button>
    </form>
    <div class="admin-list">${(data.homeProof || []).map((s) => adminItem({ ...s, name: s.title, comment: s.subtitle }, "home-proof")).join("")}</div>
  `, "home");
  bindHomeForm();
  bindHomeProofForm();
}

export function adminMachines() {
  if (!requireAdmin()) return;
  adminShell(`
    <div class="admin-head"><p class="eyebrow">Catalogue</p><h1>Machines</h1></div>
    <form id="machine-form" class="panel admin-form">
      <input name="id" type="hidden">
      <label>Nom<input name="name" required></label>
      <label>Categorie<input name="category" required></label>
      <label>Prix FCFA<input name="price" type="number"></label>
      <label>Statut<input name="status"></label>
      <label>Description<textarea name="description" rows="3" required></textarea></label>
      <label>Commentaire<textarea name="comment" rows="3"></textarea></label>
      <label>Image<input name="imageFile" type="file" accept="image/*"></label>
      <input name="image" placeholder="URL image">
      <button class="primary">Enregistrer</button>
      <button class="ghost" type="reset">Nouveau</button>
    </form>
    <div class="admin-list">${data.machines.map((m) => adminItem(m, "machine")).join("")}</div>
  `, "machines");
  bindMachineForm();
}

export function adminRealisations() {
  if (!requireAdmin()) return;
  adminShell(`
    <div class="admin-head"><p class="eyebrow">Galerie et avis clients</p><h1>Realisations</h1></div>
    <form id="realisation-form" class="panel admin-form">
      <input name="id" type="hidden">
      <label>Titre<input name="title" required></label>
      <label>Prix FCFA<input name="price" type="number"></label>
      <label>Etoiles client<input name="rating" type="number" min="0" max="5" step="1" value="5"></label>
      <label>Commentaire<textarea name="comment" rows="3" required></textarea></label>
      <label>Avis client<textarea name="review" rows="3" placeholder="Ex: Client satisfait par la qualite du travail."></textarea></label>
      <label>Image<input name="imageFile" type="file" accept="image/*"></label>
      <input name="image" placeholder="URL image">
      <button class="primary">Enregistrer</button>
      <button class="ghost" type="reset">Nouveau</button>
    </form>
    <div class="admin-list">${data.realisations.map((r) => adminItem({ ...r, name: r.title }, "realisation")).join("")}</div>
  `, "realisations");
  bindRealisationForm();
}

export function adminServices() {
  if (!requireAdmin()) return;
  adminShell(`
    <div class="admin-head"><p class="eyebrow">Services</p><h1>Services DITONA</h1></div>
    <form id="service-form" class="panel admin-form">
      <input name="id" type="hidden">
      <label>Titre<input name="title" required></label>
      <label>Image<input name="imageFile" type="file" accept="image/*"></label>
      <label>Description<textarea name="text" rows="4" required></textarea></label>
      <input name="image" placeholder="URL image">
      <button class="primary">Enregistrer</button>
      <button class="ghost" type="reset">Nouveau</button>
    </form>
    <div class="admin-list">${data.services.map((s) => adminItem({ ...s, name: s.title, comment: s.text }, "service")).join("")}</div>
  `, "services");
  bindServiceForm();
}

export function adminFormations() {
  if (!requireAdmin()) return;
  markSeen("trainingRequests");
  const list = (data.trainingRequests || []).map((f) => ({ ...f, client: `${f.name || ""} ${f.firstname || ""}`.trim(), note: f.message }));
  adminShell(`
    <div class="admin-head"><p class="eyebrow">Demandes</p><h1>Formations</h1></div>
    ${requestConversation(list, "formation")}
  `, "formations");
  injectDeleteButtons("formation");
}

export function adminAppointments() {
  if (!requireAdmin()) return;
  markSeen("appointments");
  adminShell(`
    <div class="admin-head"><p class="eyebrow">Planning</p><h1>Rendez-vous</h1></div>
    ${requestConversation(data.appointments, "appointment")}
  `, "appointments");
  injectDeleteButtons("appointment");
}

export function adminOrders() {
  if (!requireAdmin()) return;
  markSeen("orders");
  adminShell(`
    <div class="admin-head"><p class="eyebrow">Demandes</p><h1>Achats</h1></div>
    ${requestConversation(data.orders, "order")}
  `, "orders");
  injectDeleteButtons("order");
}

export function adminMessages() {
  if (!requireAdmin()) return;
  markSeen("messages");
  adminShell(`
    <div class="admin-head"><p class="eyebrow">Communication</p><h1>Messagerie</h1></div>
    ${messageConversation(data.messages)}
  `, "messages");
  injectDeleteButtons("message");
}

export function adminAccounts() {
  if (!requireAdmin()) return;
  const accounts = data.customerAccounts || [];
  adminShell(`
    <div class="admin-head"><p class="eyebrow">Utilisateurs</p><h1>Comptes connectes</h1></div>
    <section class="panel accounts-panel">
      ${accounts.length ? `
        <div class="account-list">
          ${accounts.map((account) => `
            <article class="account-row">
              <div><strong>${account.name || account.email || "Compte client"}</strong><span>${account.email || ""}</span></div>
              <small>${account.role || account.provider || "client"}</small>
              <time>${account.last_login_at ? new Date(account.last_login_at).toLocaleString("fr-FR") : ""}</time>
            </article>
          `).join("")}
        </div>
      ` : `<p class="empty">Aucun compte connecte pour le moment.</p>`}
    </section>
  `, "accounts");
}

export function adminSettings() {
  if (!requireAdmin()) return;
  adminShell(`
    <div class="admin-head"><p class="eyebrow">Securite</p><h1>Changer le mot de passe</h1></div>
    <form id="password-form" class="panel password-panel">
      <label>Mot de passe actuel<input name="current" type="password" required></label>
      <label>Nouveau mot de passe<input name="next" type="password" required minlength="6"></label>
      <label>Confirmer<input name="confirm" type="password" required minlength="6"></label>
      <button class="primary">Mettre a jour</button>
    </form>
  `, "settings");
  document.querySelector("#password-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const fd = new FormData(event.target);
    if (fd.get("current") !== getAdminPassword()) return alert("Mot de passe actuel incorrect.");
    if (fd.get("next") !== fd.get("confirm")) return alert("Les nouveaux mots de passe ne correspondent pas.");
    setAdminPassword(fd.get("next"));
    event.target.innerHTML = `<div class="success"><h2>Mot de passe modifie</h2><p>Utilisez le nouveau mot de passe a la prochaine connexion.</p></div>`;
  });
}

async function readImage(input, fallback, folder = "admin") {
  const file = input.files?.[0];
  if (!file) return fallback || "";
  return uploadMediaFile(file, folder);
}

async function persistAdminData(reload) {
  try {
    await saveData();
    reload();
  } catch (err) {
    alert(err.message || "Synchronisation impossible.");
  }
}

async function submitAdminForm(task) {
  try {
    await task();
  } catch (err) {
    alert(err.message || "Enregistrement impossible.");
  }
}

function bindHomeForm() {
  const form = document.querySelector("#home-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitAdminForm(async () => {
    const fd = new FormData(form);
    const id = fd.get("id") ? Number(fd.get("id")) : Date.now();
    const existing = data.homeMedia.find((s) => s.id === id);
    const image = await readImage(form.imageFile, fd.get("image") || existing?.image, "home");
    const next = { id, title: fd.get("title"), subtitle: fd.get("subtitle"), type: fd.get("type"), image };
    data.homeMedia = existing ? data.homeMedia.map((s) => s.id === id ? next : s) : [next, ...data.homeMedia];
    await persistAdminData(adminHome);
    });
  });
}

function bindHomeProofForm() {
  const form = document.querySelector("#home-proof-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitAdminForm(async () => {
    const fd = new FormData(form);
    const id = fd.get("id") ? Number(fd.get("id")) : Date.now();
    const existing = (data.homeProof || []).find((s) => s.id === id);
    const image = await readImage(form.imageFile, fd.get("image") || existing?.image, "home-proof");
    const next = { id, title: fd.get("title"), subtitle: fd.get("subtitle"), type: fd.get("type"), image };
    data.homeProof = existing ? data.homeProof.map((s) => s.id === id ? next : s) : [next, ...(data.homeProof || [])];
    await persistAdminData(adminHome);
    });
  });
}

function bindMachineForm() {
  const form = document.querySelector("#machine-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitAdminForm(async () => {
    const fd = new FormData(form);
    const id = fd.get("id") ? Number(fd.get("id")) : Date.now();
    const existing = data.machines.find((m) => m.id === id);
    const image = await readImage(form.imageFile, fd.get("image") || existing?.image, "machines");
    const next = { id, name: fd.get("name"), category: fd.get("category"), price: Number(fd.get("price")) || null, status: fd.get("status"), description: fd.get("description"), comment: fd.get("comment"), image };
    data.machines = existing ? data.machines.map((m) => m.id === id ? next : m) : [next, ...data.machines];
    await persistAdminData(adminMachines);
    });
  });
}

function bindRealisationForm() {
  const form = document.querySelector("#realisation-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitAdminForm(async () => {
    const fd = new FormData(form);
    const id = fd.get("id") ? Number(fd.get("id")) : Date.now();
    const existing = data.realisations.find((r) => r.id === id);
    const image = await readImage(form.imageFile, fd.get("image") || existing?.image, "realisations");
    const rating = Math.max(0, Math.min(5, Number(fd.get("rating")) || 0));
    const next = { id, title: fd.get("title"), price: Number(fd.get("price")) || null, rating, review: fd.get("review"), comment: fd.get("comment"), image };
    data.realisations = existing ? data.realisations.map((r) => r.id === id ? next : r) : [next, ...data.realisations];
    await persistAdminData(adminRealisations);
    });
  });
}

function bindSectionMediaForm() {
  const form = document.querySelector("#section-media-form");
  const load = () => {
    const item = data.sectionMedia[form.key.value];
    form.type.value = item.type || "image";
    form.title.value = item.title || "";
    form.subtitle.value = item.subtitle || "";
    form.image.value = item.image || "";
  };
  form.key.addEventListener("change", load);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitAdminForm(async () => {
    const fd = new FormData(form);
    const key = fd.get("key");
    const existing = data.sectionMedia[key] || {};
    const image = await readImage(form.imageFile, fd.get("image") || existing.image, `section-${key}`);
    data.sectionMedia[key] = { type: fd.get("type"), title: fd.get("title"), subtitle: fd.get("subtitle"), image };
    await persistAdminData(adminSections);
    });
  });
  load();
}

function bindServiceForm() {
  const form = document.querySelector("#service-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitAdminForm(async () => {
    const fd = new FormData(form);
    const id = fd.get("id") ? Number(fd.get("id")) : Date.now();
    const existing = data.services.find((s) => s.id === id);
    const image = await readImage(form.imageFile, fd.get("image") || existing?.image, "services");
    const next = { id, title: fd.get("title"), text: fd.get("text"), image };
    data.services = existing ? data.services.map((s) => s.id === id ? next : s) : [next, ...data.services];
    await persistAdminData(adminServices);
    });
  });
}

function injectDeleteButtons(type) {
  const main = document.querySelector(".admin-main");
  if (!main) return;
  main.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-delete-req]");
    if (!btn) return;
    const id = btn.dataset.deleteReq;
    if (confirm("Supprimer cet element definitivement ? Cette action est irreversible.")) {
      deleteRequest(type, id);
    }
  });
  // Trouver les IDs via les textareas de reponse (data-{type}-reply="{id}")
  main.querySelectorAll(`[data-${type}-reply]`).forEach((textarea) => {
    const id = textarea.dataset[`${type}Reply`] || textarea.getAttribute(`data-${type}-reply`);
    if (!id) return;
    // Trouver le conteneur parent (request-card ou thread-head ou thread-actions)
    const actions = textarea.closest(".request-card, .message-thread")?.querySelector(".thread-actions, .request-top");
    if (!actions) return;
    if (actions.querySelector("[data-delete-req]")) return; // Eviter doublon
    const del = document.createElement("button");
    del.className = "danger small";
    del.dataset.deleteReq = id;
    del.textContent = "🗑 Supprimer";
    del.type = "button";
    actions.appendChild(del);
  });
}

export function fillForm(formId, item) {
  const form = document.querySelector(formId);
  Object.entries(item).forEach(([key, value]) => {
    if (form[key] && key !== "imageFile") form[key].value = value ?? "";
  });
  form.scrollIntoView({ behavior: "smooth" });
}

export async function saveRequest(type, id) {
  const key = type === "order" ? "orders" : type === "appointment" ? "appointments" : type === "formation" ? "trainingRequests" : "messages";
  const reply = document.querySelector(`[data-${type}-reply="${CSS.escape(String(id))}"]`)?.value || "";
  const updates = {
    seen_at: today(),
    status: reply ? "Repondu" : "Vu",
    reply,
  };
  // Mise à jour locale
  data[key] = data[key].map((item) => String(item.id) === String(id) ? { ...item, seenAt: updates.seen_at, status: updates.status, reply } : item);
  // Synchronisation Supabase
  if (type === "order") await updateOrder(id, updates);
  else if (type === "appointment") await updateAppointment(id, updates);
  else if (type === "formation") await updateTrainingRequest(id, updates);
  else await updateMessage(id, updates);
  if (type === "order") adminOrders();
  if (type === "appointment") adminAppointments();
  if (type === "formation") adminFormations();
  if (type === "message") adminMessages();
}

export async function deleteRequest(type, id) {
  const key = type === "order" ? "orders" : type === "appointment" ? "appointments" : type === "formation" ? "trainingRequests" : "messages";
  data[key] = (data[key] || []).filter((item) => String(item.id) !== String(id));
  // Suppression Supabase
  if (type === "order") await deleteOrder(id);
  else if (type === "appointment") await deleteAppointment(id);
  else if (type === "formation") await deleteTrainingRequest(id);
  else await deleteMessage(id);
  if (type === "order") adminOrders();
  if (type === "appointment") adminAppointments();
  if (type === "formation") adminFormations();
  if (type === "message") adminMessages();
}

export function logout() {
  logoutAdmin();
  window.ditonaGo("/admin");
}
