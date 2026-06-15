export function money(value) {
  if (!value) return "Sur devis";
  return new Intl.NumberFormat("fr-FR").format(Number(value)) + " FCFA";
}

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function countNew(items, extra = []) {
  const statuses = ["nouveau", "nouvelle", "non lu", "en attente", ...extra];
  return items.filter((item) => !item.seenAt && statuses.includes(String(item.status || "").toLowerCase())).length;
}
