export function money(value) {
  if (!value) return "Sur devis";
  return new Intl.NumberFormat("fr-FR").format(Number(value)) + " FCFA";
}

export function discountedPrice(machine = {}) {
  const price = Number(machine.price) || 0;
  const discount = Math.max(0, Math.min(100, Number(machine.discountPercent) || 0));
  if (!price || !discount) return { price, discount: 0, finalPrice: price };
  return {
    price,
    discount,
    finalPrice: Math.round(price * (100 - discount) / 100),
  };
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
