import { data, today, addOrder, addMessage, addAppointment, addTrainingRequest, addMaintenanceRequest, currentCustomer, loginCustomer, logoutCustomer, restoreCustomerFromUrl, signupCustomer, requestPasswordReset, resetPassword, exchangeCodeForSession } from "./store.js";
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

// CORRIGÉ - Affichage des images des étapes
export function realisationDetailPage(id) {
  const item = data.realisations.find((row) => String(row.id) === String(id));
  if (!item) return realisationsPage();
  const steps = item.steps?.length ? item.steps : [
    { title: "Analyse du besoin", description: item.comment || item.description || "" },
    { title: "Preparation", description: "Choix des pieces, organisation de l'intervention et validation technique." },
    { title: "Realisation", description: "Fabrication, montage, reglage et controles de fonctionnement." },
    { title: "Validation", description: "Essais finaux, securite et remise au client." },
  ];
  publicShell(`
    <section class="detail-hero">
      <img src="${item.image}" alt="${tr(item.title)}">
      <div><p class="eyebrow">${t("realisations.title")}</p><h1>${tr(item.title)}</h1><p>${tr(item.comment || item.description || "")}</p></div>
    </section>
    <section class="section detail-layout">
      <button class="ghost" data-link="/realisations">${t("realisations.back")}</button>
      <div class="timeline">${steps.map((step, index) => `
        <article class="panel step-card">
          <span>${index + 1}</span>
          <div>
            <h2>${tr(step.title)}</h2>
            <p>${tr(step.description)}</p>
            ${step.image ? `<img src="${step.image}" alt="${tr(step.title)}" style="width:100%; max-width:600px; border-radius:8px; margin-top:16px;">` : ""}
          </div>
        </article>
      `).join("")}</div>
    </section>
  `, "/realisations");
}

export function servicesPage() {
  publicShell(`
    ${visualTitle("services", "Maintenance")}
    <section class="section">
      <div class="section-head"><div><p class="eyebrow">${t("maintenance.title")}</p><h2>${t("maintenance.subtitle")}</h2></div><button class="primary" data-link="/services/demande">${t("maintenance.request")}</button></div>
      <div class="service-grid wide">${(data.maintenanceServices || []).map(serviceCard).join("")}</div>
    </section>
  `, "/services");
}

// CORRIGÉ - Affichage des images problème, solution et historique
export function maintenanceDetailPage(id) {
  const item = (data.maintenanceServices || []).find((row) => String(row.id) === String(id));
  if (!item) return servicesPage();
  publicShell(`
    <section class="detail-hero">
      <img src="${item.image}" alt="${tr(item.title)}">
      <div><p class="eyebrow">${t("maintenance.title")}</p><h1>${tr(item.title)}</h1><p>${tr(item.solution || item.text || "")}</p></div>
    </section>
    <section class="section detail-layout">
      <button class="ghost" data-link="/services">${t("realisations.back")}</button>
      <div class="panel maintenance-story">
        <h2>${t("maintenance.problem")}</h2>
        <p>${tr(item.problem || "")}</p>
        ${item.problemImage ? `<img src="${item.problemImage}" alt="Probleme" style="width:100%; max-width:600px; border-radius:8px; margin-top:16px;">` : ""}
        <h2>${t("maintenance.solution")}</h2>
        <p>${tr(item.solution || item.text || "")}</p>
        ${item.solutionImage ? `<img src="${item.solutionImage}" alt="Solution" style="width:100%; max-width:600px; border-radius:8px; margin-top:16px;">` : ""}
      </div>
      <div class="timeline">${(item.history || []).map((row) => `
        <article class="panel step-card">
          <span>${row.date || ""}</span>
          <div>
            <h2>${tr(row.problem)}</h2>
            <p>${tr(row.solution)}</p>
            ${row.image ? `<img src="${row.image}" alt="Intervention" style="width:100%; max-width:500px; border-radius:8px; margin-top:16px;">` : ""}
          </div>
        </article>
      `).join("")}</div>
    </section>
  `, "/services");
}

export function maintenanceRequestPage() {
  publicShell(`
    ${visualTitle("services", "Maintenance")}
    <section class="section formation-only">
      <form id="maintenance-form" class="panel form-panel">
        <h2>${t("maintenance.questionnaire")}</h2>
        ${requestIdentityFields()}
        <label>${t("maintenance.purchasedFrom")}
          <select name="purchasedFromDitona" data-maintenance-origin>
            <option value="Oui">${t("maintenance.yes")}</option>
            <option value="Non">${t("maintenance.no")}</option>
          </select>
        </label>
        <label data-reference-field>${t("maintenance.reference")}<input name="reference" placeholder="${t("maintenance.referenceHelp")}"></label>
        <label data-photo-field hidden>${t("maintenance.addPhoto")}<input name="photo" type="file" accept="image/*"></label>
        <label>${t("maintenance.behavior")}<textarea name="behavior" rows="6" required placeholder="${t("maintenance.behaviorPlaceholder")}"></textarea></label>
        <button class="primary" type="submit">${t("maintenance.submit")}</button>
      </form>
    </section>
  `, "/services");
  const origin = document.querySelector("[data-maintenance-origin]");
  const reference = document.querySelector("[data-reference-field]");
  const photo = document.querySelector("[data-photo-field]");
  const toggle = () => {
    const ditona = origin.value === "Oui";
    reference.hidden = !ditona;
    photo.hidden = ditona;
  };
  origin.addEventListener("change", toggle);
  toggle();
  document.querySelector("#maintenance-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const fd = new FormData(event.target);
    await addMaintenanceRequest({
      id: "MNT-" + Date.now().toString().slice(-6),
      name: fd.get("name"),
      firstname: fd.get("firstname"),
      phone: fd.get("phone"),
      email: fd.get("email"),
      purchasedFromDitona: fd.get("purchasedFromDitona"),
      reference: fd.get("reference") || "",
      photoName: fd.get("photo")?.name || "",
      behavior: fd.get("behavior"),
      subject: "Demande de maintenance",
      status: "Nouveau",
      reply: "",
      seenAt: "",
      createdAt: today(),
    });
    event.target.innerHTML = `<div class="success"><h2>${t("maintenance.submitted")}</h2><p>${t("maintenance.submittedMsg")}</p><button class="primary" data-link="/">Retour accueil</button></div>`;
    window.ditonaBindGlobal();
  });
}

export function formationPage() {
  publicShell(`
    ${visualTitle("formation", "Formation")}
    <section class="section">
      <div class="gallery-grid">${(data.formations || []).map((formation) => `
        <article class="item-card click-card" data-link="/formation/${formation.id}">
          <img src="${formation.image}" alt="${tr(formation.title)}">
          <div class="item-body">
            <span class="pill">${formation.available ? t("formations.available") : t("formations.unavailable")}</span>
            <h3>${tr(formation.title)}</h3>
            <p>${tr(formation.description)}</p>
            <p class="comment">${tr(formation.duration || "")}</p>
            <button class="primary small" ${formation.available ? `data-link="/formation/${formation.id}"` : "disabled"}>${t("formations.apply")}</button>
          </div>
        </article>
      `).join("")}</div>
    </section>
  `, "/formation");
}

export function trainingApplyPage(id) {
  const formation = (data.formations || []).find((row) => String(row.id) === String(id));
  if (!formation) return formationPage();
  publicShell(`
    ${visualTitle("formation", "Formation")}
    <section class="section formation-only">
      <form id="formation-form" class="panel form-panel">
        <h2>${t("formations.applyTitle")}: ${tr(formation.title)}</h2>
        ${requestIdentityFields()}
        <input name="training" type="hidden" value="${formation.title}">
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
        <form id="customer-login-form" class="panel form-panel">
          <h2>Se connecter</h2>
          <label>E-mail<input name="email" type="email" required placeholder="client@email.com"></label>
          <label>Mot de passe<input name="password" type="password" required></label>
          <label class="check-line"><input type="checkbox" checked> Rester connecte</label>
          <button class="primary" type="submit">Se connecter</button>
          <button class="ghost" type="button" data-link="/forgot-password">Mot de passe oublie ?</button>
          <p class="auth-switch">Pas encore de compte ? <button class="link-button" type="button" data-link="/signup">S'inscrire</button></p>
          <p class="form-message" data-login-message></p>
        </form>
      `}
    </section>
  `, "/login");
  bindCustomerAuth();
}

export function signupPage() {
  publicShell(`
    <section class="section login-public">
      <div class="section-head"><div><p class="eyebrow">${t("signup.title")}</p><h1>${t("signup.title")}</h1></div></div>
      <form id="buyer-signup-form" class="panel form-panel">
        <h2>${t("signup.title")}</h2>
        <label>${t("signup.email")}<input name="email" type="email" required placeholder="client@email.com"></label>
        <label>${t("signup.password")}<input name="password" type="password" required minlength="6"></label>
        <label>${t("signup.confirm")}<input name="confirm" type="password" required minlength="6"></label>
        <button class="primary" type="submit">${t("signup.submit")}</button>
        <button class="ghost" type="button" data-link="/login">${t("signup.back")}</button>
        <p class="form-message" data-buyer-message></p>
      </form>
    </section>
  `, "/signup");
  bindCustomerAuth();
}

export function forgotPasswordPage() {
  publicShell(`
    <section class="section login-public">
      <div class="section-head"><div><p class="eyebrow">Mot de passe oublie</p><h1>Recuperer l'acces</h1></div></div>
      <form id="forgot-password-form" class="panel form-panel" style="max-width: 500px; margin: 0 auto;">
        <p style="color: var(--muted); margin-bottom: 1.5rem;">Entrez votre adresse e-mail et nous vous enverrons un lien pour creer un nouveau mot de passe.</p>
        <label>E-mail<input name="email" type="email" required placeholder="client@email.com"></label>
        <button class="primary" type="submit">Envoyer le lien</button>
        <button class="ghost" type="button" data-link="/login">Retour a la connexion</button>
        <p class="form-message" data-forgot-message></p>
      </form>
    </section>
  `, "/forgot-password");
  
  document.querySelector("#forgot-password-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.querySelector("[data-forgot-message]");
    const button = event.target.querySelector('button[type="submit"]');
    try {
      button.disabled = true;
      message.textContent = "";
      message.className = "form-message";
      const fd = new FormData(event.target);
      await requestPasswordReset(fd.get("email"));
      window.ditonaGo("/forgot-success");
    } catch (err) {
      console.error("Forgot password error:", err);
      message.textContent = err.message || "Erreur lors de l'envoi du lien.";
      message.classList.add("error");
    } finally {
      button.disabled = false;
    }
  });
}

export function forgotSuccessPage() {
  publicShell(`
    <section class="section login-public">
      <div class="section-head"><div><p class="eyebrow">Mot de passe oublie</p><h1>Lien envoye</h1></div></div>
      <div class="panel form-panel" style="max-width: 500px; margin: 0 auto; text-align: center;">
        <div style="display: flex; justify-content: center; margin-bottom: 1.5rem;">
          <div style="width: 80px; height: 80px; border-radius: 50%; background: #dcfce7; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 2.5rem; color: #16a34a; font-weight: 900;">✓</span>
          </div>
        </div>
        <h2 style="color: #16a34a; margin-bottom: 1rem;">Lien envoye avec succes</h2>
        <p style="color: var(--muted); margin-bottom: 2rem; line-height: 1.6;">
          Un lien de reinitialisation de mot de passe a ete envoye a votre adresse e-mail. 
          Verifiez votre boite de reception (et vos spams) et cliquez sur le lien pour creer un nouveau mot de passe.
        </p>
        <button class="primary" data-link="/login" style="width: 100%;">Retour a la connexion</button>
      </div>
    </section>
  `, "/forgot-success");
}

export async function resetPasswordPage() {
  const query = new URLSearchParams(location.search);
  const code = query.get("code");
  
  if (!code) {
    publicShell(`
      <section class="section login-public">
        <div class="section-head"><div><p class="eyebrow">Erreur</p><h1>Lien invalide</h1></div></div>
        <div class="panel form-panel" style="max-width: 500px; margin: 0 auto; text-align: center;">
          <p style="color: var(--muted); margin-bottom: 1.5rem;">Ce lien de reinitialisation est invalide ou a expire.</p>
          <button class="primary" data-link="/forgot-password">Demander un nouveau lien</button>
        </div>
      </section>
    `, "/reset-password");
    return;
  }
  
  let accessToken;
  try {
    accessToken = await exchangeCodeForSession(code);
  } catch (err) {
    publicShell(`
      <section class="section login-public">
        <div class="section-head"><div><p class="eyebrow">Erreur</p><h1>Lien invalide</h1></div></div>
        <div class="panel form-panel" style="max-width: 500px; margin: 0 auto; text-align: center;">
          <p style="color: var(--muted); margin-bottom: 1.5rem;">${err.message || "Ce lien est invalide ou a expire."}</p>
          <button class="primary" data-link="/forgot-password">Demander un nouveau lien</button>
        </div>
      </section>
    `, "/reset-password");
    return;
  }
  
  publicShell(`
    <section class="section login-public">
      <div class="section-head"><div><p class="eyebrow">Nouveau mot de passe</p><h1>Creer un nouveau mot de passe</h1></div></div>
      <form id="reset-password-form" class="panel form-panel" style="max-width: 500px; margin: 0 auto;">
        <p style="color: var(--muted); margin-bottom: 1.5rem;">Choisissez un nouveau mot de passe pour votre compte.</p>
        <label>Nouveau mot de passe<input name="password" type="password" required minlength="6" placeholder="Minimum 6 caracteres"></label>
        <label>Confirmer le mot de passe<input name="confirm" type="password" required minlength="6"></label>
        <button class="primary" type="submit">Mettre a jour le mot de passe</button>
        <p class="form-message" data-reset-message></p>
      </form>
    </section>
  `, "/reset-password");
  
  document.querySelector("#reset-password-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.querySelector("[data-reset-message]");
    const button = event.target.querySelector('button[type="submit"]');
    try {
      button.disabled = true;
      message.textContent = "";
      message.className = "form-message";
      const fd = new FormData(event.target);
      const password = fd.get("password");
      const confirm = fd.get("confirm");
      
      if (password !== confirm) {
        throw new Error("Les mots de passe ne correspondent pas.");
      }
      
      await resetPassword(password, accessToken);
      message.innerHTML = `<span class="success-badge">Mot de passe modifie avec succes</span>`;
      message.classList.add("success");
      
      setTimeout(() => {
        window.ditonaGo("/login");
      }, 2000);
    } catch (err) {
      console.error("Reset password error:", err);
      message.textContent = err.message || "Erreur lors de la modification.";
      message.classList.add("error");
    } finally {
      button.disabled = false;
    }
  });
}

export function signupSuccessPage() {
  publicShell(`
    <section class="section login-public">
      <div class="section-head"><div><p class="eyebrow">Inscription</p><h1>Compte cree avec succes</h1></div></div>
      <div class="panel form-panel" style="max-width: 500px; margin: 0 auto; text-align: center;">
        <div style="display: flex; justify-content: center; margin-bottom: 1.5rem;">
          <div style="width: 80px; height: 80px; border-radius: 50%; background: #dcfce7; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 2.5rem; color: #16a34a; font-weight: 900;">✓</span>
          </div>
        </div>
        <h2 style="color: #16a34a; margin-bottom: 1rem;">Compte cree avec succes</h2>
        <p style="color: var(--muted); margin-bottom: 2rem; line-height: 1.6;">
          Votre compte a ete cree avec succes. Un e-mail de confirmation vous a ete envoye. 
          Verifiez votre boite de reception et cliquez sur le lien pour activer votre compte.
        </p>
        <button class="primary" data-link="/login" style="width: 100%;">Aller a la connexion</button>
      </div>
    </section>
  `, "/signup-success");
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
      message.className = "form-message";
      const fd = new FormData(event.target);
      await loginCustomer(fd.get("email"), fd.get("password"));
      await loginPage();
      window.ditonaBindGlobal?.();
    } catch (err) {
      console.error("Login error:", err);
      message.textContent = err.message || "Erreur de connexion. Verifiez vos identifiants.";
      message.classList.add("error");
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
    message.className = "form-message";
    const fd = new FormData(event.target);
    await signupCustomer(fd.get("email"), fd.get("password"), role, fd.get("confirm"));
    window.ditonaGo("/signup-success");
  } catch (err) {
    console.error("Signup error:", err);
    message.textContent = err.message || "Inscription impossible. Essayez un autre e-mail.";
    message.classList.add("error");
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
        <p><strong>DITONA Engineering</strong></p>
        <p><strong>${t("contacts.address")}:</strong> ${t("contacts.addressValue")}</p>
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