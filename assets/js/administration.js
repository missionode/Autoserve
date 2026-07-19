(function initializeAdministration(global) {
  "use strict";

  const session = global.AutoCodeApp.getSession();
  if (!session || !["admin", "staff"].includes(session.role)) return;

  const restaurantId = session.restaurantId || "rest_autoserve_demo";
  const inventoryDialog = document.querySelector("#inventory-dialog");
  const inventoryForm = document.querySelector("[data-inventory-form]");
  const menuDialog = document.querySelector("#menu-item-dialog");
  const menuForm = document.querySelector("[data-menu-item-form]");
  const formatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
  let inventoryFilter = "all";
  let selectedInventory = null;
  let selectedMenuId = null;
  let selectedMenuVersion = null;
  let menuSearch = "";
  let menuFilter = "all";

  if (!inventoryDialog || !inventoryForm) return;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  const idPart = (value) => String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 32) || "option";
  const createId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = () => new Date().toISOString();
  const imageSource = (item) => { const image = item?.imagePath || item?.imageUrl || ""; return image ? (/^https?:\/\//i.test(image) ? image : `../${image.replace(/^\/+/, "")}`) : ""; };
  function hydrateFoodImages(container, items) {
    items.forEach((item, index) => {
      const source = imageSource(item);
      const icon = container.children[index]?.querySelector(".text-3xl");
      if (!source || !icon) return;
      const image = document.createElement("img");
      image.src = source; image.alt = item.name; image.loading = "lazy"; image.className = "size-16 shrink-0 rounded-xl object-cover";
      icon.replaceWith(image);
    });
  }
  const itemsFor = (state) => state.menuItems.filter((item) => item.restaurantId === restaurantId);
  const categoriesFor = (state) => state.categories.filter((category) => category.restaurantId === restaurantId).sort((a, b) => a.order - b.order);
  const categoryName = (state, id) => state.categories.find((category) => category.id === id)?.name || "Unassigned";
  const isReward = (state, item) => {
    const restaurant = state.restaurants.find((entry) => entry.id === restaurantId);
    return item.id === restaurant?.primaryRewardItemId || item.id === restaurant?.fallbackRewardItemId;
  };

  function feedback(element, message, error) {
    element.hidden = false;
    element.textContent = message;
    element.className = `mt-5 rounded-xl px-4 py-3 text-sm font-bold ${error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`;
  }

  function audit(state, item, type, before, after, note) {
    state.inventoryAudit.push({
      id: createId("audit"), restaurantId, itemId: item.id, itemName: item.name,
      actorId: session.id, actorName: session.name, actorRole: session.role,
      changeType: type, previousQuantity: before, newQuantity: after, at: now(), note: note || ""
    });
  }

  function availability(item) {
    if (item.status === "archived") return { label: "Archived", tone: "slate" };
    if (item.status === "hidden" || item.status === "draft") return { label: item.status === "draft" ? "Draft" : "Hidden", tone: "slate" };
    if (item.emergencyCutoff) return { label: "Emergency cutoff", tone: "red" };
    if (item.stock === 0 || item.status === "sold-out") return { label: "Sold out", tone: "red" };
    if (item.stock <= item.lowStockThreshold) return { label: "Low stock", tone: "amber" };
    return { label: "Available", tone: "green" };
  }

  function renderInventory() {
    const state = global.AutoCodeState.read();
    let items = itemsFor(state);
    const recentBoundary = Date.now() - 24 * 60 * 60 * 1000;
    items = items.filter((item) => {
      if (inventoryFilter === "low") return item.stock <= item.lowStockThreshold;
      if (inventoryFilter === "sold-out") return item.stock === 0 || item.status === "sold-out";
      if (inventoryFilter === "cutoff") return item.emergencyCutoff;
      if (inventoryFilter === "reward") return isReward(state, item);
      if (inventoryFilter === "recent") return new Date(item.updatedAt || 0).getTime() >= recentBoundary;
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));

    const list = document.querySelector("[data-inventory-list]");
    document.querySelector("[data-inventory-empty]").hidden = items.length > 0;
    list.innerHTML = items.map((item) => {
      const status = availability(item);
      const reward = isReward(state, item);
      const rewardLabel = item.id === state.restaurants.find((entry) => entry.id === restaurantId)?.primaryRewardItemId ? "Primary reward" : "Fallback reward";
      return `<article class="app-card p-5"><div class="flex items-start justify-between gap-4"><div class="flex gap-3"><span class="text-3xl" aria-hidden="true">${escapeHtml(item.icon || "🍽️")}</span><div><h2 class="font-black text-slate-950">${escapeHtml(item.name)}</h2><p class="mt-1 text-xs font-bold text-slate-500">${escapeHtml(categoryName(state, item.categoryId))}</p></div></div><span class="rounded-full px-2.5 py-1 text-xs font-extrabold ${status.tone === "red" ? "bg-red-100 text-red-800" : status.tone === "amber" ? "bg-amber-100 text-amber-900" : status.tone === "green" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-700"}">${status.label}</span></div><div class="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm"><div><p class="text-xs font-bold text-slate-500">Current stock</p><p class="mt-1 text-2xl font-black text-slate-950">${item.stock}</p></div><div><p class="text-xs font-bold text-slate-500">Low at</p><p class="mt-1 font-black text-slate-800">${item.lowStockThreshold}</p></div><div class="col-span-2"><p class="text-xs font-bold text-slate-500">Last update</p><p class="mt-1 text-xs font-semibold text-slate-700">${new Date(item.updatedAt).toLocaleString("en-IN")}${item.lastUpdatedByName ? ` · ${escapeHtml(item.lastUpdatedByName)}` : ""}</p></div></div>${reward ? `<p class="mt-3 rounded-lg bg-purple-50 px-3 py-2 text-xs font-extrabold text-purple-800">🎁 ${rewardLabel}</p>` : ""}<div class="mt-4 flex flex-wrap gap-2"><button data-adjust-stock="${escapeHtml(item.id)}" class="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white">Adjust stock</button><button data-toggle-cutoff="${escapeHtml(item.id)}" class="rounded-lg border ${item.emergencyCutoff ? "border-green-400 text-green-800" : "border-red-300 text-red-700"} px-4 py-2 text-sm font-bold">${item.emergencyCutoff ? "Remove cutoff" : "Emergency cutoff"}</button></div></article>`;
    }).join("");
    hydrateFoodImages(list, items);
    renderAudit(state);
  }

  function renderAudit(state) {
    const target = document.querySelector("[data-inventory-audit]");
    if (!target || session.role !== "admin") return;
    const records = state.inventoryAudit.filter((entry) => entry.restaurantId === restaurantId).sort((a, b) => new Date(b.at) - new Date(a.at));
    if (!records.length) {
      target.innerHTML = '<p class="rounded-xl bg-slate-100 p-5 text-sm font-bold text-slate-600">No inventory changes recorded yet.</p>';
      return;
    }
    target.innerHTML = `<table class="w-full min-w-[680px] text-left text-sm"><thead><tr class="border-b border-slate-200 text-xs uppercase text-slate-500"><th class="p-3">When</th><th class="p-3">Item</th><th class="p-3">Change</th><th class="p-3">Quantity</th><th class="p-3">Actor</th><th class="p-3">Reason</th></tr></thead><tbody>${records.map((entry) => `<tr class="border-b border-slate-100"><td class="p-3">${new Date(entry.at).toLocaleString("en-IN")}</td><td class="p-3 font-bold">${escapeHtml(entry.itemName)}</td><td class="p-3 capitalize">${escapeHtml(entry.changeType.replaceAll("_", " "))}</td><td class="p-3">${entry.previousQuantity} → ${entry.newQuantity}</td><td class="p-3">${escapeHtml(entry.actorName)} <span class="text-xs text-slate-500">(${escapeHtml(entry.actorRole)})</span></td><td class="p-3">${escapeHtml(entry.note || "—")}</td></tr>`).join("")}</tbody></table>`;
  }

  function openInventory(itemId) {
    const item = itemsFor(global.AutoCodeState.read()).find((entry) => entry.id === itemId);
    if (!item) return;
    selectedInventory = { id: item.id, stock: item.stock, updatedAt: item.updatedAt };
    inventoryForm.reset();
    inventoryForm.elements.quantity.value = "1";
    document.querySelector("[data-inventory-item-name]").textContent = item.name;
    document.querySelector("[data-inventory-current]").textContent = `${item.stock} units currently recorded · low-stock threshold ${item.lowStockThreshold}`;
    document.querySelector("[data-inventory-feedback]").hidden = true;
    global.AutoCodeApp.openDialog(inventoryDialog);
  }

  function saveInventory() {
    const result = document.querySelector("[data-inventory-feedback]");
    const mode = inventoryForm.elements.mode.value;
    const quantity = Number(inventoryForm.elements.quantity.value);
    const reason = inventoryForm.elements.reason.value.trim();
    if (!Number.isInteger(quantity) || quantity < 0 || (mode !== "exact" && quantity === 0)) {
      feedback(result, "Enter a whole-number quantity greater than zero, or zero for an exact stock count.", true);
      return;
    }
    try {
      global.AutoCodeState.update((state) => {
        const item = itemsFor(state).find((entry) => entry.id === selectedInventory?.id);
        if (!item) throw new Error("This inventory item no longer exists.");
        if (item.stock !== selectedInventory.stock || item.updatedAt !== selectedInventory.updatedAt) {
          selectedInventory = { id: item.id, stock: item.stock, updatedAt: item.updatedAt };
          document.querySelector("[data-inventory-current]").textContent = `${item.stock} units now recorded. Review this newer value and submit again.`;
          throw new Error(`Another tab changed ${item.name} to ${item.stock}. Review the latest value and resubmit.`);
        }
        const previous = item.stock;
        const next = mode === "increase" ? previous + quantity : mode === "decrease" ? previous - quantity : quantity;
        if (next < 0) throw new Error(`Stock cannot fall below zero. ${item.name} currently has ${previous}.`);
        item.stock = next;
        if (next === 0 && item.status === "published") item.status = "sold-out";
        if (next > 0 && item.status === "sold-out") item.status = "published";
        item.updatedAt = now();
        item.lastUpdatedBy = session.id;
        item.lastUpdatedByName = session.name;
        audit(state, item, mode === "increase" ? "replenishment" : mode === "decrease" ? "correction" : "exact_count", previous, next, reason);
      }, "inventory-adjusted");
      global.AutoCodeApp.closeDialog(inventoryDialog, "saved");
      selectedInventory = null;
      renderInventory();
    } catch (error) { feedback(result, error.message, true); }
  }

  function toggleCutoff(itemId) {
    const state = global.AutoCodeState.read();
    const current = itemsFor(state).find((item) => item.id === itemId);
    if (!current) return;
    const reason = current.emergencyCutoff ? "Emergency resolved" : global.prompt(`Reason for stopping sales of ${current.name}:`, "Equipment or ingredient issue");
    if (!current.emergencyCutoff && !String(reason || "").trim()) return;
    global.AutoCodeState.update((nextState) => {
      const item = itemsFor(nextState).find((entry) => entry.id === itemId);
      const enabling = !item.emergencyCutoff;
      item.emergencyCutoff = enabling;
      item.emergencyCutoffReason = enabling ? String(reason).trim() : "";
      item.emergencyCutoffAt = enabling ? now() : null;
      item.emergencyCutoffBy = enabling ? session.id : null;
      item.updatedAt = now();
      item.lastUpdatedBy = session.id;
      item.lastUpdatedByName = session.name;
      audit(nextState, item, enabling ? "emergency_cutoff_on" : "emergency_cutoff_off", item.stock, item.stock, reason);
    }, "inventory-cutoff-changed");
    renderInventory();
  }

  function parsePricedOptions(value, label, priceKey) {
    const seen = new Set();
    return String(value || "").split(",").map((part) => part.trim()).filter(Boolean).map((part, index) => {
      const separator = part.lastIndexOf(":");
      const name = (separator < 0 ? part : part.slice(0, separator)).trim();
      const price = separator < 0 ? 0 : Number(part.slice(separator + 1).trim());
      const key = name.toLowerCase();
      if (!name) throw new Error(`${label} names cannot be blank.`);
      if (seen.has(key)) throw new Error(`${label} names must be unique.`);
      if (!Number.isFinite(price) || price < 0) throw new Error(`${label} prices cannot be negative.`);
      seen.add(key);
      return { id: `${idPart(name)}_${index + 1}`, name, [priceKey]: price };
    });
  }

  function parseNames(value, label) {
    const names = String(value || "").split(",").map((name) => name.trim()).filter(Boolean);
    if (new Set(names.map((name) => name.toLowerCase())).size !== names.length) throw new Error(`${label} names must be unique.`);
    return names;
  }

  function fillCategorySelect(selected) {
    const categories = categoriesFor(global.AutoCodeState.read()).filter((category) => category.status !== "archived");
    menuForm.elements.categoryId.innerHTML = categories.map((category) => `<option value="${escapeHtml(category.id)}" ${category.id === selected ? "selected" : ""}>${escapeHtml(category.name)}</option>`).join("");
  }

  function openMenu(itemId, duplicate) {
    if (session.role !== "admin" || !menuDialog || !menuForm) return;
    const source = itemsFor(global.AutoCodeState.read()).find((item) => item.id === itemId);
    selectedMenuId = duplicate ? null : source?.id || null;
    selectedMenuVersion = duplicate || !source ? null : { stock: source.stock, updatedAt: source.updatedAt };
    menuForm.reset();
    fillCategorySelect(source?.categoryId);
    document.querySelector("[data-menu-editor-title]").textContent = duplicate ? `Duplicate ${source.name}` : source ? `Edit ${source.name}` : "Create item";
    document.querySelector("[data-menu-item-feedback]").hidden = true;
    if (source) {
      menuForm.elements.name.value = duplicate ? `${source.name} copy` : source.name;
      menuForm.elements.description.value = source.description;
      menuForm.elements.categoryId.value = source.categoryId;
      menuForm.elements.dietary.value = source.dietary;
      menuForm.elements.price.value = source.price;
      menuForm.elements.preparationMinutes.value = source.preparationMinutes;
      menuForm.elements.stock.value = source.stock;
      menuForm.elements.lowStockThreshold.value = source.lowStockThreshold;
      menuForm.elements.icon.value = source.icon || "";
      menuForm.elements.imageUrl.value = source.imagePath || source.imageUrl || "";
      menuForm.elements.sizes.value = (source.sizes || []).map((entry) => `${entry.name}:${entry.priceAdjustment}`).join(", ");
      menuForm.elements.spiceLevels.value = (source.spiceLevels || []).join(", ");
      menuForm.elements.addOns.value = (source.addOns || []).map((entry) => `${entry.name}:${entry.price}`).join(", ");
      menuForm.elements.status.value = duplicate ? "draft" : source.status;
    } else {
      menuForm.elements.preparationMinutes.value = "10";
      menuForm.elements.stock.value = "0";
      menuForm.elements.lowStockThreshold.value = "5";
      menuForm.elements.sizes.value = "Regular:0";
      menuForm.elements.status.value = "draft";
    }
    updatePreview();
    global.AutoCodeApp.openDialog(menuDialog);
  }

  function updatePreview() {
    if (!menuForm) return;
    const name = menuForm.elements.name.value.trim() || "Item name";
    const icon = menuForm.elements.icon.value.trim() || "🍽️";
    const image = menuForm.elements.imageUrl.value.trim();
    document.querySelector("[data-menu-preview-name]").textContent = name;
    document.querySelector("[data-menu-preview-price]").textContent = formatter.format(Number(menuForm.elements.price.value || 0));
    const previewSource = image ? (/^https?:\/\//i.test(image) ? image : `../${image.replace(/^\/+/, "")}`) : "";
    document.querySelector("[data-menu-preview-image]").innerHTML = previewSource ? `<img src="${escapeHtml(previewSource)}" alt="" class="size-full object-cover">` : escapeHtml(icon);
  }

  function saveMenu() {
    const target = document.querySelector("[data-menu-item-feedback]");
    try {
      const data = new FormData(menuForm);
      const name = String(data.get("name") || "").trim();
      const description = String(data.get("description") || "").trim();
      const price = Number(data.get("price"));
      const stock = Number(data.get("stock"));
      const threshold = Number(data.get("lowStockThreshold"));
      const preparationMinutes = Number(data.get("preparationMinutes"));
      const status = String(data.get("status"));
      const icon = String(data.get("icon") || "").trim();
      const imageUrl = String(data.get("imageUrl") || "").trim();
      if (!name || !description) throw new Error("Name and description are required.");
      if (!Number.isFinite(price) || price < 0) throw new Error("Base price cannot be negative.");
      if (![stock, threshold, preparationMinutes].every(Number.isInteger) || stock < 0 || threshold < 0 || preparationMinutes < 1) throw new Error("Stock and thresholds must be non-negative whole numbers; preparation time must be at least one minute.");
      if (status === "published" && (!data.get("categoryId") || (!icon && !imageUrl))) throw new Error("Published items require a category and an image or illustration emoji.");
      const sizes = parsePricedOptions(data.get("sizes"), "Size", "priceAdjustment");
      const addOns = parsePricedOptions(data.get("addOns"), "Add-on", "price");
      if (!sizes.length) throw new Error("Add at least one size.");
      global.AutoCodeState.update((state) => {
        let item = itemsFor(state).find((entry) => entry.id === selectedMenuId);
        if (item && selectedMenuVersion && (item.stock !== selectedMenuVersion.stock || item.updatedAt !== selectedMenuVersion.updatedAt)) {
          throw new Error(`Another tab updated ${item.name}. Close this editor, review the latest values, and try again.`);
        }
        const previousStock = item?.stock ?? stock;
        if (!item) {
          item = { id: createId("item"), restaurantId, emergencyCutoff: false, createdAt: now() };
          state.menuItems.push(item);
        }
        Object.assign(item, { categoryId: String(data.get("categoryId")), name, description, price, dietary: String(data.get("dietary")), stock, lowStockThreshold: threshold, status: stock === 0 && status === "published" ? "sold-out" : status, preparationMinutes, icon: icon || "🍽️", imagePath: imageUrl || null, imageUrl: /^https?:\/\//i.test(imageUrl) ? imageUrl : "", sizes, spiceLevels: parseNames(data.get("spiceLevels"), "Spice level"), addOns, updatedAt: now(), lastUpdatedBy: session.id, lastUpdatedByName: session.name });
        if (previousStock !== stock) audit(state, item, selectedMenuId ? "menu_stock_update" : "initial_stock", previousStock, stock, "Menu editor");
      }, selectedMenuId ? "menu-item-updated" : "menu-item-created");
      global.AutoCodeApp.closeDialog(menuDialog, "saved");
      selectedMenuId = null;
      selectedMenuVersion = null;
      renderAll();
    } catch (error) { feedback(target, error.message, true); }
  }

  function setMenuStatus(itemId, status) {
    global.AutoCodeState.update((state) => {
      const item = itemsFor(state).find((entry) => entry.id === itemId);
      if (!item) return;
      if (status === "published" && (!item.name || !item.categoryId || (!item.icon && !item.imagePath && !item.imageUrl))) throw new Error("Complete the name, category, and image before publishing.");
      item.status = status === "published" && item.stock === 0 ? "sold-out" : status;
      item.updatedAt = now();
      item.lastUpdatedBy = session.id;
      item.lastUpdatedByName = session.name;
    }, "menu-status-changed");
    renderAll();
  }

  function renderMenuAdmin() {
    if (session.role !== "admin" || !menuForm) return;
    const state = global.AutoCodeState.read();
    const items = itemsFor(state).filter((item) => (menuFilter === "all" || item.status === menuFilter) && `${item.name} ${item.description}`.toLowerCase().includes(menuSearch)).sort((a, b) => a.name.localeCompare(b.name));
    document.querySelector("[data-admin-menu-empty]").hidden = items.length > 0;
    document.querySelector("[data-admin-menu-list]").innerHTML = items.map((item) => `<article class="rounded-2xl border border-slate-200 p-4"><div class="flex items-start justify-between gap-3"><div class="flex gap-3"><span class="text-3xl">${escapeHtml(item.icon || "🍽️")}</span><div><h3 class="font-black text-slate-950">${escapeHtml(item.name)}</h3><p class="mt-1 text-xs font-bold text-slate-500">${escapeHtml(categoryName(state, item.categoryId))} · ${formatter.format(item.price)} · ${item.stock} in stock</p></div></div><span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-extrabold capitalize text-slate-700">${escapeHtml(item.status.replace("-", " "))}</span></div><div class="mt-4 flex flex-wrap gap-2"><button data-edit-menu="${escapeHtml(item.id)}" class="rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white">Edit & preview</button><button data-duplicate-menu="${escapeHtml(item.id)}" class="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold">Duplicate</button>${item.status === "draft" ? `<button data-menu-status="published" data-menu-id="${escapeHtml(item.id)}" class="rounded-lg border border-green-300 px-3 py-2 text-xs font-bold text-green-800">Publish</button>` : ""}${["published", "sold-out"].includes(item.status) ? `<button data-menu-status="hidden" data-menu-id="${escapeHtml(item.id)}" class="rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-800">Hide</button>` : ""}${item.status === "hidden" ? `<button data-menu-status="published" data-menu-id="${escapeHtml(item.id)}" class="rounded-lg border border-green-300 px-3 py-2 text-xs font-bold text-green-800">Publish</button>` : ""}${item.status !== "archived" ? `<button data-menu-status="archived" data-menu-id="${escapeHtml(item.id)}" class="rounded-lg border border-red-300 px-3 py-2 text-xs font-bold text-red-700">Archive</button>` : `<button data-menu-status="draft" data-menu-id="${escapeHtml(item.id)}" class="rounded-lg border border-blue-300 px-3 py-2 text-xs font-bold text-blue-700">Restore draft</button>`}</div></article>`).join("");
    hydrateFoodImages(document.querySelector("[data-admin-menu-list]"), items);
    renderCategories(state);
  }

  function renderCategories(state) {
    const categories = categoriesFor(state);
    document.querySelector("[data-admin-categories]").innerHTML = categories.map((category, index) => {
      const assigned = itemsFor(state).filter((item) => item.categoryId === category.id && item.status !== "archived").length;
      return `<div class="rounded-xl border border-slate-200 p-3 ${category.status === "archived" ? "opacity-60" : ""}"><div class="flex items-center justify-between gap-2"><div><p class="text-sm font-extrabold text-slate-900">${escapeHtml(category.name)}</p><p class="text-xs text-slate-500">${assigned} active item${assigned === 1 ? "" : "s"}</p></div><div class="flex gap-1"><button data-category-move="up" data-category-id="${escapeHtml(category.id)}" ${index === 0 ? "disabled" : ""} class="rounded px-2 py-1 font-bold disabled:opacity-30" aria-label="Move ${escapeHtml(category.name)} up">↑</button><button data-category-move="down" data-category-id="${escapeHtml(category.id)}" ${index === categories.length - 1 ? "disabled" : ""} class="rounded px-2 py-1 font-bold disabled:opacity-30" aria-label="Move ${escapeHtml(category.name)} down">↓</button></div></div><div class="mt-2 flex gap-3"><button data-rename-category="${escapeHtml(category.id)}" class="text-xs font-bold text-blue-700">Rename</button><button data-archive-category="${escapeHtml(category.id)}" class="text-xs font-bold ${category.status === "archived" ? "text-green-700" : "text-red-700"}">${category.status === "archived" ? "Restore" : "Archive"}</button></div></div>`;
    }).join("");
  }

  function categoryFeedback(message, error) {
    const target = document.querySelector("[data-category-feedback]");
    target.hidden = false;
    target.textContent = message;
    target.className = `mt-3 rounded-lg px-3 py-2 text-sm font-bold ${error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`;
  }

  function addCategory(name) {
    try {
      global.AutoCodeState.update((state) => {
        const categories = categoriesFor(state);
        if (categories.some((entry) => entry.name.toLowerCase() === name.toLowerCase())) throw new Error("Category names must be unique.");
        state.categories.push({ id: createId("cat"), restaurantId, name, order: categories.length + 1, status: "published", createdAt: now(), updatedAt: now() });
      }, "category-created");
      categoryFeedback("Category created.", false);
      renderAll();
    } catch (error) { categoryFeedback(error.message, true); }
  }

  function renameCategory(id) {
    const state = global.AutoCodeState.read();
    const current = categoriesFor(state).find((entry) => entry.id === id);
    const name = global.prompt("Category name:", current?.name || "")?.trim();
    if (!name) return;
    try {
      global.AutoCodeState.update((next) => {
        if (categoriesFor(next).some((entry) => entry.id !== id && entry.name.toLowerCase() === name.toLowerCase())) throw new Error("Category names must be unique.");
        const category = categoriesFor(next).find((entry) => entry.id === id);
        category.name = name.slice(0, 40); category.updatedAt = now();
      }, "category-renamed");
      renderAll();
    } catch (error) { categoryFeedback(error.message, true); }
  }

  function archiveCategory(id) {
    try {
      global.AutoCodeState.update((state) => {
        const category = categoriesFor(state).find((entry) => entry.id === id);
        if (category.status !== "archived") {
          const assigned = itemsFor(state).filter((item) => item.categoryId === id && item.status !== "archived");
          if (assigned.length) throw new Error(`Move or archive ${assigned.length} active menu item(s) before archiving this category.`);
          category.status = "archived";
        } else category.status = "published";
        category.updatedAt = now();
      }, "category-status-changed");
      renderAll();
    } catch (error) { categoryFeedback(error.message, true); }
  }

  function moveCategory(id, direction) {
    global.AutoCodeState.update((state) => {
      const categories = categoriesFor(state);
      const index = categories.findIndex((entry) => entry.id === id);
      const swap = index + (direction === "up" ? -1 : 1);
      if (index < 0 || swap < 0 || swap >= categories.length) return;
      [categories[index].order, categories[swap].order] = [categories[swap].order, categories[index].order];
      categories[index].updatedAt = categories[swap].updatedAt = now();
    }, "category-reordered");
    renderAll();
  }

  function renderAll() { renderInventory(); renderMenuAdmin(); }

  document.addEventListener("click", (event) => {
    const target = event.target.closest("button");
    if (!target) return;
    if (target.dataset.adjustStock) openInventory(target.dataset.adjustStock);
    if (target.dataset.toggleCutoff) toggleCutoff(target.dataset.toggleCutoff);
    if (target.matches("[data-close-inventory]")) global.AutoCodeApp.closeDialog(inventoryDialog, "cancel");
    if (target.matches("[data-new-menu-item]")) openMenu(null, false);
    if (target.dataset.editMenu) openMenu(target.dataset.editMenu, false);
    if (target.dataset.duplicateMenu) openMenu(target.dataset.duplicateMenu, true);
    if (target.dataset.menuStatus) {
      try { setMenuStatus(target.dataset.menuId, target.dataset.menuStatus); } catch (error) { global.alert(error.message); }
    }
    if (target.matches("[data-close-menu-item]")) global.AutoCodeApp.closeDialog(menuDialog, "cancel");
    if (target.dataset.renameCategory) renameCategory(target.dataset.renameCategory);
    if (target.dataset.archiveCategory) archiveCategory(target.dataset.archiveCategory);
    if (target.dataset.categoryMove) moveCategory(target.dataset.categoryId, target.dataset.categoryMove);
  });
  document.querySelector("[data-inventory-filter]")?.addEventListener("change", (event) => { inventoryFilter = event.target.value; renderInventory(); });
  inventoryForm.addEventListener("submit", (event) => { event.preventDefault(); saveInventory(); });
  menuForm?.addEventListener("submit", (event) => { event.preventDefault(); saveMenu(); });
  menuForm?.addEventListener("input", updatePreview);
  document.querySelector("[data-admin-menu-search]")?.addEventListener("input", (event) => { menuSearch = event.target.value.trim().toLowerCase(); renderMenuAdmin(); });
  document.querySelector("[data-admin-menu-filter]")?.addEventListener("change", (event) => { menuFilter = event.target.value; renderMenuAdmin(); });
  document.querySelector("[data-category-form]")?.addEventListener("submit", (event) => { event.preventDefault(); const input = event.currentTarget.elements.categoryName; const name = input.value.trim(); if (!name) return; addCategory(name); input.value = ""; });
  global.AutoCodeState.subscribe((state) => { if (state) renderAll(); });
  renderAll();
})(window);
