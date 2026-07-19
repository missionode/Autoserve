(function initializeCustomerAccount(global) {
  "use strict";
  const session = global.AutoCodeApp.getSession();
  if (!session || !["customer", "guest"].includes(session.role)) return;
  const restaurantId = session.restaurantId || "rest_autoserve_demo";
  const receiptDialog = document.querySelector("#customer-receipt-dialog");
  const formatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
  if (!receiptDialog) return;
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  const createId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const ordersFor = (state) => state.orders.filter((order) => order.restaurantId === restaurantId && order.customerId === session.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  function showFeedback(message, error) {
    const target = document.querySelector("[data-profile-feedback]");
    target.hidden = false;
    target.textContent = message;
    target.className = `mt-5 rounded-xl px-4 py-3 text-sm font-bold ${error ? "bg-amber-50 text-amber-950" : "bg-green-50 text-green-800"}`;
  }

  function renderProfile() {
    const state = global.AutoCodeState.read();
    const user = state.users.find((entry) => entry.id === session.id);
    const orders = ordersFor(state);
    const completed = orders.filter((order) => ["delivered", "cancelled"].includes(order.status));
    const rewards = orders.flatMap((order) => order.items.filter((item) => item.rewardSource).map((item) => ({ ...item, token: order.token, at: order.updatedAt })));
    const profile = document.querySelector("[data-customer-profile]");
    if (session.role === "guest") {
      profile.innerHTML = `<div class="app-card p-7"><div class="flex items-start gap-4"><div class="flex size-14 items-center justify-center rounded-full bg-slate-100 text-2xl">👤</div><div><h2 class="text-xl font-black text-slate-950">Guest session</h2><p class="mt-2 text-sm leading-6 text-slate-600">Current local orders and receipts remain available in this browser, but permanent customer history and rewards require sign-in.</p><a href="../login.html?role=customer" class="mt-4 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-bold text-white">Sign in or create account</a></div></div></div>`;
    } else {
      profile.innerHTML = `<div class="grid gap-4 md:grid-cols-3"><article class="app-card p-6 md:col-span-2"><p class="text-sm font-bold text-slate-500">Signed-in customer</p><h2 class="mt-2 text-2xl font-black text-slate-950">${escapeHtml(user?.name || session.name)}</h2><p class="mt-3 text-sm text-slate-600">${escapeHtml(user?.email || "No email")} · ${escapeHtml(user?.mobile || "No mobile")}</p></article><article class="app-card p-6"><p class="text-sm font-bold text-slate-500">Reward history</p><p class="mt-2 text-3xl font-black text-purple-700">${rewards.length}</p><p class="mt-2 text-xs text-slate-500">Complimentary item${rewards.length === 1 ? "" : "s"} issued</p></article></div>${rewards.length ? `<div class="app-card mt-4 p-5"><h3 class="font-black text-slate-950">Rewards earned</h3><div class="mt-3 flex flex-wrap gap-2">${rewards.map((reward) => `<span class="rounded-full bg-purple-50 px-3 py-2 text-xs font-bold text-purple-800">#${escapeHtml(reward.token)} · ${escapeHtml(reward.name)}</span>`).join("")}</div></div>` : ""}`;
    }
    document.querySelector("[data-customer-history-empty]").hidden = completed.length > 0;
    document.querySelector("[data-customer-history]").innerHTML = completed.map((order) => `<article class="app-card p-5"><div class="flex items-start justify-between gap-4"><div><h3 class="text-2xl font-black text-slate-950">#${escapeHtml(order.token)}</h3><p class="mt-1 text-sm font-bold ${order.status === "cancelled" ? "text-red-700" : "text-green-700"}">${escapeHtml(order.status)}</p><p class="mt-2 text-xs text-slate-500">${new Date(order.createdAt).toLocaleString("en-IN")} · ${order.items.reduce((sum, item) => sum + item.quantity, 0)} items</p></div><p class="font-black">${formatter.format(order.total)}</p></div><div class="mt-4 flex flex-wrap gap-2"><button data-customer-receipt="${escapeHtml(order.id)}" class="rounded-lg border border-blue-300 px-4 py-2 text-sm font-bold text-blue-700">Receipt</button>${session.role === "customer" ? `<button data-reorder="${escapeHtml(order.id)}" class="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white">Reorder available items</button>` : ""}</div></article>`).join("");
  }

  function openReceipt(orderId) {
    const state = global.AutoCodeState.read();
    const order = ordersFor(state).find((entry) => entry.id === orderId);
    if (!order) return;
    const snapshot = order.paidSnapshot || { items: order.items.filter((item) => !item.rewardSource), subtotal: order.subtotal, tax: order.tax, taxPercent: order.taxPercent, total: order.total, capturedAt: order.createdAt };
    const lines = [...snapshot.items, ...order.items.filter((item) => item.rewardSource)];
    document.querySelector("[data-customer-receipt-token]").textContent = `#${order.token}`;
    document.querySelector("[data-customer-receipt-content]").innerHTML = `<div class="rounded-xl bg-slate-100 p-4 text-sm"><strong>${escapeHtml(order.id)}</strong><br>${new Date(snapshot.capturedAt).toLocaleString("en-IN")} · ${escapeHtml(order.transactionId || "No transaction ID")}<br><span class="capitalize">${escapeHtml(order.paymentStatus)} · ${escapeHtml(order.status)}</span></div><div class="mt-4 divide-y divide-slate-200">${lines.map((item) => `<div class="flex justify-between gap-4 py-4"><div><p class="font-extrabold">${item.quantity} × ${escapeHtml(item.name)}${item.rewardSource ? ' <span class="text-purple-700">· Complimentary</span>' : ""}</p><p class="mt-1 text-xs text-slate-500">${escapeHtml([item.sizeName, item.spiceLevel, ...(item.addOns || []).map((option) => option.name)].filter(Boolean).join(" · "))}</p></div><p class="font-bold">${formatter.format(item.lineTotal || 0)}</p></div>`).join("")}</div><dl class="mt-4 space-y-2 border-t-2 border-slate-900 pt-4"><div class="flex justify-between"><dt>Subtotal</dt><dd>${formatter.format(snapshot.subtotal)}</dd></div><div class="flex justify-between"><dt>Tax (${snapshot.taxPercent}%)</dt><dd>${formatter.format(snapshot.tax)}</dd></div><div class="flex justify-between text-lg font-black"><dt>Total</dt><dd>${formatter.format(snapshot.total)}</dd></div>${order.refund ? `<div class="flex justify-between font-bold text-red-700"><dt>Simulated refund</dt><dd>${formatter.format(order.refund.amount)}</dd></div>` : ""}</dl>`;
    global.AutoCodeApp.openDialog(receiptDialog);
  }

  function reorder(orderId) {
    const skipped = [];
    let added = 0;
    try {
      global.AutoCodeState.update((state) => {
        const restaurant = state.restaurants.find((entry) => entry.id === restaurantId);
        if (!restaurant || restaurant.status !== "open") throw new Error("The restaurant is currently closed. Your previous order was not added.");
        const order = ordersFor(state).find((entry) => entry.id === orderId);
        if (!order) throw new Error("That order is no longer available.");
        let cart = state.carts.find((entry) => entry.ownerId === session.id && entry.restaurantId === restaurantId);
        if (!cart) { cart = { id: createId("cart"), ownerId: session.id, customerId: session.id, restaurantId, items: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; state.carts.push(cart); }
        order.items.filter((line) => !line.rewardSource).forEach((line) => {
          const item = state.menuItems.find((entry) => entry.id === line.itemId && entry.restaurantId === restaurantId);
          if (!item || item.status !== "published" || ["unavailable", "sold-out"].includes(item.availabilityStatus) || item.emergencyCutoff) { skipped.push(`${line.name}: unavailable`); return; }
          const size = (item.sizes || []).find((entry) => entry.id === line.sizeId);
          const addOns = (item.addOns || []).filter((entry) => (line.addOnIds || []).includes(entry.id));
          const spiceValid = !line.spiceLevel || (item.spiceLevels || []).includes(line.spiceLevel);
          if (!size || addOns.length !== (line.addOnIds || []).length || !spiceValid) { skipped.push(`${line.name}: options changed`); return; }
          const quantity = Number(line.quantity || 1);
          const unitPrice = item.price + Number(size.priceAdjustment || 0) + addOns.reduce((sum, entry) => sum + Number(entry.price || 0), 0);
          const key = [item.id, line.sizeId, line.spiceLevel || "", (line.addOnIds || []).slice().sort().join(","), line.instructions || ""].join("|");
          const existing = cart.items.find((entry) => entry.key === key);
          if (existing) existing.quantity += quantity;
          else cart.items.push({ id: createId("cart_item"), key, itemId: item.id, quantity, sizeId: line.sizeId, spiceLevel: line.spiceLevel || "", addOnIds: (line.addOnIds || []).slice(), instructions: line.instructions || "", unitPrice, addedAt: new Date().toISOString() });
          added += quantity;
        });
        cart.updatedAt = new Date().toISOString();
      }, "customer-order-reordered");
      if (!added) showFeedback(skipped.join("; ") || "No currently available items could be reordered.", true);
      else showFeedback(`${added} item(s) added at current prices.${skipped.length ? ` Skipped: ${skipped.join("; ")}.` : " Review your order before checkout."}`, skipped.length > 0);
    } catch (error) { showFeedback(error.message, true); }
  }

  document.addEventListener("click", (event) => {
    const receipt = event.target.closest("[data-customer-receipt]");
    const repeat = event.target.closest("[data-reorder]");
    if (receipt) openReceipt(receipt.dataset.customerReceipt);
    if (repeat) reorder(repeat.dataset.reorder);
  });
  document.querySelector("[data-close-customer-receipt]").addEventListener("click", () => global.AutoCodeApp.closeDialog(receiptDialog));
  global.AutoCodeState.subscribe((state) => { if (state) renderProfile(); });
  renderProfile();
})(window);
