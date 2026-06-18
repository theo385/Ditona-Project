import { data, today, addOrder, addMessage, addAppointment, addTrainingRequest, currentCustomer, loginCustomer, logoutCustomer, restoreCustomerFromUrl, signupCustomer } from "./store.js";
import { machineCard, mediaTag, orderForm, publicShell, realisationCard, requestIdentityFields, serviceCard, setSlideTimer, visualTitle } from "./components.js";
import { t, tr } from "./i18n.js";

export function homePage() {
  const media = data.homeMedia;
  publicShell(`
    <section class="home-cinema" data-hero>
      ${media.map((item, index) => `
        <article class="cinema-slide ${index === 0 ? "active" : ""}" data-slide="${index}">
          ${mediaTag(item)}
          <div class="cinema-caption">
            <p class="eyebrow">${t("home.eyebrow")}</p>
            <h1>${tr(item.title)}</h1>
            <p>${tr(item.subtitle)}</p>
          </div>
        </article>
      `).join("")}
      <div class="hero-dots">${media.map((_, index) => `<button class="${index === 0 ? "active" : ""}" data-dot="${index}"></button>`).join("")}</div>
    </section>
    <section class="ticker service-ticker">
      <div>${[...data.services, ...data.services].map((service) => `<span>${tr(service.title)}</span>`).join("")}</div>
    </section>
    <section class="home-proof">
      ${(data.homeProof || []).filter(Boolean).map((item) => `
        <article data-link="${item.target || "/realisations"}" class="click-card">
          ${mediaTag(item)}
          <div><strong>${tr(item.title)}</strong><span>${tr(item.subtitle || "")}</span></div>
        </article>
      `).join("")}
    </section>
    <section class="section home-focus">
      <div class="section-head"><div><p class="eyebrow">${t("home.eyebrow")}</p><h2>${t("home.what")}</h2></div></div>
      <div class="focus-grid">
        ${data.services.slice(0, 4).map((service) => `
          <article data-link="${service.target || "/services"}" class="click-card">
            <h3>${tr(service.title)}</h3>
            <p>${tr(service.text)}</p>
          </article>
        `).join("")}
      </div>
    </section>
  `, "/");
  startHero();
}

function startHero() {
  let index = 0;
  const slides = [...document.querySelectorAll("[data-slide]")];
  const dots = [...document.querySelectorAll("[data-dot]")];
  if (!slides.length) return;
  const show = (next) => {
    index = next;
    slides.forEach((slide, i) => slide.classList.toggle("active", i === index));
    dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
  };
  dots.forEach((dot, i) => dot.addEventListener("click", () => show(i)));
  setSlideTimer(setInterval(() => show((index + 1) % slides.length), 3400));
}

export function machinesPage() {
  publicShell(`
    ${visualTitle("machines", "Catalogue")}
    <section class="toolbar">
      <input id="machine-search" placeholder="Rechercher une machine...">
      <select id="machine-category"><option value="">Toutes categories</option>${[...new Set(data.machines.map((m) => m.category))].map((c) => `<option>${c}</option>`).join("")}</select>
    </section>
    <section class="section"><div id="machine-list" class="card-grid"></div></section>
  `, "/machines");
  const search = document.querySelector("#machine-search");
  const category = document.querySelector("#machine-category");
  const list = document.querySelector("#machine-list");
  const update = () => {
    const q = search.value.toLowerCase();
    const cat = category.value;
    const rows = data.machines.filter((m) => (!q || `${m.name} ${m.category} ${m.description}`.toLowerCase().includes(q)) && (!cat || m.category === cat));
    list.innerHTML = rows.length ? rows.map(machineCard).join("") : `<p class="empty">Aucune machine trouvee.</p>`;
    window.ditonaBindGlobal();
  };
  search.addEventListener("input", update);
  category.addEventListener("change", update);
  update();
}

export function realisationsPage() {
  publicShell(`
    ${visualTitle("realisations", "Realisations")}
    <section class="section"><div class="gallery-grid">${data.realisations.map(realisationCard).join("")}</div></section>
  `, "/realisations");
}

export function servicesPage() {
  publicShell(`
    ${visualTitle("services", "Services")}
    <section class="section"><div class="service-grid wide">${data.services.map(serviceCard).join("")}</div></section>
  `, "/services");
}

export function formationPage() {
  publicShell(`
    ${visualTitle("formation", "Formation")}
    <section class="section formation-only">
      <form id="formation-form" class="panel form-panel">
        ${requestIdentityFields()}
        <label>Ce que vous voulez apprendre<input name="training" required placeholder="CNC, maintenance, automatisation..."></label>
        <label>Niveau actuel<select name="level"><option>Debutant</option><option>Intermediaire</option><option>Avance</option><option>Entreprise / equipe</option></select></label>
        <label>Objectif<textarea name="message" rows="5" required placeholder="Expliquez votre besoin, votre ville, le nombre de personnes"></textarea></label>
        <button class="primary" type="submit">Envoyer la demande de formation</button>
      </form>
    </section>
  `, "/formation");
  document.querySelector("#formation-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const fd = Object.fromEntries(new FormData(event.target));
    await addTrainingRequest({ id: "FOR-" + Date.now().toString().slice(-6), ...fd, subject: `Formation: ${fd.training}`, status: "Nouveau", reply: "", seenAt: "", createdAt: today() });
    event.target.innerHTML = `<div class="success"><h2>Demande de formation envoyee</h2><button class="primary" data-link="/">Retour accueil</button></div>`;
    window.ditonaBindGlobal();
  });
}

export function aboutPage() {
  publicShell(`
    ${visualTitle("about", "A propos")}
    <section class="section about-grid">
      <div class="panel"><h2>Notre mission</h2><p>Concevoir, fournir, installer et maintenir des machines industrielles adaptees au terrain.</p></div>
      <div class="panel"><h2>Notre methode</h2><p>Analyse du besoin, proposition technique, fabrication ou sourcing, installation, formation et suivi apres-vente.</p></div>
      <div class="panel"><h2>Contact direct</h2><p>Email: ditonatg@gmail.com</p><p>WhatsApp: +228 70 02 12 25</p></div>
    </section>
  `, "/about");
}

export async function loginPage() {
  await restoreCustomerFromUrl();
  const session = currentCustomer();
  publicShell(`
    <section class="section login-public">
      <div class="section-head"><div><p class="eyebrow">Compte client</p><h1>Connexion utilisateur</h1></div></div>
      ${session?.user ? `
        <div class="panel form-panel customer-session">
          <h2>Connecte</h2>
          <p>${session.user.email || "Votre compte client est actif."}</p>
          <button class="primary" data-link="/machines">Voir les machines</button>
          <button class="ghost" type="button" data-customer-logout>Se deconnecter</button>
        </div>
      ` : `
        <div class="login-grid">
        <form id="customer-login-form" class="panel form-panel">
          <h2>Se connecter</h2>
          <label>E-mail<input name="email" type="email" required placeholder="client@email.com"></label>
          <label>Mot de passe<input name="password" type="password" required></label>
          <label class="check-line"><input type="checkbox" checked> Rester connecte</label>
          <button class="primary" type="submit">Se connecter</button>
          <button class="ghost" type="button" data-link="/contact">Mot de passe oublie ?</button>
          <p class="form-message" data-login-message></p>
        </form>
        <div class="login-stack">
          <form id="buyer-signup-form" class="panel form-panel">
            <h2>S'inscrire</h2>
            <label>E-mail<input name="email" type="email" required placeholder="client@email.com"></label>
            <label>Mot de passe<input name="password" type="password" required minlength="6"></label>
            <label>Confirmer le mot de passe<input name="confirm" type="password" required minlength="6"></label>
            <button class="primary" type="submit">S'inscrire</button>
            <p class="form-message" data-buyer-message></p>
          </form>
        </div>
      </div>
      `}
    </section>
  `, "/login");
  bindCustomerAuth();
}

function bindCustomerAuth() {
  document.querySelector("[data-customer-logout]")?.addEventListener("click", async () => {
    logoutCustomer();
    await loginPage();
    window.ditonaBindGlobal?.();
  });
  document.querySelector("#customer-login-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.querySelector("[data-login-message]");
    const button = event.target.querySelector('button[type="submit"]');
    try {
      button.disabled = true;
      message.textContent = "";
      const fd = new FormData(event.target);
      await loginCustomer(fd.get("email"), fd.get("password"));
      await loginPage();
      window.ditonaBindGlobal?.();
    } catch (err) {
      message.textContent = err.message;
    } finally {
      button.disabled = false;
    }
  });
  document.querySelector("#buyer-signup-form")?.addEventListener("submit", (event) => signupFromForm(event, "acheteur", "[data-buyer-message]"));
}

async function signupFromForm(event, role, messageSelector) {
  event.preventDefault();
  const message = document.querySelector(messageSelector);
  const button = event.target.querySelector('button[type="submit"]');
  try {
    button.disabled = true;
    message.textContent = "";
    const fd = new FormData(event.target);
    await signupCustomer(fd.get("email"), fd.get("password"), role, fd.get("confirm"));
    await loginPage();
    window.ditonaBindGlobal?.();
  } catch (err) {
    message.textContent = err.message;
  } finally {
    button.disabled = false;
  }
}

export function appointmentPage() {
  publicShell(`
    ${visualTitle("appointment", "Rendez-vous")}
    <section class="section appointment-only">
      <form id="appointment-form" class="panel form-panel">
        ${requestIdentityFields()}
        <label>Date souhaitee<input name="date" type="date" required></label>
        <label>Objet<select name="subject"><option>Projet machine</option><option>Maintenance</option><option>Formation</option><option>Accompagnement</option><option>Autre</option></select></label>
        <label>Message<textarea name="message" rows="5" required placeholder="Decrivez votre besoin"></textarea></label>
        <button class="primary">Envoyer la demande de rendez-vous</button>
      </form>
    </section>
  `, "/rendez-vous");
  document.querySelector("#appointment-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await addAppointment({ id: "RDV-" + Date.now().toString().slice(-6), ...Object.fromEntries(new FormData(event.target)), status: "Nouveau", reply: "", seenAt: "", createdAt: today() });
    event.target.innerHTML = `<div class="success"><h2>Rendez-vous envoye</h2><button class="primary" data-link="/">Retour accueil</button></div>`;
    window.ditonaBindGlobal();
  });
}

export function contactPage(subject = "") {
  publicShell(`
    ${visualTitle("contact", "Contact")}
    <section class="section contact-layout">
      <form id="contact-form" class="panel form-panel">
        ${requestIdentityFields()}
        <label>Sujet<input name="subject" required value="${subject}"></label>
        <label>Message<textarea name="message" required rows="6"></textarea></label>
        <button class="primary" type="submit">Envoyer le message</button>
      </form>
      <aside class="panel contact-card">
        <p><strong>Ingenieur DITONA</strong></p>
       <p>Email: <a href="mailto:ditonatg@gmail.com">ditonatg@gmail.com</a></p>

  <p>WhatsApp: <a href="https://wa.me/22870021225" target="_blank">+228 70 02 12 25</a></p>
</aside>
    </section>
  `, "/contact");
  document.querySelector("#contact-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await addMessage({ id: "MSG-" + Date.now().toString().slice(-6), ...Object.fromEntries(new FormData(event.target)), reply: "", status: "Nouveau", seenAt: "", createdAt: today() });
    event.target.innerHTML = `<div class="success"><h2>Message envoye</h2><button class="primary" data-link="/">Retour accueil</button></div>`;
    window.ditonaBindGlobal();
  });
}

export function orderMachine(id) {
  const machine = data.machines.find((m) => String(m.id) === String(id));
  if (!machine) return;
  document.querySelector("[data-modal]")?.remove();
  document.body.insertAdjacentHTML("beforeend", orderForm(machine));
  const closeModal = () => document.querySelector("[data-modal]")?.remove();
  document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", closeModal));
  document.querySelector("[data-modal]").addEventListener("click", (event) => {
    if (event.target.matches("[data-modal]")) closeModal();
  });
  document.querySelector("#order-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const fd = Object.fromEntries(new FormData(event.target));
    const client = `${fd.name} ${fd.firstname}`.trim();
    await addOrder({ id: "CMD-" + Date.now().toString().slice(-6), machineId: machine.id, machine: machine.name, price: machine.price, client, name: fd.name, firstname: fd.firstname, email: fd.email || "", phone: fd.phone, note: fd.message || "Demande creee depuis le site.", status: "Nouvelle", reply: "", seenAt: "", createdAt: today() });
    document.querySelector("#order-form").innerHTML = `<div class="success"><h2>Commande envoyee</h2><button type="button" class="primary" data-close-modal>Fermer</button></div>`;
    document.querySelector("[data-close-modal]").addEventListener("click", closeModal);
  });
}

export function chatbotAnswer(text) {
  const q = text.toLowerCase();
  if (q.includes("prix") || q.includes("cout") || q.includes("devis")) return "Pour un prix exact, indiquez la machine ou le service souhaite. L'administration recevra aussi votre demande pour vous envoyer un devis.";
  if (q.includes("maintenance") || q.includes("panne") || q.includes("sav")) return "DITONA peut intervenir pour diagnostic, depannage et remise en service. Precisez la machine, la panne et votre ville.";
  if (q.includes("formation")) return "Nous proposons des formations en fabrication, CNC, maintenance et exploitation de machines. Donnez le niveau et le nombre de participants.";
  if (q.includes("rendez") || q.includes("rdv")) return "Vous pouvez demander un rendez-vous depuis le menu Rendez-vous. Donnez aussi votre date souhaitee et votre numero WhatsApp.";
  if (q.includes("machine") || q.includes("fabrication")) return "DITONA fabrique et fournit des machines sur mesure: CNC, lignes automatisees, prototypes et equipements speciaux.";
  return "Merci. Votre message est enregistre et l'administration pourra completer la reponse des que possible.";
}
