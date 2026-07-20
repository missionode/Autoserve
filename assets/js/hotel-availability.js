(function initializeHotelAvailability(global) {
  "use strict";
  const session = global.AutoCodeApp.getSession();
  if (!session || !["admin", "staff"].includes(session.role)) return;
  const restaurantId = session.restaurantId || "rest_autoserve_demo";
  const list = document.querySelector("[data-inventory-list]");
  const filter = document.querySelector("[data-inventory-filter]");
  if (!list || !filter) return;
  if (!filter.querySelector('option[value="low"]')) filter.querySelector('option[value="unavailable"]')?.insertAdjacentHTML("beforebegin", '<option value="low">Low stock</option>');
  if (!filter.querySelector('option[value="cutoff"]')) filter.querySelector('option[value="reward"]')?.insertAdjacentHTML("beforebegin", '<option value="cutoff">Emergency cutoff</option>');
  document.querySelector('[data-route="inventory"] h1').nextElementSibling.textContent = "Set a sellable quantity for available items and record a reason when ordering is paused.";
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  const labels = { available: "Available", limited: "Limited availability", unavailable: "Temporarily unavailable", "sold-out": "Sold out for today" };
  const tones = { available: "bg-green-100 text-green-800", limited: "bg-amber-100 text-amber-900", unavailable: "bg-red-100 text-red-800", "sold-out": "bg-slate-200 text-slate-800" };
  const createId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const imageSource = (item) => { const image = item?.imagePath || item?.imageUrl || ""; return image ? (/^https?:\/\//i.test(image) ? image : `../${image.replace(/^\/+/, "")}`) : ""; };
  function hydrateFoodImages(container, items) {
    items.forEach((item, index) => {
      const source = imageSource(item);
      const icon = container.children[index]?.querySelector('span[aria-hidden="true"]');
      if (!source || !icon) return;
      const image = document.createElement("img");
      image.src = source; image.alt = item.name; image.loading = "lazy"; image.className = "size-16 shrink-0 rounded-xl object-cover";
      icon.replaceWith(image);
    });
  }
  function render() {
    const state = global.AutoCodeState.read();
    const restaurant = state.restaurants.find((item) => item.id === restaurantId);
    let items = state.menuItems.filter((item) => item.restaurantId === restaurantId && item.status !== "archived");
    const selected = filter.value;
    if (Object.hasOwn(labels, selected)) items = items.filter((item) => (item.availabilityStatus || "available") === selected);
    if (selected === "low") items = items.filter((item) => Math.max(0, Number(item.availableQuantity ?? item.stock ?? 0)) <= Number(item.lowStockThreshold || 0));
    if (selected === "cutoff") items = items.filter((item) => item.emergencyCutoff);
    if (selected === "reward") items = items.filter((item) => [restaurant?.primaryRewardItemId, restaurant?.fallbackRewardItemId].includes(item.id));
    if (selected === "recent") items = items.filter((item) => Date.now() - new Date(item.updatedAt || 0).getTime() < 86400000);
    document.querySelector("[data-inventory-empty]").hidden = items.length > 0;
    list.innerHTML = items.map((item) => {
      const value = item.emergencyCutoff ? "unavailable" : item.availabilityStatus || "available";
      const reward = [restaurant?.primaryRewardItemId, restaurant?.fallbackRewardItemId].includes(item.id);
      const quantity = Math.max(0, Number(item.availableQuantity ?? item.stock ?? 0));
      const detail = value === "limited" ? `Only ${quantity} left` : value === "available" ? `${quantity} ready to order` : item.availabilityNote || labels[value];
      const needsQuantity = ["available", "limited"].includes(value);
      return `<article class="app-card p-5"><div class="flex items-start justify-between gap-4"><div class="flex gap-3"><span class="text-3xl" aria-hidden="true">${escapeHtml(item.icon || "🍽️")}</span><div><h2 class="font-black text-slate-950">${escapeHtml(item.name)}</h2><p class="mt-1 text-xs font-bold text-slate-500">${escapeHtml(detail)}${reward ? " · Game reward" : ""}</p></div></div><span class="rounded-full px-2.5 py-1 text-xs font-extrabold ${tones[value]}">${labels[value]}</span></div><form data-availability-form="${escapeHtml(item.id)}" class="mt-5"><label class="block"><span class="text-sm font-extrabold text-slate-700">Availability status</span><select name="status" class="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3">${Object.entries(labels).map(([key, label]) => `<option value="${key}" ${value === key ? "selected" : ""}>${label}</option>`).join("")}</select></label><label data-availability-quantity-field ${needsQuantity ? "" : "hidden"} class="mt-4 block"><span class="text-sm font-extrabold text-slate-700">${value === "limited" ? "Quantity remaining" : "Quantity ready to sell"}</span><input name="quantity" type="number" min="1" step="1" value="${Math.max(1, quantity)}" class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"></label><label data-availability-note-field ${needsQuantity ? "hidden" : ""} class="mt-4 block"><span class="text-sm font-extrabold text-slate-700">Staff reason</span><input name="note" maxlength="120" value="${escapeHtml(item.availabilityNote || "")}" placeholder="Why can’t this item be ordered?" class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"></label><button class="mt-4 w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-extrabold text-white">Save availability</button></form><p class="mt-3 text-xs text-slate-500">Last updated ${new Date(item.updatedAt || Date.now()).toLocaleString("en-IN")}${item.lastUpdatedByName ? ` · ${escapeHtml(item.lastUpdatedByName)}` : ""}</p></article>`;
    }).join("");
    items.forEach((item, index) => {
      const form = list.children[index]?.querySelector("[data-availability-form]");
      if (!form) return;
      form.dataset.availabilityVersion = item.updatedAt || "";
      form.insertAdjacentHTML("beforebegin", `<p class="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">Physical stock: ${Math.max(0, Number(item.stock || 0))} · Sellable now: ${Math.max(0, Number(item.availableQuantity ?? item.stock ?? 0))}</p>`);
      form.insertAdjacentHTML("afterend", `<div class="mt-3 flex flex-wrap gap-2"><button data-adjust-stock="${escapeHtml(item.id)}" type="button" class="rounded-lg border border-blue-300 px-4 py-2 text-sm font-bold text-blue-700">Replenish or correct stock</button><button data-toggle-cutoff="${escapeHtml(item.id)}" type="button" class="rounded-lg border ${item.emergencyCutoff ? "border-green-400 text-green-800" : "border-red-300 text-red-700"} px-4 py-2 text-sm font-bold">${item.emergencyCutoff ? "Resolve emergency cutoff" : "Emergency cutoff"}</button></div>`);
      if (item.emergencyCutoff) {
        form.querySelectorAll("select, input, button").forEach((control) => { control.disabled = true; });
        form.insertAdjacentHTML("afterbegin", '<p class="mb-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-800">Resolve the emergency cutoff before changing normal availability.</p>');
      }
    });
    hydrateFoodImages(list, items);
  }
  list.addEventListener("change", (event) => {
    if (event.target.name !== "status") return;
    const form = event.target.closest("form");
    const needsQuantity = ["available", "limited"].includes(event.target.value);
    form.querySelector("[data-availability-quantity-field]").hidden = !needsQuantity;
    form.querySelector("[data-availability-note-field]").hidden = needsQuantity;
    form.querySelector("[data-availability-quantity-field] span").textContent = event.target.value === "limited" ? "Quantity remaining" : "Quantity ready to sell";
  });
  list.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-availability-form]");
    if (!form) return;
    event.preventDefault();
    const data = new FormData(form);
    const itemId = form.dataset.availabilityForm;
    const value = String(data.get("status"));
    const quantity = Number(data.get("quantity"));
    const note = String(data.get("note") || "").trim();
    if (!Object.hasOwn(labels, value)) return;
    if (["available", "limited"].includes(value) && (!Number.isInteger(quantity) || quantity < 1)) return global.alert("Enter a quantity of at least 1.");
    if (["unavailable", "sold-out"].includes(value) && !note) return global.alert("Enter a reason for this availability status.");
    try {
      global.AutoCodeState.update((state) => {
        const item = state.menuItems.find((entry) => entry.id === itemId && entry.restaurantId === restaurantId);
        if (!item) throw new Error("This menu item no longer exists.");
        if ((item.updatedAt || "") !== form.dataset.availabilityVersion) throw new Error(`Another tab changed ${item.name}. Review the latest availability and submit again.`);
        if (item.emergencyCutoff) throw new Error("Resolve the emergency cutoff before changing normal availability.");
        const previous = item.availabilityStatus || "available";
        const previousDetail = ["available", "limited"].includes(previous) ? `${labels[previous]} (${item.availableQuantity ?? item.stock ?? 0})` : `${labels[previous]}${item.availabilityNote ? `: ${item.availabilityNote}` : ""}`;
        item.availabilityStatus = value;
        item.availableQuantity = ["available", "limited"].includes(value) ? quantity : 0;
        if (["available", "limited"].includes(value)) item.stock = Math.max(Number(item.stock || 0), quantity);
        if (item.status === "sold-out") item.status = "published";
        item.availabilityNote = ["unavailable", "sold-out"].includes(value) ? note : "";
        item.updatedAt = new Date().toISOString();
        item.lastUpdatedBy = session.id;
        item.lastUpdatedByName = session.name;
        const nextDetail = ["available", "limited"].includes(value) ? `${labels[value]} (${quantity})` : `${labels[value]}: ${note}`;
        state.inventoryAudit.push({ id: createId("availability"), restaurantId, itemId: item.id, itemName: item.name, actorId: session.id, actorName: session.name, actorRole: session.role, changeType: "availability_change", previousQuantity: previousDetail, newQuantity: nextDetail, at: item.updatedAt, note: note || "Kitchen availability updated" });
      }, "hotel-item-availability-changed");
    } catch (error) {
      global.alert(error.message);
      render();
    }
  });
  filter.addEventListener("change", render);
  global.AutoCodeState.subscribe((state) => { if (state) render(); });
  render();
})(window);
