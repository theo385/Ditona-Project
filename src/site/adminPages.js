import { adminItem, clearTimers, dashboardActivity, logo, messageConversation, requestConversation, requestConversationSimple } from "./components.js";
import { countNew, escapeHtml } from "./format.js";
import { data, getAdminPassword, isAdminLoggedIn, loginAdmin, logoutAdmin, saveData, setAdminPassword, today, updateOrder, updateMessage, updateAppointment, updateTrainingRequest, deleteOrder, deleteMessage, deleteAppointment, deleteTrainingRequest, deleteMaintenanceRequest, loadRemoteData, uploadMediaFile } from "./store.js";

const ADMIN_BASE = "/27ditona@ad07";

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
    window.ditonaGo(ADMIN_BASE);
  });
}

function notifications() {
  return {
    appointments: countNew(data.appointments),
    orders: countNew(data.orders),
    messages: countNew(data.messages),
    training: countNew(data.trainingRequests || []),
    maintenance: countNew(data.maintenanceRequests || []),
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
        ${adminNav("Dashboard", ADMIN_BASE, active, "dashboard")}
        ${adminNav("Accueil anime", `${ADMIN_BASE}/home`, active, "home")}
        ${adminNav("Medias sections", `${ADMIN_BASE}/sections`, active, "sections")}
        ${adminNav("Machines", `${ADMIN_BASE}/machines`, active, "machines")}
        ${adminNav("Nos Realisations", `${ADMIN_BASE}/realisations`, active, "realisations")}
        ${adminNav("Maintenances", `${ADMIN_BASE}/services`, active, "services", counts.maintenance)}
        ${adminNav("Formations", `${ADMIN_BASE}/formations`, active, "formations", counts.training)}
        ${adminNav("Publicites", `${ADMIN_BASE}/ads`, active, "ads")}
        ${adminNav("Rendez-vous", `${ADMIN_BASE}/appointments`, active, "appointments", counts.appointments)}
        ${adminNav("Achats", `${ADMIN_BASE}/orders`, active, "orders", counts.orders)}
        ${adminNav("Messages", `${ADMIN_BASE}/messages`, active, "messages", counts.messages)}
        ${adminNav("Comptes", `${ADMIN_BASE}/accounts`, active, "accounts")}
        ${adminNav("Mot de passe", `${ADMIN_BASE}/settings`, active, "settings")}
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
      <button data-link="${ADMIN_BASE}/home"><strong>${data.homeMedia.length}</strong><span>Medias accueil</span></button>
      <button data-link="${ADMIN_BASE}/machines"><strong>${data.machines.length}</strong><span>Machines</span></button>
      <button data-link="${ADMIN_BASE}/formations"><strong>${(data.trainingRequests || []).length}</strong><span>Formations</span></button>
      <button data-link="${ADMIN_BASE}/appointments"><strong>${data.appointments.length}</strong><span>Rendez-vous</span></button>
      <button data-link="${ADMIN_BASE}/messages"><strong>${data.messages.length}</strong><span>Messages</span></button>
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
      <label>Reduction %<input name="discountPercent" type="number" min="0" max="100" placeholder="0"></label>
      <label>Statut<input name="status"></label>
      <label>Description<textarea name="description" rows="3" required></textarea></label>
      <label>Commentaire<textarea name="comment" rows="3"></textarea></label>
      <label>Image<input name="imageFile" type="file" accept="image/*"></label>
      <input name="image" placeholder="URL image">
      <h3>Galerie de la machine</h3>
      <div id="machine-gallery-container" class="admin-repeat-list"></div>
      <button type="button" class="ghost small" id="add-machine-gallery">+ Ajouter une image</button>
      <h3>Caracteristiques</h3>
      <div id="machine-specs-container" class="admin-repeat-list"></div>
      <button type="button" class="ghost small" id="add-machine-spec">+ Ajouter une caracteristique</button>
      <label>Texte charge sous les caracteristiques<textarea name="detailsText" rows="5" placeholder=></textarea></label>
      <label>Charger un fichier de caracteristiques<input name="detailsFile" type="file" accept=".txt,.csv,.html,.htm,.doc,.docx,.pdf"></label>
      <input name="detailsFileUrl" placeholder="URL du fichier charge">
      <input name="detailsFileName" placeholder="Nom du fichier">
      <button class="primary">Enregistrer</button>
      <button class="ghost" type="reset">Nouveau</button>
    </form>
    <div class="admin-list">${data.machines.map((m) => adminItem(m, "machine")).join("")}</div>
  `, "machines");
  bindMachineForm();
}

export function adminAds() {
  if (!requireAdmin()) return;
  adminShell(`
    <div class="admin-head"><p class="eyebrow">Publicites</p><h1>Pubs animees du site</h1><p>Ajoutez des images ou videos qui apparaissent dans l'angle du site.</p></div>
    <form id="ad-form" class="panel admin-form">
      <h2>Reglage global des publicites</h2>
      <label>Temps visible avant disparition (ms)<input name="globalVisibleMs" type="number" min="5000" step="1000" value="${Number(data.adsSettings?.visibleMs) || 22000}"></label>
      <label>Temps cache avant reapparition (ms)<input name="globalHiddenMs" type="number" min="3000" step="1000" value="${Number(data.adsSettings?.hiddenMs) || 18000}"></label>
      <hr>
      <h2>Image ou video publicitaire</h2>
      <input name="id" type="hidden">
      <label>Titre<input name="title" required></label>
      <label>Texte court<textarea name="text" rows="2"></textarea></label>
      <label>Description detaillee<textarea name="description" rows="4" placeholder="Details de l'offre, conditions, informations utiles"></textarea></label>
      <label>Localisation<input name="location" placeholder="Ville, quartier, adresse ou lieu de vente"></label>
      <label>Numero WhatsApp commande<input name="whatsapp" placeholder="+228 ..."></label>
      <label>Type<select name="type"><option>image</option><option>video</option></select></label>
      <label>Texte bouton<input name="cta" placeholder="Commander maintenant"></label>
      <label>Temps de chaque image/video (ms)<input name="displayMs" type="number" min="1500" step="500" placeholder="7000"></label>
      <label>Active<select name="active"><option value="true">Oui</option><option value="false">Non</option></select></label>
      <label>Media<input name="imageFile" type="file" accept="image/*,video/*"></label>
      <input name="image" placeholder="URL image ou video">
      <button class="primary">Enregistrer la pub</button>
      <button class="ghost" type="reset">Nouvelle pub</button>
    </form>
    <div class="admin-list">${(data.ads || []).map((ad) => adminItem({ ...ad, name: ad.title, comment: ad.text, status: ad.active === false ? "Inactive" : "Active" }, "ad")).join("")}</div>
  `, "ads");
  bindAdForm();
}

// MODIFIÉ - Formulaire Réalisations avec images pour chaque étape
export function adminRealisations() {
  if (!requireAdmin()) return;
  adminShell(`
    <div class="admin-head"><p class="eyebrow">Galerie</p><h1>Nos Realisations</h1></div>
    <form id="realisation-form" class="panel admin-form">
      <input name="id" type="hidden">
      <label>Titre<input name="title" required></label>
      <label>Description courte<textarea name="comment" rows="3" required></textarea></label>
      <label>Image principale<input name="imageFile" type="file" accept="image/*"></label>
      <input name="image" placeholder="URL image principale">
      
      <h3 style="margin-top:24px;">Etapes de realisation</h3>
      <p style="color:var(--muted); font-size:0.9rem; margin-bottom:16px;">Ajoutez chaque etape avec son titre, sa description et une image optionnelle</p>
      <div id="steps-container"></div>
      <button type="button" class="ghost small" id="add-step-btn">+ Ajouter une etape</button>
      
      <button class="primary" style="margin-top:24px;">Enregistrer</button>
      <button class="ghost" type="reset">Nouveau</button>
    </form>
    <div class="admin-list">${data.realisations.map((r) => adminItem({ ...r, name: r.title }, "realisation")).join("")}</div>
  `, "realisations");
  bindRealisationForm();
}

// MODIFIÉ - Formulaire Maintenance avec images pour problème, solution et historique
export function adminServices() {
  if (!requireAdmin()) return;
  adminShell(`
    <div class="admin-head"><p class="eyebrow">Maintenances</p><h1>Services de maintenances</h1></div>
    <form id="service-form" class="panel admin-form">
      <input name="id" type="hidden">
      <label>Titre<input name="title" required></label>
      <label>Image principale<input name="imageFile" type="file" accept="image/*"></label>
      <input name="image" placeholder="URL image principale">
      
      <h3 style="margin-top:24px;">Probleme rencontre</h3>
      <label>Description du probleme<textarea name="problem" rows="3" required></textarea></label>
      <label>Photo du probleme<input name="problemImageFile" type="file" accept="image/*"></label>
      <input name="problemImage" placeholder="URL image probleme">
      
      <h3 style="margin-top:24px;">Solution apportee</h3>
      <label>Description de la solution<textarea name="solution" rows="4" required></textarea></label>
      <label>Photo de la solution<input name="solutionImageFile" type="file" accept="image/*"></label>
      <input name="solutionImage" placeholder="URL image solution">
      
      <h3 style="margin-top:24px;">Historique des interventions</h3>
      <p style="color:var(--muted); font-size:0.9rem; margin-bottom:16px;">Ajoutez chaque intervention avec date, probleme, solution et image optionnelle</p>
      <div id="history-container"></div>
      <button type="button" class="ghost small" id="add-history-btn">+ Ajouter une intervention</button>
      
      <button class="primary" style="margin-top:24px;">Enregistrer</button>
      <button class="ghost" type="reset">Nouveau</button>
    </form>
    <div class="admin-list">${(data.maintenanceServices || []).map((s) => adminItem({ ...s, name: s.title, comment: s.solution }, "service")).join("")}</div>
    <div class="admin-head secondary-head"><p class="eyebrow">Demandes</p><h1>Demandes de maintenance</h1></div>
    ${requestConversationSimple(data.maintenanceRequests || [], "maintenance")}
  `, "services");
  bindServiceForm();
  injectDeleteButtons("maintenance");
}

export function adminFormations() {
  if (!requireAdmin()) return;
  markSeen("trainingRequests");
  const list = (data.trainingRequests || []).map((f) => ({ ...f, client: `${f.name || ""} ${f.firstname || ""}`.trim(), note: f.message }));
  adminShell(`
    <div class="admin-head"><p class="eyebrow">Catalogue</p><h1>Nos Formations</h1></div>
    <form id="formation-catalog-form" class="panel admin-form">
      <input name="id" type="hidden">
      <label>Titre<input name="title" required></label>
      <label>Duree<input name="duration"></label>
      <label>Disponibilite<select name="available"><option value="true">Disponible</option><option value="false">Non disponible</option></select></label>
      <label>Description<textarea name="description" rows="4" required></textarea></label>
      <label>Image<input name="imageFile" type="file" accept="image/*"></label>
      <input name="image" placeholder="URL image">
      <button class="primary">Enregistrer la formation</button>
      <button class="ghost" type="reset">Nouvelle formation</button>
    </form>
    <div class="admin-list">${(data.formations || []).map((f) => adminItem({ ...f, name: f.title, comment: f.description, status: f.available ? "Disponible" : "Non disponible" }, "formation-item")).join("")}</div>
    <div class="admin-head secondary-head"><p class="eyebrow">Demandes</p><h1>Demandes de formation</h1></div>
    ${requestConversationSimple(list, "formation")}
  `, "formations");
  bindFormationCatalogForm();
  injectDeleteButtons("formation");
}

export function adminAppointments() {
  if (!requireAdmin()) return;
  markSeen("appointments");
  adminShell(`
    <div class="admin-head"><p class="eyebrow">Planning</p><h1>Rendez-vous</h1></div>
    ${requestConversationSimple(data.appointments, "appointment")}
  `, "appointments");
  injectDeleteButtons("appointment");
}

export function adminOrders() {
  if (!requireAdmin()) return;
  markSeen("orders");
  adminShell(`
    <div class="admin-head"><p class="eyebrow">Demandes</p><h1>Achats</h1></div>
    ${requestConversationSimple(data.orders, "order")}
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
      <p class="form-message" data-password-message></p>
    </form>
  `, "settings");
  document.querySelector("#password-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const message = document.querySelector("[data-password-message]");
    const fd = new FormData(event.target);
    
    message.textContent = "";
    message.className = "form-message";
    
    if (fd.get("current") !== getAdminPassword()) {
      message.textContent = "Mot de passe actuel incorrect.";
      message.classList.add("error");
      return;
    }
    if (fd.get("next") !== fd.get("confirm")) {
      message.textContent = "Les nouveaux mots de passe ne correspondent pas.";
      message.classList.add("error");
      return;
    }
    setAdminPassword(fd.get("next"));
    message.textContent = "Mot de passe modifie avec succes.";
    message.classList.add("success");
    event.target.reset();
  });
}

async function readImage(input, fallback, folder = "admin") {
  const file = input.files?.[0];
  if (!file) return fallback || "";
  const imageUrl = await uploadMediaFile(file, folder);
  await saveData();
  return imageUrl;
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
  const galleryContainer = document.querySelector("#machine-gallery-container");
  const specsContainer = document.querySelector("#machine-specs-container");
  const addGalleryBtn = document.querySelector("#add-machine-gallery");
  const addSpecBtn = document.querySelector("#add-machine-spec");

  const addGalleryImage = (item = {}) => {
    const index = galleryContainer.children.length;
    const div = document.createElement("div");
    div.className = "repeat-entry";
    div.dataset.index = index;
    div.innerHTML = `
      <div class="repeat-entry-head">
        <strong>Image ${index + 1}</strong>
        <button type="button" class="danger small" data-remove-repeat>Supprimer</button>
      </div>
      <label>Fichier<input name="gallery-file-${index}" type="file" accept="image/*"></label>
      <input name="gallery-url-${index}" placeholder="URL image" value="${escapeHtml(item.url || item.image || "")}">
      ${item.url || item.image ? `<img src="${escapeHtml(item.url || item.image)}" alt="" class="repeat-preview">` : ""}
    `;
    galleryContainer.appendChild(div);
  };

  const addSpec = (item = {}) => {
    const index = specsContainer.children.length;
    const div = document.createElement("div");
    div.className = "repeat-entry two-cols";
    div.dataset.index = index;
    div.innerHTML = `
      <label>Nom<input name="spec-key-${index}" value="${escapeHtml(item.key || item.label || "")}" placeholder="Norme d'emission"></label>
      <label>Valeur<input name="spec-value-${index}" value="${escapeHtml(item.value || "")}" placeholder="Euro 3"></label>
      <button type="button" class="danger small" data-remove-repeat>Supprimer</button>
    `;
    specsContainer.appendChild(div);
  };

  const loadMachineRepeaters = (item = {}) => {
    galleryContainer.innerHTML = "";
    specsContainer.innerHTML = "";
    const gallery = item.gallery?.length ? item.gallery : (item.image ? [{ url: item.image }] : []);
    gallery.forEach(addGalleryImage);
    (item.specs || []).forEach(addSpec);
  };

  addGalleryBtn?.addEventListener("click", () => addGalleryImage());
  addSpecBtn?.addEventListener("click", () => addSpec());
  form.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-repeat]");
    if (button) button.closest(".repeat-entry")?.remove();
  });
  form.addEventListener("ditona:fill", (event) => loadMachineRepeaters(event.detail || {}));
  form.addEventListener("reset", () => setTimeout(() => {
    galleryContainer.innerHTML = "";
    specsContainer.innerHTML = "";
  }, 0));
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitAdminForm(async () => {
    const fd = new FormData(form);
    const id = fd.get("id") ? Number(fd.get("id")) : Date.now();
    const existing = data.machines.find((m) => m.id === id);
    const image = await readImage(form.imageFile, fd.get("image") || existing?.image, "machines");
    const gallery = [];
    for (const entry of galleryContainer.querySelectorAll(".repeat-entry")) {
      const i = entry.dataset.index;
      const input = form.querySelector(`input[name="gallery-file-${i}"]`);
      const url = await readImage(input, fd.get(`gallery-url-${i}`) || "", "machines-gallery");
      if (url) gallery.push({ url });
    }
    if (!gallery.length && image) gallery.push({ url: image });
    const specs = [];
    for (const entry of specsContainer.querySelectorAll(".repeat-entry")) {
      const i = entry.dataset.index;
      const key = String(fd.get(`spec-key-${i}`) || "").trim();
      const value = String(fd.get(`spec-value-${i}`) || "").trim();
      if (key || value) specs.push({ key, value });
    }
    let detailsText = fd.get("detailsText") || existing?.detailsText || "";
    const detailsFileInput = form.detailsFile;
    let detailsFileUrl = fd.get("detailsFileUrl") || existing?.detailsFileUrl || "";
    let detailsFileName = fd.get("detailsFileName") || existing?.detailsFileName || "";
    const detailsFile = detailsFileInput?.files?.[0];
    if (detailsFile) {
      detailsFileName = detailsFile.name;
      const lower = detailsFile.name.toLowerCase();
      if (lower.endsWith(".txt") || lower.endsWith(".csv") || lower.endsWith(".html") || lower.endsWith(".htm")) {
        detailsText = await detailsFile.text();
      }
      detailsFileUrl = await uploadMediaFile(detailsFile, "machines-characteristics");
    }
    const next = { id, name: fd.get("name"), category: fd.get("category"), price: Number(fd.get("price")) || null, discountPercent: Math.max(0, Math.min(100, Number(fd.get("discountPercent")) || 0)), status: fd.get("status"), description: fd.get("description"), comment: fd.get("comment"), image, gallery, specs, detailsText, detailsFileUrl, detailsFileName };
    data.machines = existing ? data.machines.map((m) => m.id === id ? next : m) : [next, ...data.machines];
    await persistAdminData(adminMachines);
    });
  });
}

function bindAdForm() {
  const form = document.querySelector("#ad-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitAdminForm(async () => {
      data.ads = data.ads || [];
      const fd = new FormData(form);
      const id = fd.get("id") ? Number(fd.get("id")) : Date.now();
      const existing = data.ads.find((ad) => ad.id === id);
      const image = await readImage(form.imageFile, fd.get("image") || existing?.image, "ads");
      data.adsSettings = {
        visibleMs: Number(fd.get("globalVisibleMs")) || 22000,
        hiddenMs: Number(fd.get("globalHiddenMs")) || 18000,
      };
      const next = {
        id,
        title: fd.get("title"),
        text: fd.get("text"),
        description: fd.get("description"),
        location: fd.get("location"),
        whatsapp: fd.get("whatsapp"),
        type: fd.get("type"),
        cta: fd.get("cta") || "Commander maintenant",
        displayMs: Number(fd.get("displayMs")) || 7000,
        active: fd.get("active") === "true",
        image,
      };
      data.ads = existing ? data.ads.map((ad) => ad.id === id ? next : ad) : [next, ...data.ads];
      await persistAdminData(adminAds);
    });
  });
}

// MODIFIÉ - Gestion des étapes avec images multiples
function bindRealisationForm() {
  const form = document.querySelector("#realisation-form");
  const stepsContainer = document.querySelector("#steps-container");
  const addStepBtn = document.querySelector("#add-step-btn");
  
  // Fonction pour ajouter une étape
  function addStep(step = {}) {
    const stepIndex = stepsContainer.children.length;
    const stepDiv = document.createElement("div");
    stepDiv.className = "step-entry";
    stepDiv.dataset.index = stepIndex;
    stepDiv.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
        <h4>Etape ${stepIndex + 1}</h4>
        <button type="button" class="danger small" onclick="this.closest('.step-entry').remove()">Supprimer</button>
      </div>
      <label>Titre<input name="step-title-${stepIndex}" value="${escapeHtml(step.title || "")}"></label>
      <label>Description<textarea name="step-description-${stepIndex}" rows="2">${escapeHtml(step.description || "")}</textarea></label>
      <label>Image<input name="step-image-file-${stepIndex}" type="file" accept="image/*"></label>
      <input name="step-image-${stepIndex}" placeholder="URL image etape" value="${escapeHtml(step.image || "")}">
      ${step.image ? `<img src="${escapeHtml(step.image)}" style="max-width:150px; margin-top:8px; border-radius:6px;">` : ""}
    `;
    stepsContainer.appendChild(stepDiv);
  }
  function loadSteps(item = {}) {
    stepsContainer.innerHTML = "";
    (item.steps || []).forEach(step => addStep(step));
  }
  
  // Bouton ajouter étape
  addStepBtn?.addEventListener("click", () => addStep());
  
  // Charger les étapes existantes si modification
  form.addEventListener("ditona:fill", (event) => loadSteps(event.detail || {}));
  form.addEventListener("reset", () => setTimeout(() => stepsContainer.innerHTML = "", 0));
  
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitAdminForm(async () => {
      const fd = new FormData(form);
      const id = fd.get("id") ? Number(fd.get("id")) : Date.now();
      const existing = data.realisations.find((r) => r.id === id);
      const image = await readImage(form.imageFile, fd.get("image") || existing?.image, "realisations");
      
      // Collecter toutes les étapes
      const steps = [];
      const stepEntries = stepsContainer.querySelectorAll(".step-entry");
      for (const entry of stepEntries) {
        const i = entry.dataset.index;
        const title = fd.get(`step-title-${i}`);
        const description = fd.get(`step-description-${i}`);
        const imageInput = form.querySelector(`input[name="step-image-file-${i}"]`);
        const existingImage = fd.get(`step-image-${i}`);
        const stepImage = await readImage(imageInput, existingImage || "", "realisations-steps");
        
        if (title && description) {
          steps.push({ title, description, image: stepImage });
        }
      }
      
      const next = { id, title: fd.get("title"), comment: fd.get("comment"), image, steps };
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

// MODIFIÉ - Gestion des images pour problème, solution et historique
function bindServiceForm() {
  const form = document.querySelector("#service-form");
  const historyContainer = document.querySelector("#history-container");
  const addHistoryBtn = document.querySelector("#add-history-btn");
  
  // Fonction pour ajouter une intervention
  function addHistory(entry = {}) {
    const entryIndex = historyContainer.children.length;
    const entryDiv = document.createElement("div");
    entryDiv.className = "history-entry";
    entryDiv.dataset.index = entryIndex;
    entryDiv.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
        <h4>Intervention ${entryIndex + 1}</h4>
        <button type="button" class="danger small" onclick="this.closest('.history-entry').remove()">Supprimer</button>
      </div>
      <label>Date<input name="history-date-${entryIndex}" type="date" value="${escapeHtml(entry.date || "")}"></label>
      <label>Probleme<textarea name="history-problem-${entryIndex}" rows="2">${escapeHtml(entry.problem || "")}</textarea></label>
      <label>Solution<textarea name="history-solution-${entryIndex}" rows="2">${escapeHtml(entry.solution || "")}</textarea></label>
      <label>Image<input name="history-image-file-${entryIndex}" type="file" accept="image/*"></label>
      <input name="history-image-${entryIndex}" placeholder="URL image" value="${escapeHtml(entry.image || "")}">
      ${entry.image ? `<img src="${escapeHtml(entry.image)}" style="max-width:150px; margin-top:8px; border-radius:6px;">` : ""}
    `;
    historyContainer.appendChild(entryDiv);
  }
  function loadHistory(item = {}) {
    historyContainer.innerHTML = "";
    (item.history || []).forEach(entry => addHistory(entry));
  }
  
  // Bouton ajouter intervention
  addHistoryBtn?.addEventListener("click", () => addHistory());
  
  // Charger les interventions existantes si modification
  form.addEventListener("ditona:fill", (event) => loadHistory(event.detail || {}));
  form.addEventListener("reset", () => setTimeout(() => historyContainer.innerHTML = "", 0));
  
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitAdminForm(async () => {
      const fd = new FormData(form);
      const id = fd.get("id") ? Number(fd.get("id")) : Date.now();
      data.maintenanceServices = data.maintenanceServices || [];
      const existing = data.maintenanceServices.find((s) => s.id === id);
      const image = await readImage(form.imageFile, fd.get("image") || existing?.image, "services");
      
      // Image problème
      const problemImageInput = form.querySelector('input[name="problemImageFile"]');
      const problemImage = await readImage(problemImageInput, fd.get("problemImage") || existing?.problemImage || "", "services-problem");
      
      // Image solution
      const solutionImageInput = form.querySelector('input[name="solutionImageFile"]');
      const solutionImage = await readImage(solutionImageInput, fd.get("solutionImage") || existing?.solutionImage || "", "services-solution");
      
      // Collecter toutes les interventions
      const history = [];
      const historyEntries = historyContainer.querySelectorAll(".history-entry");
      for (const entry of historyEntries) {
        const i = entry.dataset.index;
        const date = fd.get(`history-date-${i}`);
        const problem = fd.get(`history-problem-${i}`);
        const solution = fd.get(`history-solution-${i}`);
        const imageInput = form.querySelector(`input[name="history-image-file-${i}"]`);
        const existingImage = fd.get(`history-image-${i}`);
        const entryImage = await readImage(imageInput, existingImage || "", "services-history");
        
        if (problem && solution) {
          history.push({ date, problem, solution, image: entryImage });
        }
      }
      
      const next = { 
        id, 
        title: fd.get("title"), 
        problem: fd.get("problem"), 
        problemImage,
        solution: fd.get("solution"), 
        solutionImage,
        text: fd.get("solution"), 
        history, 
        image 
      };
      data.maintenanceServices = existing ? data.maintenanceServices.map((s) => s.id === id ? next : s) : [next, ...data.maintenanceServices];
      await persistAdminData(adminServices);
    });
  });
}

function bindFormationCatalogForm() {
  const form = document.querySelector("#formation-catalog-form");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitAdminForm(async () => {
      data.formations = data.formations || [];
      const fd = new FormData(form);
      const id = fd.get("id") ? Number(fd.get("id")) : Date.now();
      const existing = data.formations.find((f) => f.id === id);
      const image = await readImage(form.imageFile, fd.get("image") || existing?.image, "formations");
      const next = {
        id,
        title: fd.get("title"),
        description: fd.get("description"),
        duration: fd.get("duration"),
        available: fd.get("available") === "true",
        image,
      };
      data.formations = existing ? data.formations.map((f) => f.id === id ? next : f) : [next, ...data.formations];
      await persistAdminData(adminFormations);
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
  main.querySelectorAll(`[data-${type}-reply]`).forEach((textarea) => {
    const id = textarea.dataset[`${type}Reply`] || textarea.getAttribute(`data-${type}-reply`);
    if (!id) return;
    const actions = textarea.closest(".request-card, .message-thread")?.querySelector(".thread-actions, .request-top");
    if (!actions) return;
    if (actions.querySelector("[data-delete-req]")) return;
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
  if (!form || !item) return;
  Object.entries(item).forEach(([key, value]) => {
    if (form[key] && key !== "imageFile") form[key].value = value ?? "";
  });
  form.dispatchEvent(new CustomEvent("ditona:fill", { detail: item }));
  form.scrollIntoView({ behavior: "smooth" });
}

export async function saveRequest(type, id) {
  const key = type === "order" ? "orders" : type === "appointment" ? "appointments" : type === "formation" ? "trainingRequests" : type === "maintenance" ? "maintenanceRequests" : "messages";
  const reply = document.querySelector(`[data-${type}-reply="${CSS.escape(String(id))}"]`)?.value || "";
  const updates = {
    seen_at: today(),
    status: reply ? "Repondu" : "Vu",
    reply,
  };
  data[key] = data[key].map((item) => String(item.id) === String(id) ? { ...item, seenAt: updates.seen_at, status: updates.status, reply } : item);
  if (type === "order") await updateOrder(id, updates);
  else if (type === "appointment") await updateAppointment(id, updates);
  else if (type === "formation") await updateTrainingRequest(id, updates);
  else if (type === "maintenance") await saveData();
  else await updateMessage(id, updates);
  if (type === "order") adminOrders();
  if (type === "appointment") adminAppointments();
  if (type === "formation") adminFormations();
  if (type === "maintenance") adminServices();
  if (type === "message") adminMessages();
}

export async function deleteRequest(type, id) {
  const key = type === "order" ? "orders" : type === "appointment" ? "appointments" : type === "formation" ? "trainingRequests" : type === "maintenance" ? "maintenanceRequests" : "messages";
  data[key] = (data[key] || []).filter((item) => String(item.id) !== String(id));
  if (type === "order") await deleteOrder(id);
  else if (type === "appointment") await deleteAppointment(id);
  else if (type === "formation") await deleteTrainingRequest(id);
  else if (type === "maintenance") await deleteMaintenanceRequest(id);
  else await deleteMessage(id);
  if (type === "order") adminOrders();
  if (type === "appointment") adminAppointments();
  if (type === "formation") adminFormations();
  if (type === "maintenance") adminServices();
  if (type === "message") adminMessages();
}

export function logout() {
  logoutAdmin();
  window.ditonaGo(ADMIN_BASE);
}
