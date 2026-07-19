(function initializeCustomerMenu(global) {
  "use strict";

  const session = global.AutoCodeApp.getSession();
  if (!session || !["customer", "guest"].includes(session.role)) return;

  const restaurantId = session.restaurantId || "rest_autoserve_demo";
  const menuGrid = document.querySelector("[data-menu-grid]");
  const categoryList = document.querySelector("[data-category-list]");
  const searchInput = document.querySelector("[data-menu-search]");
  const emptyState = document.querySelector("[data-menu-empty]");
  const itemDialog = document.querySelector("#item-dialog");
  const cartDialog = document.querySelector("#cart-dialog");
  const itemForm = document.querySelector("[data-item-form]");
  const cartItems = document.querySelector("[data-cart-items]");
  const cartEmpty = document.querySelector("[data-cart-empty]");
  const cartFeedback = document.querySelector("[data-cart-feedback]");
  const formatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
  let activeCategory = "all";
  let searchTerm = "";
  let selectedItemId = null;
  let feedbackDismissTimer = 0;

  if (!menuGrid || !itemDialog || !cartDialog) return;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  const availableQuantity = (item) => Math.max(0, Number(item?.availableQuantity ?? item?.stock ?? 0));
  const isAvailable = (item) => item.status === "published" && !["unavailable", "sold-out", "cutoff"].includes(item.availabilityStatus) && !item.emergencyCutoff && availableQuantity(item) > 0;
  const availabilityMessage = (item) => item.availabilityStatus === "limited" ? `Only ${availableQuantity(item)} left` : isAvailable(item) ? `${availableQuantity(item)} available` : item.availabilityStatus === "sold-out" ? "Sold out today" : "Temporarily unavailable";
  const imageSource = (item) => { const image = item?.imagePath || item?.imageUrl || ""; return image ? (image.startsWith("http") ? image : `../${image.replace(/^\/+/, "")}`) : ""; };
  const itemVisual = (item, classes) => imageSource(item)
    ? `<img src="${escapeHtml(imageSource(item))}" alt="${escapeHtml(item.name)}" class="${classes}" loading="lazy" decoding="async">`
    : `<div class="${classes} flex items-center justify-center bg-blue-50 text-3xl" role="img" aria-label="${escapeHtml(item?.name || "Menu item")}">${escapeHtml(item?.icon || "🍽️")}</div>`;

  function readContext() {
    const state = global.AutoCodeState.read();
    return {
      state,
      restaurant: state.restaurants.find((item) => item.id === restaurantId),
      categories: state.categories.filter((category) => category.restaurantId === restaurantId && category.status === "published").sort((a, b) => a.order - b.order),
      items: state.menuItems.filter((item) => item.restaurantId === restaurantId && ["published", "sold-out"].includes(item.status))
    };
  }

  function currentCart(state) {
    return state.carts.find((cart) => cart.ownerId === session.id && cart.restaurantId === restaurantId) || null;
  }

  function cartQuantityForItem(cart, itemId) {
    return (cart?.items || []).filter((entry) => entry.itemId === itemId).reduce((sum, entry) => sum + entry.quantity, 0);
  }

  function ensureCart(state) {
    let cart = currentCart(state);
    if (!cart) {
      const conflictingCart = state.carts.find((candidate) => candidate.ownerId === session.id && candidate.items.length > 0 && candidate.restaurantId !== restaurantId);
      if (conflictingCart) throw new Error("Your current order belongs to another restaurant. Clear it before ordering here.");
      cart = { id: `cart_${Date.now()}`, ownerId: session.id, customerId: session.id, restaurantId, items: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      state.carts.push(cart);
    }
    return cart;
  }

  function entryUnitPrice(item, sizeId, addOnIds) {
    const size = (item.sizes || []).find((option) => option.id === sizeId);
    const addOnTotal = (item.addOns || []).filter((option) => addOnIds.includes(option.id)).reduce((sum, option) => sum + option.price, 0);
    return item.price + (size?.priceAdjustment || 0) + addOnTotal;
  }

  function renderCategories(categories) {
    const options = [{ id: "all", name: "All" }, ...categories];
    categoryList.innerHTML = options.map((category) => {
      const active = category.id === activeCategory;
      return `<button type="button" data-category-id="${escapeHtml(category.id)}" class="whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-extrabold transition ${active ? "bg-blue-700 text-white" : "border border-slate-300 bg-white text-slate-700 hover:border-blue-700 hover:text-blue-800"}">${escapeHtml(category.name)}</button>`;
    }).join("");
  }

  function renderMenu() {
    try {
      const { state, restaurant, categories, items } = readContext();
      const cart = currentCart(state);
      renderCategories(categories);
      if (restaurant?.status !== "open") {
        emptyState.hidden = true;
        menuGrid.innerHTML = '<div class="app-card col-span-full border-amber-200 p-10 text-center"><div class="text-5xl">🕒</div><h2 class="mt-4 text-2xl font-black text-slate-950">Restaurant currently closed</h2><p class="mt-2 text-slate-600">Your order is retained. Return during operating hours to review availability and checkout.</p></div>';
        renderCart();
        return;
      }
      const filtered = items.filter((item) => {
        const categoryMatch = activeCategory === "all" || item.categoryId === activeCategory;
        const textMatch = `${item.name} ${item.description}`.toLowerCase().includes(searchTerm);
        return categoryMatch && textMatch;
      });
      emptyState.hidden = filtered.length > 0;
      menuGrid.innerHTML = filtered.map((item) => {
        const available = restaurant?.status === "open" && isAvailable(item);
        const inCart = cartQuantityForItem(cart, item.id);
        const defaultSize = item.sizes?.[0] || { id: "regular", name: "Regular", priceAdjustment: 0 };
        const defaultSpice = item.spiceLevels?.[0] || "Standard preparation";
        const defaultPrice = item.price + Number(defaultSize.priceAdjustment || 0);
        return `<article class="app-card group overflow-hidden">
          ${itemVisual(item, "aspect-[16/10] w-full object-cover transition duration-300 group-hover:scale-[1.02]")}
          <div class="p-5">
            <div class="flex items-start justify-between gap-3"><div><p class="text-xs font-extrabold uppercase tracking-wider ${item.dietary === "vegetarian" ? "text-green-700" : "text-red-700"}">${escapeHtml(item.dietary)}</p><h3 class="mt-1 text-xl font-black text-slate-950">${escapeHtml(item.name)}</h3></div><p class="whitespace-nowrap font-black text-blue-800">${formatter.format(defaultPrice)}</p></div>
            <p class="mt-3 min-h-12 text-sm leading-6 text-slate-600">${escapeHtml(item.description)}</p>
            <div class="mt-4 rounded-xl bg-slate-50 px-3 py-2.5"><p class="text-[0.6875rem] font-extrabold uppercase tracking-wider text-slate-500">Quick-add defaults</p><p class="mt-1 text-xs font-bold text-slate-700">${escapeHtml(defaultSize.name)} · ${escapeHtml(defaultSpice)} · No add-ons</p></div>
            <div class="mt-4"><div class="flex items-center justify-between gap-3"><div><p class="text-xs font-bold ${available ? item.availabilityStatus === "limited" ? "text-amber-700" : "text-slate-500" : "text-red-700"}">${escapeHtml(availabilityMessage(item))}</p>${inCart ? `<p class="mt-1 text-xs font-extrabold text-blue-700">${inCart} in your order</p>` : ""}</div></div><div class="mt-3 grid grid-cols-2 gap-2"><button type="button" data-open-item="${escapeHtml(item.id)}" ${available ? "" : "disabled"} class="rounded-xl border px-3 py-2.5 text-sm font-extrabold ${available ? "border-blue-300 text-blue-700 hover:bg-blue-50" : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"}">${available ? "Customize" : "Unavailable"}</button><button type="button" data-quick-add="${escapeHtml(item.id)}" ${available ? "" : "disabled"} class="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-extrabold ${available ? "bg-blue-700 text-white hover:bg-blue-800" : "cursor-not-allowed bg-slate-200 text-slate-500"}">${available ? '<span aria-hidden="true">⚡</span><span>Quick add</span>' : "Unavailable"}</button></div></div>
          </div>
        </article>`;
      }).join("");
      renderCart();
    } catch (error) {
      menuGrid.innerHTML = `<div class="app-card col-span-full p-8 text-center text-red-800"><p class="font-extrabold">Menu unavailable</p><p class="mt-2 text-sm">${escapeHtml(error.message)}</p></div>`;
    }
  }

  function openItem(itemId) {
    const { restaurant, items } = readContext();
    const item = items.find((candidate) => candidate.id === itemId);
    if (!item || restaurant?.status !== "open" || !isAvailable(item)) return;
    selectedItemId = item.id;
    itemForm.reset();
    const itemImage = itemForm.querySelector("[data-item-image]");
    const itemIcon = itemForm.querySelector("[data-item-icon]");
    itemImage.hidden = !imageSource(item);
    itemIcon.hidden = Boolean(imageSource(item));
    itemImage.src = imageSource(item);
    itemImage.alt = item.name;
    itemIcon.textContent = item.icon || "🍽️";
    itemForm.querySelector("[data-item-name]").textContent = item.name;
    itemForm.querySelector("[data-item-description]").textContent = item.description;
    itemForm.querySelector("[data-item-stock]").textContent = availabilityMessage(item);
    itemForm.querySelector("[data-item-quantity]").max = String(availableQuantity(item));
    itemForm.querySelector("[data-size-options]").innerHTML = (item.sizes || [{ id: "regular", name: "Regular", priceAdjustment: 0 }]).map((size, index) => `<label class="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-300 p-3 has-[:checked]:border-blue-700 has-[:checked]:bg-blue-50"><span class="flex items-center gap-3"><input type="radio" name="size" value="${escapeHtml(size.id)}" ${index === 0 ? "checked" : ""} required><span class="font-bold text-slate-800">${escapeHtml(size.name)}</span></span><span class="text-sm font-bold text-slate-600">${size.priceAdjustment ? `+${formatter.format(size.priceAdjustment)}` : "Included"}</span></label>`).join("");
    const spiceSection = itemForm.querySelector("[data-spice-section]");
    spiceSection.hidden = !(item.spiceLevels || []).length;
    itemForm.querySelector("[data-spice-options]").innerHTML = (item.spiceLevels || []).map((level, index) => `<label class="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 has-[:checked]:border-blue-700 has-[:checked]:bg-blue-50"><input type="radio" name="spice" value="${escapeHtml(level)}" ${index === 0 ? "checked" : ""}><span class="text-sm font-bold">${escapeHtml(level)}</span></label>`).join("");
    const addOnSection = itemForm.querySelector("[data-addon-section]");
    addOnSection.hidden = !(item.addOns || []).length;
    itemForm.querySelector("[data-addon-options]").innerHTML = (item.addOns || []).map((option) => `<label class="flex items-center justify-between gap-3 rounded-xl border border-slate-300 p-3 has-[:checked]:border-blue-700 has-[:checked]:bg-blue-50"><span class="flex items-center gap-3"><input type="checkbox" name="addons" value="${escapeHtml(option.id)}"><span class="font-bold text-slate-800">${escapeHtml(option.name)}</span></span><span class="text-sm font-bold text-slate-600">+${formatter.format(option.price)}</span></label>`).join("");
    updateDialogPrice();
    global.AutoCodeApp.openDialog(itemDialog);
  }

  function updateDialogPrice() {
    if (!selectedItemId) return;
    const item = readContext().items.find((candidate) => candidate.id === selectedItemId);
    if (!item) return;
    const formData = new FormData(itemForm);
    const quantity = Math.max(1, Number(formData.get("quantity") || 1));
    const addOnIds = formData.getAll("addons");
    itemForm.querySelector("[data-item-total]").textContent = formatter.format(entryUnitPrice(item, formData.get("size"), addOnIds) * quantity);
  }

  function addSelectedItem() {
    const formData = new FormData(itemForm);
    const quantity = Math.max(1, Number(formData.get("quantity") || 1));
    const sizeId = String(formData.get("size") || "regular");
    const spiceLevel = String(formData.get("spice") || "");
    const addOnIds = formData.getAll("addons").map(String).sort();
    const instructions = String(formData.get("instructions") || "").trim().slice(0, 180);
    try {
      global.AutoCodeState.update((state) => {
        const item = state.menuItems.find((candidate) => candidate.id === selectedItemId && candidate.restaurantId === restaurantId);
        if (!item || !isAvailable(item)) throw new Error("This item is no longer available.");
        const cart = ensureCart(state);
        const existingQuantity = cartQuantityForItem(cart, item.id);
        if (existingQuantity + quantity > availableQuantity(item)) throw new Error(`Only ${availableQuantity(item)} ${item.name} available.`);
        const key = [item.id, sizeId, spiceLevel, addOnIds.join(","), instructions].join("|");
        const existing = cart.items.find((entry) => entry.key === key);
        if (existing) existing.quantity += quantity;
        else cart.items.push({ id: `cart_item_${Date.now()}`, key, itemId: item.id, quantity, sizeId, spiceLevel, addOnIds, instructions, unitPrice: entryUnitPrice(item, sizeId, addOnIds), addedAt: new Date().toISOString() });
        cart.updatedAt = new Date().toISOString();
      }, "cart-item-added");
      global.AutoCodeApp.closeDialog(itemDialog, "added");
      renderMenu();
      showCartFeedback("Item added to your order.", false);
    } catch (error) {
      const feedback = itemForm.querySelector("[data-item-feedback]");
      feedback.hidden = false;
      feedback.textContent = error.message;
    }
  }

  function quickAddItem(itemId) {
    try {
      global.AutoCodeState.update((state) => {
        const item = state.menuItems.find((candidate) => candidate.id === itemId && candidate.restaurantId === restaurantId);
        if (!item || !isAvailable(item)) throw new Error("This item is no longer available.");
        const sizeId = item.sizes?.[0]?.id || "regular";
        const spiceLevel = item.spiceLevels?.[0] || "";
        const addOnIds = [];
        const instructions = "";
        const cart = ensureCart(state);
        if (cartQuantityForItem(cart, item.id) + 1 > availableQuantity(item)) throw new Error(`${item.name} is no longer available in that quantity.`);
        const key = [item.id, sizeId, spiceLevel, "", instructions].join("|");
        const existing = cart.items.find((entry) => entry.key === key);
        if (existing) existing.quantity += 1;
        else cart.items.push({ id: `cart_item_${Date.now()}`, key, itemId: item.id, quantity: 1, sizeId, spiceLevel, addOnIds, instructions, unitPrice: entryUnitPrice(item, sizeId, addOnIds), addedAt: new Date().toISOString() });
        cart.updatedAt = new Date().toISOString();
      }, "quick-order-item-added");
      renderMenu();
      showCartFeedback("Default item added. You can keep browsing or review your order.", false);
    } catch (error) {
      showCartFeedback(error.message, true);
    }
  }

  function showCartFeedback(message, error) {
    global.clearTimeout(feedbackDismissTimer);
    cartFeedback.hidden = false;
    cartFeedback.textContent = message;
    cartFeedback.className = `mb-4 rounded-xl px-4 py-3 text-sm font-bold ${error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`;
    if (!cartDialog.open) global.AutoCodeApp.openDialog(cartDialog);
    if (!error) feedbackDismissTimer = global.setTimeout(() => {
      if (cartDialog.open) global.AutoCodeApp.closeDialog(cartDialog);
      cartFeedback.hidden = true;
    }, 2400);
  }

  function cartTotals(cart, state) {
    const subtotal = (cart?.items || []).reduce((sum, entry) => sum + entry.unitPrice * entry.quantity, 0);
    const restaurant = state.restaurants.find((item) => item.id === restaurantId);
    const tax = subtotal * Number(restaurant?.taxPercent || 0) / 100;
    return { subtotal, tax, total: subtotal + tax };
  }

  function renderCart() {
    const { state } = readContext();
    const cart = currentCart(state);
    const entries = cart?.items || [];
    const quantity = entries.reduce((sum, entry) => sum + entry.quantity, 0);
    document.querySelectorAll("[data-cart-count]").forEach((element) => { element.textContent = String(quantity); element.hidden = quantity === 0; });
    cartEmpty.hidden = entries.length > 0;
    cartItems.hidden = entries.length === 0;
    cartItems.innerHTML = entries.map((entry) => {
      const item = state.menuItems.find((candidate) => candidate.id === entry.itemId);
      const size = (item?.sizes || []).find((option) => option.id === entry.sizeId)?.name;
      const addOns = (item?.addOns || []).filter((option) => entry.addOnIds.includes(option.id)).map((option) => option.name);
      const details = [size, entry.spiceLevel, ...addOns].filter(Boolean).join(" · ");
      return `<article class="border-b border-slate-200 py-5 last:border-0"><div class="flex gap-4">${itemVisual(item, "size-16 shrink-0 rounded-xl object-cover")}<div class="min-w-0 flex-1"><div class="flex items-start justify-between gap-3"><div><h3 class="font-extrabold text-slate-950">${escapeHtml(item?.name || "Unavailable item")}</h3><p class="mt-1 text-xs leading-5 text-slate-500">${escapeHtml(details)}</p>${entry.instructions ? `<p class="mt-1 text-xs italic text-slate-500">“${escapeHtml(entry.instructions)}”</p>` : ""}</div><p class="whitespace-nowrap font-extrabold text-slate-900">${formatter.format(entry.unitPrice * entry.quantity)}</p></div><div class="mt-4 flex items-center justify-between"><div class="inline-flex items-center rounded-lg border border-slate-300"><button type="button" data-cart-decrease="${escapeHtml(entry.id)}" class="px-3 py-1.5 font-black" aria-label="Decrease ${escapeHtml(item?.name)}">−</button><span class="min-w-8 text-center text-sm font-bold">${entry.quantity}</span><button type="button" data-cart-increase="${escapeHtml(entry.id)}" class="px-3 py-1.5 font-black" aria-label="Increase ${escapeHtml(item?.name)}">+</button></div><button type="button" data-cart-remove="${escapeHtml(entry.id)}" class="text-sm font-bold text-red-700 hover:underline">Remove</button></div></div></div></article>`;
    }).join("");
    const totals = cartTotals(cart, state);
    document.querySelector("[data-cart-subtotal]").textContent = formatter.format(totals.subtotal);
    document.querySelector("[data-cart-tax]").textContent = formatter.format(totals.tax);
    document.querySelector("[data-cart-total]").textContent = formatter.format(totals.total);
    document.querySelector("[data-checkout-button]").disabled = entries.length === 0;
  }

  function changeQuantity(entryId, direction) {
    try {
      global.AutoCodeState.update((state) => {
        const cart = currentCart(state);
        const entry = cart?.items.find((candidate) => candidate.id === entryId);
        if (!entry) return;
        const item = state.menuItems.find((candidate) => candidate.id === entry.itemId);
        entry.quantity += direction;
        if (entry.quantity <= 0) cart.items = cart.items.filter((candidate) => candidate.id !== entryId);
        cart.updatedAt = new Date().toISOString();
      }, "cart-quantity-changed");
      cartFeedback.hidden = true;
      renderMenu();
    } catch (error) {
      showCartFeedback(error.message, true);
    }
  }

  function removeEntry(entryId) {
    global.AutoCodeState.update((state) => {
      const cart = currentCart(state);
      if (!cart) return;
      cart.items = cart.items.filter((entry) => entry.id !== entryId);
      cart.updatedAt = new Date().toISOString();
    }, "cart-item-removed");
    cartFeedback.hidden = true;
    renderMenu();
  }

  categoryList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category-id]");
    if (!button) return;
    activeCategory = button.dataset.categoryId;
    renderMenu();
  });
  searchInput.addEventListener("input", () => { searchTerm = searchInput.value.trim().toLowerCase(); renderMenu(); });
  menuGrid.addEventListener("click", (event) => {
    const customizeButton = event.target.closest("[data-open-item]");
    const quickAddButton = event.target.closest("[data-quick-add]");
    if (customizeButton) openItem(customizeButton.dataset.openItem);
    if (quickAddButton) quickAddItem(quickAddButton.dataset.quickAdd);
  });
  itemForm.addEventListener("change", updateDialogPrice);
  itemForm.addEventListener("input", updateDialogPrice);
  itemForm.addEventListener("submit", (event) => { event.preventDefault(); addSelectedItem(); });
  document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => global.AutoCodeApp.closeDialog(button.closest("dialog"))));
  document.querySelectorAll("[data-open-cart]").forEach((button) => button.addEventListener("click", () => {
    global.clearTimeout(feedbackDismissTimer);
    cartFeedback.hidden = true;
    renderCart();
    global.AutoCodeApp.openDialog(cartDialog);
  }));
  cartDialog.addEventListener("pointerdown", () => global.clearTimeout(feedbackDismissTimer));
  cartDialog.addEventListener("keydown", () => global.clearTimeout(feedbackDismissTimer));
  cartItems.addEventListener("click", (event) => {
    const decrease = event.target.closest("[data-cart-decrease]");
    const increase = event.target.closest("[data-cart-increase]");
    const remove = event.target.closest("[data-cart-remove]");
    if (decrease) changeQuantity(decrease.dataset.cartDecrease, -1);
    if (increase) changeQuantity(increase.dataset.cartIncrease, 1);
    if (remove) removeEntry(remove.dataset.cartRemove);
  });
  document.querySelector("[data-checkout-button]").addEventListener("click", () => { global.location.hash = "/checkout"; global.AutoCodeApp.closeDialog(cartDialog); });
  global.AutoCodeState.subscribe((state) => { if (state) renderMenu(); });
  renderMenu();
})(window);
