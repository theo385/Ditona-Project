import { currentCustomer, data } from "./store.js";
import { discountedPrice, escapeHtml, money } from "./format.js";
import { currentLanguage, t, tr, trField, translateDom } from "./i18n.js";

let slideTimer = null;

export function clearTimers() {
  if (slideTimer) clearInterval(slideTimer);
  slideTimer = null;
}

export function setSlideTimer(timer) {
  slideTimer = timer;
}

export function logo(extra = "") {
  return `
    <div class="brand ${extra}">
      <span class="logo-shell"><img src="/ditona-logo.png" alt="DITONA Engineering"></span>
      <span class="brand-text">
        <strong>DITONA</strong>
        <small>Engineering</small>
      </span>
    </div>
  `;
}

export function navButton(label, path, active) {
  return `<button class="${active === path ? "active" : ""}" data-link="${path}">${label}</button>`;
}

export function mediaTag(item, alt = "DITONA") {
  if (item?.type === "video") return `<video src="${escapeHtml(item.image)}" autoplay muted loop playsinline></video>`;
  return `<img src="${escapeHtml(item?.image || "")}" alt="${escapeHtml(item?.title || alt)}">`;
}

export function visualTitle(key, eyebrow) {
  const item = data.sectionMedia[key];
  return `
    <section class="visual-title">
      ${mediaTag(item, tr(item.title))}
      <div><p class="eyebrow">${tr(eyebrow)}</p><h1>${escapeHtml(tr(item.title))}</h1><p>${escapeHtml(tr(item.subtitle))}</p></div>
    </section>
  `;
}

function languagePicker() {
  const lang = currentLanguage();
  return `
    <label class="language-select" title="Langue">
      ${lang === "zh" ? `<span class="flag-zh" aria-label="Chine"></span>` : `<span class="flag-${lang}"></span>`}
      <select data-lang>
        <option value="fr" ${lang === "fr" ? "selected" : ""}>Francais</option>
        <option value="en" ${lang === "en" ? "selected" : ""}>English</option>
        <option value="pt" ${lang === "pt" ? "selected" : ""}>Portugues</option>
        <option value="zh" ${lang === "zh" ? "selected" : ""}>中文</option>
      </select>
    </label>
  `;
}

export function publicShell(content, active = "") {
  clearTimers();
  const session = currentCustomer();
  const user = session?.user;
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "Client";
  const displayName = userName.split(" ")[0];

  document.querySelector("#app").innerHTML = `
    <header class="site-header">
      <div class="site-header-row1">
        <button class="hamburger-btn" id="hamburger-btn" aria-label="Menu"><span></span><span></span><span></span></button>
        <button class="nav-brand" data-link="/">${logo()}</button>
        <div class="header-spacer"></div>
        ${languagePicker()}
        ${user ? `
          <button class="header-action user-connected" data-link="/login" title="Mon compte">
            <span class="user-icon"></span>
            <small>${escapeHtml(displayName)}</small>
          </button>
        ` : `
          <button class="header-action login-action" data-link="/login" title="${t("action.login")}">
            <span class="user-icon"></span>
            <small>${t("action.login")}</small>
          </button>
        `}
      </div>
      <div class="site-header-row2">
        <nav class="site-nav" id="main-nav">
          ${navButton(t("nav.home"), "/", active)}
          ${navButton(t("nav.machines"), "/machines", active)}
          ${navButton(t("nav.realisations"), "/realisations", active)}
          ${navButton(t("nav.services"), "/services", active)}
          ${navButton(t("nav.training"), "/formation", active)}
          ${navButton(t("nav.about"), "/about", active)}
          ${navButton(t("nav.appointment"), "/rendez-vous", active)}
          ${navButton(t("nav.contact"), "/contact", active)}
        </nav>
        <div class="header-search">
          <input data-site-search placeholder="${t("search.placeholder")}">
          <button class="primary small" data-search-go>${t("action.search")}</button>
        </div>
      </div>
    </header>
    <div class="mobile-nav-overlay" id="mobile-nav-overlay">
      <div class="mobile-nav-panel" id="mobile-nav-panel">
        <button class="mobile-nav-close" id="mobile-nav-close">x</button>
        ${navButton(t("nav.home"), "/", active)}
        ${navButton(t("nav.machines"), "/machines", active)}
        ${navButton(t("nav.realisations"), "/realisations", active)}
        ${navButton(t("nav.services"), "/services", active)}
        ${navButton(t("nav.training"), "/formation", active)}
        ${navButton(t("nav.about"), "/about", active)}
        ${navButton(t("nav.appointment"), "/rendez-vous", active)}
        ${navButton(t("nav.contact"), "/contact", active)}
        <div class="mobile-nav-spacer"></div>
        ${user ? `<button class="mobile-login-link" data-link="/login">${escapeHtml(displayName)}</button>` : `<button class="mobile-login-link" data-link="/login">${t("action.login")}</button>`}
      </div>
    </div>
    <main>${content}</main>
    ${siteAds()}
    ${chatWidget()}
    <footer class="site-footer">
      <div class="footer-about">${logo("footer-brand")}<p>${t("footer.about")}</p></div>
      <div class="footer-columns">
        <div>
          <h3>${t("footer.support")}</h3>
          <button data-link="/login">${t("action.login")}</button>
          <button data-link="/contact">${t("footer.help")}</button>
          <button data-link="/contact">${t("nav.contact")}</button>
          <button data-link="/machines">${t("footer.purchase")}</button>
        </div>
        <div>
          <h3>${t("footer.company")}</h3>
          <button data-link="/about">${t("footer.aboutUs")}</button>
          <button data-link="/realisations">${t("footer.press")}</button>
          <button data-link="/formation">${t("footer.jobs")}</button>
        </div>
        <div>
          <h3>${t("footer.legal")}</h3>
          <button data-link="/about">${t("footer.legal")}</button>
          <button data-link="/services">${t("footer.terms")}</button>
          <button data-link="/machines">${t("footer.market")}</button>
          <button data-link="/contact">${t("footer.privacy")}</button>
        </div>
      </div>
    </footer>
    <div class="footer-contact-bar">
      <a href="mailto:ditonatg@gmail.com">ditonatg@gmail.com</a>
      <a href="https://wa.me/22870021225" target="_blank" rel="noopener">WhatsApp +228 70 02 12 25</a>
      <span>Vakpossito Lome Togo</span>
    </div>
  `;

  setTimeout(() => {
    const hamburger = document.querySelector("#hamburger-btn");
    const overlay = document.querySelector("#mobile-nav-overlay");
    const closeBtn = document.querySelector("#mobile-nav-close");
    const openMenu = () => { overlay?.classList.add("open"); document.body.style.overflow = "hidden"; };
    const closeMenu = () => { overlay?.classList.remove("open"); document.body.style.overflow = ""; };
    hamburger?.addEventListener("click", openMenu);
    closeBtn?.addEventListener("click", closeMenu);
    overlay?.addEventListener("click", (event) => { if (event.target === overlay) closeMenu(); });
    overlay?.querySelectorAll("button[data-link]").forEach((button) => button.addEventListener("click", closeMenu));
  }, 0);
  translateDom(document.querySelector("#app"));
}

function siteAds() {
  const ads = (data.ads || []).filter((ad) => ad.active !== false && ad.image);
  if (!ads.length) return "";
  return `
    <aside class="floating-ads" data-floating-ads data-visible-ms="${Number(data.adsSettings?.visibleMs) || 22000}" data-hidden-ms="${Number(data.adsSettings?.hiddenMs) || 18000}">
      ${ads.slice(0, 4).map((ad, index) => `
        <article class="floating-ad ${index === 0 ? "active" : ""}" data-floating-ad="${index}" data-display-ms="${Number(ad.displayMs) || 7000}">
          <button type="button" data-close-ad aria-label="Fermer">x</button>
          ${ad.type === "video" ? `<video src="${escapeHtml(ad.image)}" autoplay muted loop playsinline></video>` : `<img src="${escapeHtml(ad.image)}" alt="${escapeHtml(trField(ad, "title", "Publicite"))}">`}
          <div>
            <strong>${escapeHtml(trField(ad, "title"))}</strong>
            ${ad.text ? `<p>${escapeHtml(trField(ad, "text"))}</p>` : ""}
            <button class="primary small" data-link="/publicite/${escapeHtml(ad.id)}">${escapeHtml(trField(ad, "cta", "Voir"))}</button>
          </div>
        </article>
      `).join("")}
      <div class="floating-ad-controls">
        <button type="button" data-ad-prev aria-label="Publicite precedente">‹</button>
        <div class="floating-ad-dots">${ads.slice(0, 4).map((_, index) => `<button type="button" class="${index === 0 ? "active" : ""}" data-ad-dot="${index}" aria-label="Publicite ${index + 1}"></button>`).join("")}</div>
        <button type="button" data-ad-next aria-label="Publicite suivante">›</button>
      </div>
    </aside>
  `;
}

function customerIdentity() {
  const session = currentCustomer();
  const user = session?.user;
  if (!user) return null;
  const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email || "Client connecte";
  return { name, firstname: "", email: user.email || "", phone: "" };
}

export function requestIdentityFields() {
  const customer = customerIdentity();
  if (!customer) {
    return `
      <label>Nom<input name="name" required></label>
      <label>Prenom<input name="firstname"></label>
      <label>Numero WhatsApp<input name="phone" required placeholder="+228 ..."></label>
      <label>Email<input name="email" type="email" required placeholder="votre@email.com"></label>
    `;
  }
  return `
    <input name="name" type="hidden" value="${escapeHtml(customer.name)}">
    <input name="firstname" type="hidden" value="${escapeHtml(customer.firstname)}">
    <input name="email" type="hidden" value="${escapeHtml(customer.email)}">
    <input name="phone" type="hidden" value="${escapeHtml(customer.phone)}">
  `;
}

export function chatWidget() {
  return `
    <button class="chat-button" data-chat-open>${t("chat.button")}</button>
    <section class="chat-widget" hidden>
      <div class="chat-head"><strong>${t("chat.title")}</strong><button data-chat-close aria-label="Fermer">x</button></div>
      <div class="chat-log" data-chat-log><p class="bot">${t("chat.hello")}</p></div>
      <form class="chat-form" data-chat-form>
        <input name="text" required placeholder="${t("chat.input")}">
        <button class="primary small">${t("chat.send")}</button>
      </form>
    </section>
  `;
}

export function machineMini(machine) {
  return `
    <article class="machine-mini">
      <img src="${machine.image}" alt="${escapeHtml(trField(machine, "name"))}">
      <div><strong>${escapeHtml(trField(machine, "name"))}</strong><span>${escapeHtml(trField(machine, "comment"))}</span></div>
    </article>
  `;
}

export function machineCard(machine) {
  const pricing = discountedPrice(machine);
  return `
    <article class="item-card">
      <img src="${machine.image}" alt="${escapeHtml(trField(machine, "name"))}">
      <div class="item-body">
        <span class="pill">${escapeHtml(trField(machine, "category"))}</span>
        <h3>${escapeHtml(trField(machine, "name"))}</h3>
        <p>${escapeHtml(trField(machine, "description"))}</p>
        <p class="comment">${escapeHtml(trField(machine, "comment"))}</p>
        <div class="item-foot">
          <div class="price-stack">
            ${pricing.discount ? `<span class="discount-badge">-${pricing.discount}%</span><del>${money(pricing.price)}</del>` : ""}
            <strong>${money(pricing.finalPrice)}</strong>
          </div>
          <button class="primary small" data-order="${machine.id}">${t("action.order")}</button>
        </div>
      </div>
    </article>
  `;
}

export function orderForm(machine) {
  return `
    <section class="modal-backdrop" data-modal>
      <form id="order-form" class="panel form-panel order-modal">
        <div class="modal-head">
          <div><p class="eyebrow">Commande</p><h2>${escapeHtml(tr(machine.name))}</h2></div>
          <button type="button" class="ghost small" data-close-modal>Fermer</button>
        </div>
        ${requestIdentityFields()}
        <label>Precision sur le besoin<textarea name="message" rows="4" required placeholder="Quantite, ville, delai, details techniques"></textarea></label>
        <button class="primary" type="submit">Envoyer la commande</button>
      </form>
    </section>
  `;
}

export function realisationCard(item) {
  return `
    <article class="item-card click-card" data-link="/realisations/${item.id}">
      <img src="${item.image}" alt="${escapeHtml(trField(item, "title"))}">
      <div class="item-body">
        <h3>${escapeHtml(trField(item, "title"))}</h3>
        <p>${escapeHtml(trField(item, item.comment ? "comment" : "description"))}</p>
        <div class="item-foot">
          <span class="pill">${t("realisations.steps")}</span>
          <button class="ghost small" data-link="/realisations/${item.id}">${t("realisations.viewDetails")}</button>
        </div>
      </div>
    </article>
  `;
}

export function serviceCard(service) {
  return `
    <article class="service-card click-card" data-link="/services/${service.id}">
      <img src="${service.image}" alt="${escapeHtml(trField(service, "title"))}">
      <div>
        <h3>${escapeHtml(trField(service, "title"))}</h3>
        <p>${escapeHtml(trField(service, service.text ? "text" : "solution"))}</p>
        <button class="primary small" data-link="/services/${service.id}">${t("realisations.viewDetails")}</button>
      </div>
    </article>
  `;
}

export function adminItem(item, type) {
  const preview = item.type === "video"
    ? `<video src="${escapeHtml(item.image || "")}" muted loop playsinline></video>`
    : `<img src="${escapeHtml(item.image || "")}" alt="${escapeHtml(item.name || item.title || "")}">`;
  return `
    <article class="admin-row">
      ${preview}
      <div><h3>${escapeHtml(item.name || item.title || "")}</h3><p>${escapeHtml(item.category || item.cta || item.status || "")} ${money(item.price)}${item.discountPercent ? ` (-${escapeHtml(item.discountPercent)}%)` : ""}</p><p>${escapeHtml(item.comment || item.subtitle || item.description || item.text || "")}</p></div>
      <button class="ghost small" data-edit-${type}="${item.id}">Modifier</button>
      <button class="danger small" data-delete-${type}="${item.id}">Supprimer</button>
    </article>
  `;
}

export function requestCard(item, type) {
  const title = item.subject || item.machine || "Demande";
  const id = item.id;
  const reply = item.reply || "";
  return `
    <article class="panel request-card">
      <div class="request-top"><h3>${escapeHtml(title)}</h3><span class="status-pill">${escapeHtml(item.status || "Nouveau")}</span></div>
      <p><strong>${escapeHtml(item.name || item.client || "Client web")}</strong> | ${escapeHtml(item.email || "")} | ${escapeHtml(item.phone || "")}</p>
      <p>${escapeHtml(item.message || item.note || "")}</p>
      ${item.autoReply ? `<p class="auto-reply"><strong>Reponse automatique:</strong> ${escapeHtml(item.autoReply)}</p>` : ""}
      <label>Statut<input data-${type}-status="${id}" value="${escapeHtml(item.status || "Nouveau")}"></label>
      <label>Reponse admin<textarea data-${type}-reply="${id}" rows="4">${escapeHtml(reply)}</textarea></label>
      <button class="primary small" data-save-${type}="${id}">Enregistrer la reponse</button>
    </article>
  `;
}

export function requestConversation(items = [], type) {
  if (!items.length) return `<p class="empty">Aucune demande.</p>`;
  const active = items[0];
  const rows = requestRows(items, type);
  return `<section class="message-desk request-desk"><aside class="message-list">${rows}</aside><article class="message-thread" data-request-thread>${requestThread(active, type)}</article></section>`;
}

function requestRows(items, type) {
  return items.map((item, index) => {
    const title = item.subject || item.machine || item.training || item.reference || "Demande";
    const client = item.client || `${item.name || ""} ${item.firstname || ""}`.trim() || "Client web";
    const contact = [item.phone, item.email].filter(Boolean).join(" | ");
    return `
      <button class="message-user ${index === 0 ? "active" : ""}" data-request-select="${type}:${item.id}">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(client)}</span>
        <small>${escapeHtml(contact)}</small>
      </button>
    `;
  }).join("");
}

export function requestThread(item, type) {
  if (!item) return `<p class="empty">Selectionnez une demande.</p>`;
  const id = item.id;
  const title = item.subject || item.machine || item.training || item.reference || "Demande";
  const client = item.client || `${item.name || ""} ${item.firstname || ""}`.trim() || "Client web";
  const contact = [item.phone, item.email].filter(Boolean).join(" | ");
  const details = [
    item.machine ? `Commande: ${item.machine}` : "",
    item.price ? `Montant: ${money(item.price)}` : "",
    item.date ? `Date souhaitee: ${item.date}` : "",
    item.level ? `Niveau: ${item.level}` : "",
    item.training ? `Formation: ${item.training}` : "",
    item.purchasedFromDitona ? `Machine de DITONA: ${item.purchasedFromDitona}` : "",
    item.reference ? `Reference: ${item.reference}` : "",
    item.photoName ? `Photo: ${item.photoName}` : "",
  ].filter(Boolean);
  const reply = item.reply || "";
  return `
    <div class="thread-head">
      <div><h2>${escapeHtml(title)}</h2><p><strong>${escapeHtml(client)}</strong>${contact ? ` | ${escapeHtml(contact)}` : ""}</p></div>
      <small>${escapeHtml(item.createdAt || "")}</small>
    </div>
    <div class="thread-chat">
      ${details.length ? `<div class="request-meta">${details.map((detail) => `<span>${escapeHtml(detail)}</span>`).join("")}</div>` : ""}
      ${item.photoUrl ? `<p><a class="ghost small" href="${escapeHtml(item.photoUrl)}" target="_blank" rel="noopener">Voir la photo machine</a></p>` : ""}
      <p class="bubble client">${escapeHtml(item.message || item.note || item.behavior || "Demande creee depuis le site.")}</p>
      ${reply ? `<p class="bubble admin">${escapeHtml(reply)}</p>` : ""}
    </div>
    <label class="reply-box">Reponse admin<textarea data-${type}-reply="${id}" rows="5" placeholder="Ecrire la reponse...">${escapeHtml(reply)}</textarea></label>
    <div class="thread-actions">
      <button class="primary" data-save-${type}="${id}">Envoyer / enregistrer</button>
      <button class="danger" data-delete-request="${id}" data-delete-request-type="${type}">Supprimer</button>
    </div>
  `;
}

export function requestConversationSimple(items = [], type) {
  if (!items.length) return `<p class="empty">Aucune demande.</p>`;
  const active = items[0];
  return `<section class="message-desk request-desk"><aside class="message-list">${requestRows(items, type)}</aside><article class="message-thread" data-request-thread>${requestThreadSimple(active, type)}</article></section>`;
}

export function requestThreadSimple(item, type) {
  if (!item) return `<p class="empty">Selectionnez une demande.</p>`;
  const title = item.subject || item.machine || item.training || item.reference || "Demande";
  const client = item.client || `${item.name || ""} ${item.firstname || ""}`.trim() || "Client web";
  const contact = [item.phone, item.email].filter(Boolean).join(" | ");
  const details = [
    item.machine ? `Commande: ${item.machine}` : "",
    item.price ? `Montant: ${money(item.price)}` : "",
    item.date ? `Date souhaitee: ${item.date}` : "",
    item.level ? `Niveau: ${item.level}` : "",
    item.training ? `Formation: ${item.training}` : "",
    item.purchasedFromDitona ? `Machine de DITONA: ${item.purchasedFromDitona}` : "",
    item.reference ? `Reference: ${item.reference}` : "",
    item.photoName ? `Photo: ${item.photoName}` : "",
  ].filter(Boolean);
  return `
    <div class="thread-head">
      <div><h2>${escapeHtml(title)}</h2><p><strong>${escapeHtml(client)}</strong>${contact ? ` | ${escapeHtml(contact)}` : ""}</p></div>
      <small>${escapeHtml(item.createdAt || "")}</small>
    </div>
    <div class="thread-chat">
      ${details.length ? `<div class="request-meta">${details.map((detail) => `<span>${escapeHtml(detail)}</span>`).join("")}</div>` : ""}
      ${item.photoUrl ? `<p><a class="ghost small" href="${escapeHtml(item.photoUrl)}" target="_blank" rel="noopener">Voir la photo machine</a></p>` : ""}
      <p class="bubble client">${escapeHtml(item.message || item.note || item.behavior || "Demande creee depuis le site.")}</p>
    </div>
    <div class="thread-actions">
      ${item.email ? `<a class="primary" href="mailto:${escapeHtml(item.email)}">Contacter par email</a>` : ""}
      ${item.phone ? `<a class="ghost" href="https://wa.me/${escapeHtml(String(item.phone).replace(/\D/g, ""))}" target="_blank" rel="noopener">Contacter WhatsApp</a>` : ""}
      <button class="danger" data-delete-request="${escapeHtml(item.id)}" data-delete-request-type="${type}">Supprimer</button>
    </div>
  `;
}

export function messageConversation(messages = []) {
  if (!messages.length) return `<p class="empty">Aucun message.</p>`;
  const active = messages[0];
  const rows = messages.map((item, index) => `
    <button class="message-user ${index === 0 ? "active" : ""}" data-message-select="${item.id}">
      <strong>${escapeHtml(item.name || item.client || "Visiteur")}</strong>
      <span>${escapeHtml(item.subject || "Message")}</span>
    </button>
  `).join("");
  return `<section class="message-desk"><aside class="message-list">${rows}</aside><article class="message-thread" data-message-thread>${messageThread(active)}</article></section>`;
}

export function messageThread(item) {
  if (!item) return `<p class="empty">Selectionnez un message.</p>`;
  return `
    <div class="thread-head">
      <div><h2>${escapeHtml(item.name || item.client || "Visiteur")}</h2><p>${escapeHtml([item.email, item.phone].filter(Boolean).join(" | ") || "Client web")}</p></div>
      <small>${escapeHtml(item.createdAt || "")}</small>
    </div>
    <div class="thread-chat">
      <p class="bubble client">${escapeHtml(item.message || item.note || item.subject || "")}</p>
      ${item.autoReply ? `<p class="bubble bot">${escapeHtml(item.autoReply)}</p>` : ""}
    </div>
    <div class="thread-actions">
      ${item.email ? `<a class="primary" href="mailto:${escapeHtml(item.email)}">Contacter par email</a>` : ""}
      ${item.phone ? `<a class="ghost" href="https://wa.me/${escapeHtml(String(item.phone).replace(/\D/g, ""))}" target="_blank" rel="noopener">Contacter WhatsApp</a>` : ""}
      <button class="danger" data-delete-request="${escapeHtml(item.id)}" data-delete-request-type="message">Supprimer</button>
    </div>
  `;
}

export function dashboardActivity() {
  const rows = [
    ...data.messages.map((item) => ({ type: "Message", title: item.subject || "Chatbot", name: item.name || "Visiteur", status: item.status })),
    ...data.appointments.map((item) => ({ type: "Rendez-vous", title: item.subject || item.date || "Demande", name: item.name, status: item.status })),
    ...data.orders.map((item) => ({ type: "Achat", title: item.machine, name: item.client, status: item.status })),
    ...(data.trainingRequests || []).map((item) => ({ type: "Formation", title: item.subject || item.training, name: item.name, status: item.status })),
    ...(data.maintenanceRequests || []).map((item) => ({ type: "Maintenance", title: item.subject || item.reference || "Maintenance", name: item.name, status: item.status })),
  ].slice(0, 8);
  if (!rows.length) return `<p class="empty">Aucune activite recente pour le moment.</p>`;
  return rows.map((row) => `
    <article class="activity-row">
      <span>${row.type}</span>
      <strong>${escapeHtml(row.title || "")}</strong>
      <em>${escapeHtml(row.name || "Client web")}</em>
      <small>${escapeHtml(row.status || "Nouveau")}</small>
    </article>
  `).join("");
}
