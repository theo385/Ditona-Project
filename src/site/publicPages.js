import { data, today, addOrder, addMessage, addAppointment, addTrainingRequest, addMaintenanceRequest, addMachineComment, currentCustomer, loginCustomer, logoutCustomer, restoreCustomerFromUrl, signupCustomer, requestPasswordReset, resetPassword, exchangeCodeForSession, uploadMediaFile } from "./store.js";
import { machineCard, mediaTag, orderForm, publicShell, realisationCard, requestIdentityFields, serviceCard, setSlideTimer, visualTitle } from "./components.js";
import { discountedPrice, escapeHtml, money } from "./format.js";
import { t, tr, trField } from "./i18n.js";

export function homePage() {
  const media = data.homeMedia;
  publicShell(`
    <section class="home-cinema" data-hero>
      ${media.map((item, index) => `
        <article class="cinema-slide ${index === 0 ? "active" : ""}" data-slide="${index}">
          ${mediaTag(item)}
          <div class="cinema-caption">
            <p class="eyebrow">${t("home.eyebrow")}</p>
            <h1>${trField(item, "title")}</h1>
            <p>${trField(item, "subtitle")}</p>
          </div>
        </article>
      `).join("")}
      <div class="hero-dots">${media.map((_, index) => `<button class="${index === 0 ? "active" : ""}" data-dot="${index}"></button>`).join("")}</div>
    </section>
    <section class="ticker service-ticker">
      <div>${[...data.services, ...data.services].map((service) => `<span>${trField(service, "title")}</span>`).join("")}</div>
    </section>
    <section class="home-proof">
      ${(data.homeProof || []).filter(Boolean).map((item) => `
        <article data-link="${item.target || "/realisations"}" class="click-card">
          ${mediaTag(item)}
          <div><strong>${trField(item, "title")}</strong><span>${trField(item, "subtitle")}</span></div>
        </article>
      `).join("")}
    </section>
    <section class="section home-focus">
      <div class="section-head"><div><p class="eyebrow">${t("home.eyebrow")}</p><h2>${t("home.what")}</h2></div></div>
      <div class="focus-grid">
        ${data.services.slice(0, 4).map((service) => `
          <article data-link="${service.target || "/services"}" class="click-card">
            <h3>${trField(service, "title")}</h3>
            <p>${trField(service, "text")}</p>
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
      <select id="machine-category"><option value="">${tr("Toutes categories")}</option>${[...new Set(data.machines.map((m) => m.category))].map((c) => `<option value="${c}">${tr(c)}</option>`).join("")}</select>
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

function machineImages(machine) {
  const rows = [
    ...(machine.gallery || []).map((item) => item.url || item.image || item),
    machine.image,
    machine.backImage,
  ].filter(Boolean);
  return [...new Set(rows)];
}

function renderSpecs(machine) {
  const specs = machine.specs?.length ? machine.specs : [
    machine.category ? { key: "Categorie", value: trField(machine, "category") } : null,
    machine.status ? { key: "Statut", value: trField(machine, "status") } : null,
    machine.price ? { key: "Prix", value: `${machine.price} FCFA` } : null,
  ].filter(Boolean);
  if (!specs.length) return "";
  return `
    <section class="machine-detail-section">
      <h2>Caracteristiques du produit</h2>
      <div class="spec-table">
        ${specs.map((spec) => `
          <div class="spec-name">${escapeHtml(trField(spec, "key"))}</div>
          <div class="spec-value">${escapeHtml(trField(spec, "value"))}</div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderDetailsText(text = "") {
  const clean = String(text || "").trim();
  if (!clean) return "";
  const rows = clean.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const tableRows = rows
    .map((line) => line.split(/\t|;|,/).map((cell) => cell.trim()).filter(Boolean))
    .filter((cells) => cells.length > 1);
  if (tableRows.length >= 2 && tableRows.length === rows.length) {
    return `<div class="loaded-spec-table">${tableRows.map((cells) => `<div>${cells.map((cell) => `<span>${escapeHtml(cell)}</span>`).join("")}</div>`).join("")}</div>`;
  }
  return `<div class="loaded-spec-text">${rows.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</div>`;
}

export function machineDetailPage(id) {
  const machine = data.machines.find((row) => String(row.id) === String(id));
  if (!machine) return machinesPage();
  const images = machineImages(machine);
  const pricing = discountedPrice(machine);
  const comments = (data.machineComments || []).filter((comment) => String(comment.machineId || comment.machine_id) === String(machine.id));
  const session = currentCustomer();
  const recommendations = data.machines.filter((row) => String(row.id) !== String(machine.id)).slice(0, 10);

  publicShell(`
    <section class="machine-detail-page">
      <div class="machine-gallery-panel">
        <aside class="thumb-rail">
          ${images.map((image, index) => `<button class="${index === 0 ? "active" : ""}" data-machine-thumb="${escapeHtml(image)}"><img src="${escapeHtml(image)}" alt="${escapeHtml(trField(machine, "name"))}"></button>`).join("")}
        </aside>
        <figure class="machine-main-image">
          <img src="${escapeHtml(images[0] || machine.image)}" alt="${escapeHtml(trField(machine, "name"))}" data-machine-main>
        </figure>
      </div>
      <aside class="machine-buy-panel">
        <p class="eyebrow">${escapeHtml(trField(machine, "category"))}</p>
        <h1>${escapeHtml(trField(machine, "name"))}</h1>
        <a href="#machine-comments">Voir les avis</a>
        <div class="machine-price-grid">
          <strong>${money(pricing.finalPrice)}</strong>
          ${pricing.discount ? `<span><del>${money(pricing.price)}</del><b>-${pricing.discount}%</b></span>` : ""}
        </div>
        <p>${escapeHtml(trField(machine, "description"))}</p>
        ${machine.comment ? `<p class="machine-note">${escapeHtml(trField(machine, "comment"))}</p>` : ""}
        <button class="primary" data-order="${escapeHtml(machine.id)}">Envoyer demande</button>
        <button class="ghost" data-link="/contact">Discuter ici</button>
      </aside>
    </section>
    <section class="machine-content-layout">
      <div>
        ${renderSpecs(machine)}
        ${(machine.detailsText || machine.detailsFileUrl) ? `
          <section class="machine-detail-section">
            <h2>Caracteristiques detaillees</h2>
            ${renderDetailsText(machine.detailsText)}
            ${machine.detailsFileUrl ? `<a class="ghost small" href="${escapeHtml(machine.detailsFileUrl)}" target="_blank" rel="noopener">Ouvrir le fichier: ${escapeHtml(machine.detailsFileName || "document")}</a>` : ""}
          </section>
        ` : ""}
        <section class="machine-detail-section" id="machine-comments">
          <h2>Commentaires</h2>
          ${session?.user ? `
            <form id="machine-comment-form" class="comment-form">
              <label>Votre commentaire<textarea name="message" rows="4" required></textarea></label>
              <button class="primary" type="submit">Publier le commentaire</button>
              <p class="form-message" data-comment-message></p>
            </form>
          ` : `
            <div class="login-required">
              <button class="primary" data-link="/signup">Creer un compte</button>
              <button class="ghost" data-link="/login">Se connecter</button>
            </div>
          `}
          <div class="comment-list">
            ${comments.length ? comments.map((comment) => `
              <article class="comment-row">
                <strong>${escapeHtml(comment.name || comment.email || "Utilisateur")}</strong>
                <small>${escapeHtml(comment.createdAt || comment.created_at || "")}</small>
                <p>${escapeHtml(comment.message || "")}</p>
              </article>
            `).join("") : `<p class="empty">Aucun commentaire pour le moment.</p>`}
          </div>
        </section>
        ${recommendations.length ? `
          <section class="machine-detail-section">
            <div class="recommendation-head">
              <h2>Autres recommandations</h2>
              <div>
                <button class="ghost small" type="button" data-reco-prev aria-label="Precedent">‹</button>
                <button class="ghost small" type="button" data-reco-next aria-label="Suivant">›</button>
              </div>
            </div>
            <div class="recommendation-row" data-recommendation-row>
              ${recommendations.map((item) => {
                const itemPricing = discountedPrice(item);
                return `
                  <article data-link="/machines/${escapeHtml(item.id)}" class="recommendation-card">
                    <img src="${escapeHtml(item.image)}" alt="${escapeHtml(trField(item, "name"))}">
                    <strong>${escapeHtml(trField(item, "name"))}</strong>
                    <span>${money(itemPricing.finalPrice)}</span>
                  </article>
                `;
              }).join("")}
            </div>
          </section>
        ` : ""}
      </div>
    </section>
  `, "/machines");

  document.querySelectorAll("[data-machine-thumb]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelector("[data-machine-main]").src = button.dataset.machineThumb;
      document.querySelectorAll("[data-machine-thumb]").forEach((thumb) => thumb.classList.toggle("active", thumb === button));
    });
  });
  document.querySelector("#machine-comment-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.querySelector("[data-comment-message]");
    const fd = new FormData(event.target);
    try {
      const user = currentCustomer()?.user;
      await addMachineComment({
        id: "COM-" + Date.now().toString().slice(-6),
        machineId: machine.id,
        name: user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "Utilisateur",
        email: user?.email || "",
        message: fd.get("message"),
        status: "Publie",
        createdAt: today(),
      });
      machineDetailPage(machine.id);
      window.ditonaBindGlobal?.();
    } catch (err) {
      message.textContent = err.message || "Commentaire impossible.";
      message.classList.add("error");
    }
  });
  const recommendationRow = document.querySelector("[data-recommendation-row]");
  document.querySelector("[data-reco-prev]")?.addEventListener("click", () => {
    recommendationRow?.scrollBy({ left: -Math.max(260, recommendationRow.clientWidth * 0.8), behavior: "smooth" });
  });
  document.querySelector("[data-reco-next]")?.addEventListener("click", () => {
    recommendationRow?.scrollBy({ left: Math.max(260, recommendationRow.clientWidth * 0.8), behavior: "smooth" });
  });
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
      <img src="${item.image}" alt="${trField(item, "title")}">
      <div><p class="eyebrow">${t("realisations.title")}</p><h1>${trField(item, "title")}</h1><p>${trField(item, item.comment ? "comment" : "description")}</p></div>
    </section>
    <section class="section detail-layout">
      <button class="ghost" data-link="/realisations">${t("realisations.back")}</button>
      <div class="timeline">${steps.map((step, index) => `
        <article class="panel step-card">
          <span>${index + 1}</span>
          <div>
            <h2>${trField(step, "title")}</h2>
            <p>${trField(step, "description")}</p>
            ${step.image ? `<img src="${step.image}" alt="${trField(step, "title")}" style="width:100%; max-width:600px; border-radius:8px; margin-top:16px;">` : ""}
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
      <img src="${item.image}" alt="${trField(item, "title")}">
      <div><p class="eyebrow">${t("maintenance.title")}</p><h1>${trField(item, "title")}</h1><p>${trField(item, item.solution ? "solution" : "text")}</p></div>
    </section>
    <section class="section detail-layout">
      <button class="ghost" data-link="/services">${t("realisations.back")}</button>
      <div class="panel maintenance-story">
        <h2>${t("maintenance.problem")}</h2>
        <p>${trField(item, "problem")}</p>
        ${item.problemImage ? `<img src="${item.problemImage}" alt="Probleme" style="width:100%; max-width:600px; border-radius:8px; margin-top:16px;">` : ""}
        <h2>${t("maintenance.solution")}</h2>
        <p>${trField(item, item.solution ? "solution" : "text")}</p>
        ${item.solutionImage ? `<img src="${item.solutionImage}" alt="Solution" style="width:100%; max-width:600px; border-radius:8px; margin-top:16px;">` : ""}
      </div>
      <div class="timeline">${(item.history || []).map((row) => `
        <article class="panel step-card">
          <span>${row.date || ""}</span>
          <div>
            <h2>${trField(row, "problem")}</h2>
            <p>${trField(row, "solution")}</p>
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
        
        <label style="margin-bottom: 20px;">
          <strong>La machine est-elle de DITONA ?</strong>
          <div style="display: flex; gap: 30px; margin-top: 12px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: normal;">
              <input type="radio" name="purchasedFromDitona" value="Oui" data-maintenance-origin>
              <strong>Oui</strong>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: normal;">
              <input type="radio" name="purchasedFromDitona" value="Non" data-maintenance-origin>
              <strong>Non</strong>
            </label>
          </div>
        </label>
        
        <label data-reference-field hidden style="transition: all 0.3s ease;">
          <strong>Numéro de référence</strong>
          <input name="reference" placeholder="Entrez le numéro de référence de votre machine DITONA">
        </label>
        
        <label data-photo-field hidden style="transition: all 0.3s ease;">
          <strong>Ajouter une photo de la machine</strong>
          <input name="photo" type="file" accept="image/*">
        </label>
        
        <label>
          <strong>Décrivez le comportement de la machine</strong>
          <textarea name="behavior" rows="6" required placeholder="Décrivez les symptômes, les bruits, les erreurs affichées..."></textarea>
        </label>
        
        <button class="primary" type="submit">${t("maintenance.submit")}</button>
      </form>
    </section>
  `, "/services");
  
  const radios = document.querySelectorAll("[data-maintenance-origin]");
  const reference = document.querySelector("[data-reference-field]");
  const photo = document.querySelector("[data-photo-field]");
  
  const toggle = () => {
    const selected = document.querySelector("[data-maintenance-origin]:checked");
    if (!selected) {
      reference.hidden = true;
      photo.hidden = true;
      return;
    }
    
    if (selected.value === "Oui") {
      reference.hidden = false;
      photo.hidden = true;
      // Rendre le champ référence requis si Oui
      reference.querySelector("input").required = true;
      photo.querySelector("input").required = false;
    } else if (selected.value === "Non") {
      reference.hidden = true;
      photo.hidden = false;
      // Rendre le champ photo requis si Non
      reference.querySelector("input").required = false;
      photo.querySelector("input").required = true;
    }
  };
  
  radios.forEach(radio => {
    radio.addEventListener("change", toggle);
  });
  
  // Initialiser l'état
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
    event.target.innerHTML = `<div class="success"><h2>${t("maintenance.submitted")}</h2><p>${t("maintenance.submittedMsg")}</p><button class="primary" data-link="/">${tr("Retour accueil")}</button></div>`;
    window.ditonaBindGlobal();
  });
}

export function formationPage() {
  publicShell(`
    ${visualTitle("formation", "Formation")}
    <section class="section">
      <div class="gallery-grid">${(data.formations || []).map((formation) => `
        <article class="item-card click-card" data-link="/formation/${formation.id}">
          <img src="${formation.image}" alt="${trField(formation, "title")}">
          <div class="item-body">
            <span class="pill">${formation.available ? t("formations.available") : t("formations.unavailable")}</span>
            <h3>${trField(formation, "title")}</h3>
            <p>${trField(formation, "description")}</p>
            <p class="comment">${trField(formation, "duration")}</p>
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
        <h2>${t("formations.applyTitle")}: ${trField(formation, "title")}</h2>
        ${requestIdentityFields()}
        <input name="training" type="hidden" value="${formation.title}">
        <label>${tr("Niveau actuel")}<select name="level"><option>${tr("Debutant")}</option><option>${tr("Intermediaire")}</option><option>${tr("Avance")}</option><option>${tr("Entreprise / equipe")}</option></select></label>
        <label>${tr("Objectif")}<textarea name="message" rows="5" required placeholder="${tr("Expliquez votre besoin, votre ville, le nombre de personnes")}"></textarea></label>
        <button class="primary" type="submit">${tr("Envoyer la demande de formation")}</button>
      </form>
    </section>
  `, "/formation");
  document.querySelector("#formation-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const fd = Object.fromEntries(new FormData(event.target));
    await addTrainingRequest({ id: "FOR-" + Date.now().toString().slice(-6), ...fd, subject: `Formation: ${fd.training}`, status: "Nouveau", reply: "", seenAt: "", createdAt: today() });
    event.target.innerHTML = `<div class="success"><h2>${tr("Demande de formation envoyee")}</h2><button class="primary" data-link="/">${tr("Retour accueil")}</button></div>`;
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
  const pricing = discountedPrice(machine);
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
    await addOrder({ id: "CMD-" + Date.now().toString().slice(-6), machineId: machine.id, machine: machine.name, price: pricing.finalPrice, client, name: fd.name, firstname: fd.firstname, email: fd.email || "", phone: fd.phone, note: fd.message || "Demande creee depuis le site.", status: "Nouvelle", reply: "", seenAt: "", createdAt: today() });
    document.querySelector("#order-form").innerHTML = `<div class="success"><h2>Commande envoyee</h2><button type="button" class="primary" data-close-modal>Fermer</button></div>`;
    document.querySelector("[data-close-modal]").addEventListener("click", closeModal);
  });
}

export function adDetailPage(id) {
  const ad = (data.ads || []).find((row) => String(row.id) === String(id));
  if (!ad) return homePage();
  const phone = String(ad.whatsapp || "22870021225").replace(/\D/g, "");
  const message = encodeURIComponent(`Bonjour, je suis interesse par: ${ad.title || "Publicite DITONA"}`);
  publicShell(`
    <section class="ad-detail-hero">
      <div class="ad-detail-media">
        ${ad.type === "video" ? `<video src="${escapeHtml(ad.image)}" controls autoplay muted playsinline></video>` : `<img src="${escapeHtml(ad.image)}" alt="${escapeHtml(trField(ad, "title", "Publicite"))}">`}
      </div>
      <div class="ad-detail-content">
        <p class="eyebrow">${tr("Publicite")}</p>
        <h1>${escapeHtml(trField(ad, "title"))}</h1>
        ${ad.text ? `<p class="lead-dark">${escapeHtml(trField(ad, "text"))}</p>` : ""}
        ${ad.description ? `<p>${escapeHtml(trField(ad, "description"))}</p>` : ""}
        ${ad.location ? `<div class="ad-location"><strong>${tr("Localisation")}</strong><span>${escapeHtml(trField(ad, "location"))}</span></div>` : ""}
        <a class="primary ad-whatsapp" href="https://wa.me/${phone}?text=${message}" target="_blank" rel="noopener">${escapeHtml(trField(ad, "cta", "Commander"))}</a>
      </div>
    </section>
  `, "");
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
