(function initializeHotelAvailability(global) {
  "use strict";
  const session = global.AutoCodeApp.getSession();
  if (!session || !["admin", "staff"].includes(session.role)) return;
  const restaurantId = session.restaurantId || "rest_autoserve_demo";
  const list = document.querySelector("[data-inventory-list]");
  const filter = document.querySelector("[data-inventory-filter]");
  if (!list || !filter) return;
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  const labels = { available: "Available", limited: "Limited availability", unavailable: "Temporarily unavailable", "sold-out": "Sold out for today" };
  const tones = { available: "bg-green-100 text-green-800", limited: "bg-amber-100 text-amber-900", unavailable: "bg-red-100 text-red-800", "sold-out": "bg-slate-200 text-slate-800" };
  const createId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  function render() {
    const state = global.AutoCodeState.read();
    const restaurant = state.restaurants.find((item) => item.id === restaurantId);
    let items = state.menuItems.filter((item) => item.restaurantId === restaurantId && item.status !== "archived");
    const selected = filter.value;
    if (Object.hasOwn(labels, selected)) items = items.filter((item) => (item.availabilityStatus || "available") === selected);
    if (selected === "cutoff") items = items.filter((item) => item.emergencyCutoff);
    if (selected === "reward") items = items.filter((item) => [restaurant?.primaryRewardItemId, restaurant?.fallbackRewardItemId].includes(item.id));
    if (selected === "recent") items = items.filter((item) => Date.now() - new Date(item.updatedAt || 0).getTime() < 86400000);
    document.querySelector("[data-inventory-empty]").hidden = items.length > 0;
    list.innerHTML = items.map((item) => {
      const value = item.emergencyCutoff ? "unavailable" : item.availabilityStatus || "available";
      const reward = [restaurant?.primaryRewardItemId, restaurant?.fallbackRewardItemId].includes(item.id);
      return `<article class="app-card p-5"><div class="flex items-start justify-between gap-4"><div class="flex gap-3"><span class="text-3xl" aria-hidden="true">${escapeHtml(item.icon || "🍽️")}</span><div><h2 class="font-black text-slate-950">${escapeHtml(item.name)}</h2><p class="mt-1 text-xs font-bold text-slate-500">Kitchen availability${reward ? " · Game reward" : ""}</p></div></div><span class="rounded-full px-2.5 py-1 text-xs font-extrabold ${tones[value]}">${labels[value]}</span></div><label class="mt-5 block"><span class="text-sm font-extrabold text-slate-700">Available to order</span><select data-availability-item="${escapeHtml(item.id)}" class="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3">${Object.entries(labels).map(([key, label]) => `<option value="${key}" ${value === key ? "selected" : ""}>${label}</option>`).join("")}</select></label><p class="mt-3 text-xs text-slate-500">Last updated ${new Date(item.updatedAt || Date.now()).toLocaleString("en-IN")}${item.lastUpdatedByName ? ` · ${escapeHtml(item.lastUpdatedByName)}` : ""}</p></article>`;
    }).join("");
  }
  list.addEventListener("change", (event) => {
    if (!event.target.matches("[data-availability-item]")) return;
    const itemId = event.target.dataset.availabilityItem;
    const value = event.target.value;
    if (!Object.hasOwn(labels, value)) return;
    global.AutoCodeState.update((state) => {
      const item = state.menuItems.find((entry) => entry.id === itemId && entry.restaurantId === restaurantId);
      if (!item) return;
      const previous = item.availabilityStatus || "available";
      item.availabilityStatus = value;
      item.emergencyCutoff = false;
      item.updatedAt = new Date().toISOString();
      item.lastUpdatedBy = session.id;
      item.lastUpdatedByName = session.name;
      state.inventoryAudit.push({ id: createId("availability"), restaurantId, itemId: item.id, itemName: item.name, actorId: session.id, actorName: session.name, actorRole: session.role, changeType: "availability_change", previousQuantity: labels[previous], newQuantity: labels[value], at: item.updatedAt, note: "Kitchen availability updated" });
    }, "hotel-item-availability-changed");
  });
  filter.addEventListener("change", render);
  global.AutoCodeState.subscribe((state) => { if (state) render(); });
  render();
})(window);
