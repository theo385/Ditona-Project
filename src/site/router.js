import {
  adminAppointments,
  adminAccounts,
  adminDashboard,
  adminHome,
  adminMachines,
  adminMessages,
  adminOrders,
  adminRealisations,
  adminSections,
  adminSettings,
  adminServices,
  adminFormations,
  fillForm,
  deleteRequest,
  logout,
  saveRequest,
  refreshAdminData,
} from "./adminPages.js";
import { messageThread, requestThread } from "./components.js";
import { data, saveData, today, loadRemoteData, refreshSiteContent } from "./store.js";
import { setLanguage } from "./i18n.js";
import { escapeHtml } from "./format.js";
import { addMessage } from "./store.js";
import {
  aboutPage,
  appointmentPage,
  chatbotAnswer,
  contactPage,
  formationPage,
  homePage,
  loginPage,
  machinesPage,
  orderMachine,
  realisationsPage,
  servicesPage,
  forgotPasswordPage,
  forgotSuccessPage,
  resetPasswordPage,
  signupSuccessPage,
} from "./publicPages.js";

export function go(path) {
  history.pushState({}, "", path);
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function bindGlobal() {
  document.querySelectorAll("[data-link]").forEach((el) => el.addEventListener("click", () => go(el.dataset.link)));
  document.querySelectorAll("[data-quote]").forEach((el) => el.addEventListener("click", () => {
    history.pushState({}, "", "/contact");
    contactPage(`Demande de devis: ${el.dataset.quote}`);
    bindGlobal();
  }));
  document.querySelectorAll("[data-order]").forEach((el) => el.addEventListener("click", () => orderMachine(el.dataset.order)));
  document.querySelectorAll("[data-image-preview]").forEach((el) => el.addEventListener("click", (event) => {
    event.stopPropagation();
    openImagePreview(el.dataset);
  }));
  document.querySelector("[data-search-go]")?.addEventListener("click", () => go("/machines"));
  document.querySelector("[data-site-search]")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") go("/machines");
  });
  document.querySelector("[data-lang]")?.addEventListener("change", (event) => {
    setLanguage(event.target.value);
    render();
  });
  document.querySelector("[data-admin-collapse]")?.addEventListener("click", () => {
    const app = document.querySelector(".admin-app");
    const collapsed = !app.classList.contains("admin-collapsed");
    app.classList.toggle("admin-collapsed", collapsed);
    localStorage.setItem("ditona_admin_nav_collapsed", collapsed ? "true" : "false");
  });
  document.querySelector("[data-logout]")?.addEventListener("click", logout);
  bindChatbot();
  bindAdminActions();
}

function openImagePreview(preview) {
  document.querySelector("[data-image-modal]")?.remove();
  document.body.insertAdjacentHTML("beforeend", `
    <section class="modal-backdrop image-modal-backdrop" data-image-modal>
      <article class="panel image-modal">
        <div class="modal-head">
          <div><p class="eyebrow">Details</p><h2>${escapeHtml(preview.previewTitle || "DITONA")}</h2></div>
          <button type="button" class="ghost small" data-close-image-modal>Fermer</button>
        </div>
        ${preview.previewText ? `<p class="image-modal-text">${escapeHtml(preview.previewText)}</p>` : ""}
        <div class="image-sides">
          <figure><img src="${escapeHtml(preview.previewFront)}" alt="${escapeHtml(preview.previewTitle || "Recto")}"><figcaption>Recto</figcaption></figure>
          <figure><img src="${escapeHtml(preview.previewBack || preview.previewFront)}" alt="${escapeHtml(preview.previewTitle || "Verso")}"><figcaption>Verso</figcaption></figure>
        </div>
      </article>
    </section>
  `);
  const close = () => document.querySelector("[data-image-modal]")?.remove();
  document.querySelector("[data-close-image-modal]")?.addEventListener("click", close);
  document.querySelector("[data-image-modal]")?.addEventListener("click", (event) => {
    if (event.target.matches("[data-image-modal]")) close();
  });
}

function bindChatbot() {
  document.querySelector("[data-chat-open]")?.addEventListener("click", () => { document.querySelector(".chat-widget").hidden = false; });
  document.querySelector("[data-chat-close]")?.addEventListener("click", () => { document.querySelector(".chat-widget").hidden = true; });
  document.querySelector("[data-chat-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = new FormData(event.target).get("text").trim();
    const autoReply = chatbotAnswer(text);
    addMessage({ id: "MSG-" + Date.now().toString().slice(-6), name: "Visiteur chatbot", email: "", phone: "", subject: "Chatbot", message: text, autoReply, reply: "", status: "Nouveau", seenAt: "", createdAt: today() });
    document.querySelector("[data-chat-log]").insertAdjacentHTML("beforeend", `<p class="user">${text}</p><p class="bot">${autoReply}</p>`);
    event.target.reset();
  });
}

function bindAdminActions() {
  document.querySelectorAll("[data-edit-home]").forEach((el) => el.addEventListener("click", () => fillForm("#home-form", data.homeMedia.find((s) => s.id === Number(el.dataset.editHome)))));
  document.querySelectorAll("[data-delete-home]").forEach((el) => el.addEventListener("click", async () => { data.homeMedia = data.homeMedia.filter((s) => s.id !== Number(el.dataset.deleteHome)); await saveData(); adminHome(); }));
  document.querySelectorAll("[data-edit-home-proof]").forEach((el) => el.addEventListener("click", () => fillForm("#home-proof-form", (data.homeProof || []).find((s) => s.id === Number(el.dataset.editHomeProof)))));
  document.querySelectorAll("[data-delete-home-proof]").forEach((el) => el.addEventListener("click", async () => { data.homeProof = (data.homeProof || []).filter((s) => s.id !== Number(el.dataset.deleteHomeProof)); await saveData(); adminHome(); }));
  document.querySelectorAll("[data-edit-machine]").forEach((el) => el.addEventListener("click", () => fillForm("#machine-form", data.machines.find((m) => m.id === Number(el.dataset.editMachine)))));
  document.querySelectorAll("[data-delete-machine]").forEach((el) => el.addEventListener("click", async () => { data.machines = data.machines.filter((m) => m.id !== Number(el.dataset.deleteMachine)); await saveData(); adminMachines(); }));
  document.querySelectorAll("[data-edit-realisation]").forEach((el) => el.addEventListener("click", () => fillForm("#realisation-form", data.realisations.find((r) => r.id === Number(el.dataset.editRealisation)))));
  document.querySelectorAll("[data-delete-realisation]").forEach((el) => el.addEventListener("click", async () => { data.realisations = data.realisations.filter((r) => r.id !== Number(el.dataset.deleteRealisation)); await saveData(); adminRealisations(); }));
  document.querySelectorAll("[data-edit-section]").forEach((el) => el.addEventListener("click", () => {
    const form = document.querySelector("#section-media-form");
    if (!form) return;
    form.key.value = el.dataset.editSection;
    form.key.dispatchEvent(new Event("change"));
    form.scrollIntoView({ behavior: "smooth" });
  }));
  document.querySelectorAll("[data-delete-section]").forEach((el) => el.addEventListener("click", () => alert("Ce media pilote une section publique. Modifiez-le au lieu de le supprimer.")));
  document.querySelectorAll("[data-edit-service]").forEach((el) => el.addEventListener("click", () => fillForm("#service-form", data.services.find((s) => s.id === Number(el.dataset.editService)))));
  document.querySelectorAll("[data-delete-service]").forEach((el) => el.addEventListener("click", async () => { data.services = data.services.filter((s) => s.id !== Number(el.dataset.deleteService)); await saveData(); adminServices(); }));
  document.querySelectorAll("[data-save-order]").forEach((el) => el.addEventListener("click", () => saveRequest("order", el.dataset.saveOrder)));
  document.querySelectorAll("[data-save-appointment]").forEach((el) => el.addEventListener("click", () => saveRequest("appointment", el.dataset.saveAppointment)));
  document.querySelectorAll("[data-save-formation]").forEach((el) => el.addEventListener("click", () => saveRequest("formation", el.dataset.saveFormation)));
  document.querySelectorAll("[data-delete-request]").forEach((el) => el.addEventListener("click", () => deleteRequest(el.dataset.deleteRequestType, el.dataset.deleteRequest)));
  document.querySelectorAll("[data-message-select]").forEach((el) => el.addEventListener("click", () => {
    const item = data.messages.find((message) => String(message.id) === String(el.dataset.messageSelect));
    document.querySelectorAll("[data-message-select]").forEach((button) => button.classList.toggle("active", button === el));
    document.querySelector("[data-message-thread]").innerHTML = messageThread(item);
    bindAdminActions();
  }));
  document.querySelectorAll("[data-request-select]").forEach((el) => el.addEventListener("click", () => {
    const [type, id] = el.dataset.requestSelect.split(":");
    const key = type === "order" ? "orders" : type === "appointment" ? "appointments" : "trainingRequests";
    const item = (data[key] || []).find((request) => String(request.id) === String(id));
    document.querySelectorAll("[data-request-select]").forEach((button) => button.classList.toggle("active", button === el));
    document.querySelector("[data-request-thread]").innerHTML = requestThread(item, type);
    bindAdminActions();
  }));
}

function setAdminMode(enabled) {
  document.documentElement.classList.toggle("admin-mode", enabled);
  document.body.classList.toggle("admin-mode", enabled);
}

export function render() {
  const path = location.pathname;
  if (path === "/machines") return loadRemoteData().then(() => refreshSiteContent()).then(() => { machinesPage(); bindGlobal(); });
  if (path === "/realisations") return loadRemoteData().then(() => refreshSiteContent()).then(() => { realisationsPage(); bindGlobal(); });
  if (path === "/services") return loadRemoteData().then(() => refreshSiteContent()).then(() => { servicesPage(); bindGlobal(); });
  if (path === "/formation") return loadRemoteData().then(() => { formationPage(); bindGlobal(); });
  if (path === "/about") return loadRemoteData().then(() => { aboutPage(); bindGlobal(); });
  if (path === "/rendez-vous") return loadRemoteData().then(() => { appointmentPage(); bindGlobal(); });
  if (path === "/contact") return loadRemoteData().then(() => { contactPage(); bindGlobal(); });
  if (path === "/forgot-password") return loadRemoteData().then(() => { forgotPasswordPage(); bindGlobal(); });
  if (path === "/forgot-success") return loadRemoteData().then(() => { forgotSuccessPage(); bindGlobal(); });
  if (path === "/signup-success") return loadRemoteData().then(() => { signupSuccessPage(); bindGlobal(); });
  if (path === "/reset-password") return loadRemoteData().then(() => resetPasswordPage().then(bindGlobal));
  if (path === "/login") {
    return loadRemoteData().then(() => loginPage().then(bindGlobal));
  }
  if (path.startsWith("/admin")) {
    setAdminMode(true);
    return refreshAdminData().then(() => {
      if (path === "/admin/home") return adminHome();
      if (path === "/admin/sections") return adminSections();
      if (path === "/admin/machines") return adminMachines();
      if (path === "/admin/realisations") return adminRealisations();
      if (path === "/admin/services") return adminServices();
      if (path === "/admin/formations") return adminFormations();
      if (path === "/admin/appointments") return adminAppointments();
      if (path === "/admin/orders") return adminOrders();
      if (path === "/admin/messages") return adminMessages();
      if (path === "/admin/accounts") return adminAccounts();
      if (path === "/admin/settings") return adminSettings();
      adminDashboard();
    });
  }
  setAdminMode(false);
  return loadRemoteData().then(() => refreshSiteContent()).then(() => { homePage(); bindGlobal(); });
}

export async function startApp() {
  window.ditonaGo = go;
  window.ditonaBindGlobal = bindGlobal;
  window.addEventListener("popstate", render);
  setInterval(() => {
    const publicSyncedPaths = ["/", "/machines", "/realisations", "/services"];
    if (document.hidden || location.pathname.startsWith("/admin") || !publicSyncedPaths.includes(location.pathname)) return;
    refreshSiteContent().then((changed) => {
      if (changed) render();
    });
  }, 5000);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden || location.pathname.startsWith("/admin")) return;
    refreshSiteContent().then(() => {
      if (location.pathname === "/" || location.pathname === "/machines" || location.pathname === "/realisations" || location.pathname === "/services") {
        render();
      }
    });
  });
  await loadRemoteData();
  render();
}