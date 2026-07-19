(function initializeCheckout(global) {
  "use strict";

  const session = global.AutoCodeApp.getSession();
  if (!session || !["customer", "guest"].includes(session.role)) return;

  const restaurantId = session.restaurantId || "rest_autoserve_demo";
  const checkoutForm = document.querySelector("[data-checkout-form]");
  const paymentDialog = document.querySelector("#payment-dialog");
  const paymentForm = document.querySelector("[data-payment-form]");
  const formatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
  let checkoutDraft = null;

  if (!checkoutForm || !paymentDialog || !paymentForm) return;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  const imageSource = (item) => { const image = item?.imagePath || item?.imageUrl || ""; return image ? (image.startsWith("http") ? image : `../${image.replace(/^\/+/, "")}`) : ""; };
  const createId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  function cartFor(state) {
    return state.carts.find((cart) => cart.ownerId === session.id && cart.restaurantId === restaurantId) || null;
  }

  function totalsFor(cart, state) {
    const subtotal = (cart?.items || []).reduce((sum, entry) => sum + entry.unitPrice * entry.quantity, 0);
    const restaurant = state.restaurants.find((item) => item.id === restaurantId);
    const taxPercent = Number(restaurant?.taxPercent || 0);
    const tax = subtotal * taxPercent / 100;
    return { subtotal, tax, taxPercent, total: subtotal + tax };
  }

  function setCheckoutFeedback(message, error) {
    const element = document.querySelector("[data-checkout-feedback]");
    element.hidden = false;
    element.textContent = message;
    element.className = `mb-5 rounded-xl px-4 py-3 text-sm font-bold ${error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`;
  }

  function setPaymentFeedback(message, type) {
    const element = document.querySelector("[data-payment-feedback]");
    element.hidden = false;
    element.textContent = message;
    const styles = type === "error" ? "bg-red-50 text-red-800" : type === "pending" ? "bg-amber-50 text-amber-900" : "bg-green-50 text-green-800";
    element.className = `mt-5 rounded-xl px-4 py-3 text-sm font-bold ${styles}`;
  }

  function validateCart(state) {
    const cart = cartFor(state);
    if (!cart || !cart.items.length) throw new Error("Your order is empty. Add an item before checkout.");
    const restaurant = state.restaurants.find((item) => item.id === restaurantId);
    if (!restaurant || restaurant.status !== "open") throw new Error("This restaurant is currently closed and cannot accept new orders.");
    const requested = new Map();
    cart.items.forEach((entry) => requested.set(entry.itemId, (requested.get(entry.itemId) || 0) + entry.quantity));
    cart.items.forEach((entry) => {
      const item = state.menuItems.find((candidate) => candidate.id === entry.itemId && candidate.restaurantId === restaurantId);
      const size = (item?.sizes || []).find((option) => option.id === entry.sizeId);
      const addOns = (item?.addOns || []).filter((option) => entry.addOnIds.includes(option.id));
      if (!size || addOns.length !== entry.addOnIds.length) throw new Error(`${item?.name || "An item"} has updated options. Remove it and customize it again.`);
      const currentUnitPrice = item.price + Number(size.priceAdjustment || 0) + addOns.reduce((sum, option) => sum + Number(option.price || 0), 0);
      if (entry.comboId) {
        const combo = (restaurant.combos || []).find((candidate) => candidate.id === entry.comboId);
        if (!restaurant.combosEnabled || !combo?.active || combo.id !== entry.comboId || !combo.itemIds.includes(item.id) || currentUnitPrice !== entry.regularUnitPrice) throw new Error(`${entry.comboName || "The combo"} has changed. Remove its items and add the combo again.`);
      } else if (currentUnitPrice !== entry.unitPrice) throw new Error(`${item.name} now costs ${formatter.format(currentUnitPrice)} with your selections. Remove it and add it again to accept the new price.`);
    });
    const comboGroups = new Map();
    cart.items.filter((entry) => entry.comboInstance).forEach((entry) => { const group = comboGroups.get(entry.comboInstance) || []; group.push(entry); comboGroups.set(entry.comboInstance, group); });
    comboGroups.forEach((entries) => { const combo = (restaurant.combos || []).find((entry) => entry.id === entries[0]?.comboId); const itemIds = entries.map((entry) => entry.itemId).sort(); const expectedIds = [...(combo?.itemIds || [])].sort(); const total = entries.reduce((sum, entry) => sum + entry.unitPrice * entry.quantity, 0); if (!combo || itemIds.join("|") !== expectedIds.join("|") || entries.some((entry) => entry.quantity !== 1) || Math.abs(total - Number(combo.price)) > 0.01) throw new Error(`${entries[0]?.comboName || "The combo"} is incomplete. Remove its remaining items and add it again.`); });
    requested.forEach((quantity, itemId) => {
      const item = state.menuItems.find((candidate) => candidate.id === itemId && candidate.restaurantId === restaurantId);
      if (!item || item.status !== "published" || item.emergencyCutoff || ["unavailable", "sold-out", "cutoff"].includes(item.availabilityStatus)) throw new Error(`${item?.name || "An item"} is no longer available.`);
      const remaining = Math.max(0, Number(item.availableQuantity ?? item.stock ?? 0));
      if (quantity > remaining) throw new Error(`Only ${remaining} ${item.name} available. Update your order before payment.`);
    });
    return cart;
  }

  function renderCheckout() {
    try {
      const state = global.AutoCodeState.read();
      const cart = cartFor(state);
      const items = cart?.items || [];
      const container = document.querySelector("[data-checkout-items]");
      document.querySelector("[data-checkout-empty]").hidden = items.length > 0;
      container.hidden = items.length === 0;
      container.innerHTML = items.map((entry) => {
        const item = state.menuItems.find((candidate) => candidate.id === entry.itemId);
        const visual = imageSource(item) ? `<img src="${escapeHtml(imageSource(item))}" alt="" class="size-14 shrink-0 rounded-xl object-cover" loading="lazy">` : `<span class="text-2xl">${escapeHtml(item?.icon || "🍽️")}</span>`;
        return `<div class="flex gap-3 py-4">${visual}<div class="min-w-0 flex-1"><p class="font-extrabold text-slate-900">${entry.quantity} × ${escapeHtml(item?.name || "Item")}</p><p class="mt-1 text-xs text-slate-500">${escapeHtml([entry.sizeId, entry.spiceLevel].filter(Boolean).join(" · "))}</p></div><p class="font-bold text-slate-800">${formatter.format(entry.unitPrice * entry.quantity)}</p></div>`;
      }).join("");
      const totals = totalsFor(cart, state);
      document.querySelector("[data-checkout-subtotal]").textContent = formatter.format(totals.subtotal);
      document.querySelector("[data-checkout-tax]").textContent = `${formatter.format(totals.tax)} (${totals.taxPercent}%)`;
      document.querySelector("[data-checkout-total]").textContent = formatter.format(totals.total);
      document.querySelector("[data-pay-button]").disabled = items.length === 0;
    } catch (error) {
      setCheckoutFeedback(error.message, true);
    }
  }

  function prefillCustomer() {
    const state = global.AutoCodeState.read();
    const user = state.users.find((candidate) => candidate.id === session.id);
    if (user) {
      document.querySelector("[data-checkout-name]").value = user.name || "";
      document.querySelector("[data-checkout-mobile]").value = user.mobile || "";
    }
    const table = new URLSearchParams(global.location.search).get("table") || state.activeSession?.entryContext?.tableNumber;
    if (table) document.querySelector("[data-checkout-table]").value = table.slice(0, 20);
    const serviceMode = new URLSearchParams(global.location.search).get("service") || state.activeSession?.entryContext?.serviceMode;
    const serviceInput = checkoutForm.querySelector(`input[name="serviceMode"][value="${serviceMode}"]`);
    if (serviceInput) serviceInput.checked = true;
  }

  function toggleOrderType() {
    const restaurant = global.AutoCodeState.read().restaurants.find((item) => item.id === restaurantId);
    const dineInInput = checkoutForm.querySelector('input[name="orderType"][value="dine-in"]');
    const takeawayInput = checkoutForm.querySelector('input[name="orderType"][value="takeaway"]');
    dineInInput.disabled = restaurant?.dineInEnabled === false;
    takeawayInput.disabled = restaurant?.takeawayEnabled === false;
    dineInInput.closest("label").hidden = dineInInput.disabled;
    takeawayInput.closest("label").hidden = takeawayInput.disabled;
    if (dineInInput.checked && dineInInput.disabled) takeawayInput.checked = true;
    if (takeawayInput.checked && takeawayInput.disabled) dineInInput.checked = true;
    const orderType = checkoutForm.querySelector('input[name="orderType"]:checked')?.value;
    const field = document.querySelector("[data-table-field]");
    field.hidden = orderType !== "dine-in";
    field.querySelector("input").required = orderType === "dine-in";
    const serviceField = document.querySelector("[data-service-preference]");
    serviceField.hidden = orderType !== "dine-in";
    const configuredMode = ["self-service", "table-service"].includes(restaurant?.dineInServiceMode) ? restaurant.dineInServiceMode : "both";
    const allowedModes = configuredMode === "both" ? ["self-service", "table-service"] : [configuredMode];
    serviceField.querySelectorAll("[data-service-option]").forEach((option) => {
      const input = option.querySelector("input");
      const allowed = orderType === "dine-in" && allowedModes.includes(input.value);
      option.hidden = !allowed;
      input.disabled = !allowed;
    });
    if (orderType === "dine-in" && !allowedModes.includes(serviceField.querySelector('input:checked')?.value)) {
      serviceField.querySelector(`input[value="${allowedModes[0]}"]`).checked = true;
    }
  }

  function validateCheckout() {
    const data = new FormData(checkoutForm);
    const customerName = String(data.get("customerName") || "").trim();
    const mobile = String(data.get("mobile") || "").trim();
    const orderType = String(data.get("orderType") || "");
    const serviceMode = orderType === "takeaway" ? "self-service" : String(data.get("serviceMode") || "");
    const tableNumber = String(data.get("tableNumber") || "").trim();
    if (!customerName) throw new Error("Enter the customer name.");
    if (!/^\d{10}$/.test(mobile)) throw new Error("Enter a valid 10-digit mobile number.");
    if (!['dine-in', 'takeaway'].includes(orderType)) throw new Error("Choose dine-in or takeaway.");
    if (!["self-service", "table-service"].includes(serviceMode)) throw new Error("Choose self-service pickup or table service.");
    if (orderType === "takeaway" && serviceMode === "table-service") throw new Error("Table service is available only for dine-in orders.");
    const restaurant = global.AutoCodeState.read().restaurants.find((item) => item.id === restaurantId);
    if (orderType === "dine-in" && restaurant?.dineInEnabled === false) throw new Error("Dine-in ordering is currently unavailable.");
    if (orderType === "takeaway" && restaurant?.takeawayEnabled === false) throw new Error("Takeaway ordering is currently unavailable.");
    const configuredMode = ["self-service", "table-service"].includes(restaurant?.dineInServiceMode) ? restaurant.dineInServiceMode : "both";
    if (orderType === "dine-in" && configuredMode !== "both" && serviceMode !== configuredMode) throw new Error("Choose a service option offered by this restaurant.");
    if (orderType === "dine-in" && !tableNumber) throw new Error("Enter the table number for a dine-in order.");
    if (data.get("terms") !== "accepted") throw new Error("Accept the prototype payment terms before continuing.");
    const state = global.AutoCodeState.read();
    const cart = validateCart(state);
    return {
      customerName,
      mobile,
      orderType,
      serviceMode,
      tableNumber: orderType === "dine-in" ? tableNumber : null,
      orderNotes: String(data.get("orderNotes") || "").trim().slice(0, 180),
      totals: totalsFor(cart, state),
      cartId: cart.id,
      attemptId: createId("attempt")
    };
  }

  function openPayment() {
    checkoutDraft = validateCheckout();
    paymentForm.reset();
    paymentForm.querySelector('[name="upiMethod"][value="mock-app"]').checked = true;
    paymentForm.querySelector('[name="outcome"]').value = "success";
    document.querySelector("[data-payment-total]").textContent = formatter.format(checkoutDraft.totals.total);
    document.querySelector("[data-payment-feedback]").hidden = true;
    document.querySelector("[data-payment-fields]").hidden = false;
    document.querySelector("[data-pending-resolution]").hidden = true;
    document.querySelector("[data-upi-id-field]").hidden = true;
    global.AutoCodeApp.openDialog(paymentDialog);
  }

  function paymentMethodData() {
    const data = new FormData(paymentForm);
    const method = String(data.get("upiMethod") || "mock-app");
    const upiId = String(data.get("upiId") || "").trim();
    if (method === "upi-id" && !/^[-.\w]+@[-.\w]+$/.test(upiId)) throw new Error("Enter a valid simulated UPI ID, such as name@bank.");
    return { method, upiId: method === "upi-id" ? upiId : null, outcome: String(data.get("outcome") || "success") };
  }

  function recordNonSuccess(status, methodData) {
    global.AutoCodeState.update((state) => {
      let payment = state.payments.find((candidate) => candidate.attemptId === checkoutDraft.attemptId);
      if (!payment) {
        payment = { id: createId("payment"), attemptId: checkoutDraft.attemptId, restaurantId, customerId: session.id, cartId: checkoutDraft.cartId, amount: checkoutDraft.totals.total, method: methodData.method, upiId: methodData.upiId, status, createdAt: new Date().toISOString() };
        state.payments.push(payment);
      } else if (payment.status !== "success") {
        payment.status = status;
        payment.updatedAt = new Date().toISOString();
      }
    }, `payment-${status}`);
  }

  function createSuccessfulOrder(methodData) {
    let createdOrderId = null;
    global.AutoCodeState.update((state) => {
      let payment = state.payments.find((candidate) => candidate.attemptId === checkoutDraft.attemptId);
      if (payment?.status === "success" && payment.orderId) {
        createdOrderId = payment.orderId;
        return;
      }
      const cart = validateCart(state);
      const restaurant = state.restaurants.find((item) => item.id === restaurantId);
      if (!restaurant) throw new Error("The selected restaurant is unavailable.");
      const totals = totalsFor(cart, state);
      const tokenValue = Number(restaurant.nextToken || restaurant.tokenStart || 100);
      restaurant.nextToken = tokenValue + 1;
      const kotValue = Number(restaurant.nextKot || 1);
      restaurant.nextKot = kotValue + 1;
      restaurant.updatedAt = new Date().toISOString();
      const orderId = createId("order");
      const transactionId = `UPI-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const snapshots = cart.items.map((entry) => {
        const item = state.menuItems.find((candidate) => candidate.id === entry.itemId);
        const size = (item.sizes || []).find((option) => option.id === entry.sizeId);
        const addOns = (item.addOns || []).filter((option) => entry.addOnIds.includes(option.id));
        return { ...entry, name: item.name, icon: item.icon, imagePath: item.imagePath || item.imageUrl || null, basePrice: item.price, sizeName: size?.name || "Regular", addOns: addOns.map((option) => ({ id: option.id, name: option.name, price: option.price })), lineTotal: entry.unitPrice * entry.quantity };
      });
      const createdAt = new Date().toISOString();
      const estimatedMinutes = Math.max(...snapshots.map((item) => state.menuItems.find((candidate) => candidate.id === item.itemId)?.preparationMinutes || 5));
      const simulationReadyAt = new Date(new Date(createdAt).getTime() + estimatedMinutes * 5000).toISOString();
      cart.items.forEach((entry) => {
        const item = state.menuItems.find((candidate) => candidate.id === entry.itemId);
        item.availableQuantity = Math.max(0, Number(item.availableQuantity ?? item.stock ?? 0) - entry.quantity);
        if (item.availableQuantity === 0) {
          item.availabilityStatus = "sold-out";
          item.availabilityNote = "Sold out through customer orders";
        }
        item.updatedAt = createdAt;
      });
      const kotNumber = String(kotValue).padStart(4, "0");
      const kotSnapshot = { number: kotNumber, tableNumber: checkoutDraft.tableNumber, serviceMode: checkoutDraft.serviceMode, orderType: checkoutDraft.orderType, items: JSON.parse(JSON.stringify(snapshots)), instructions: checkoutDraft.orderNotes, generatedAt: createdAt };
      state.orders.push({ id: orderId, restaurantId, customerId: session.id, customerName: checkoutDraft.customerName, mobile: checkoutDraft.mobile, orderType: checkoutDraft.orderType, serviceMode: checkoutDraft.serviceMode, tableNumber: checkoutDraft.tableNumber, orderNotes: checkoutDraft.orderNotes, token: String(tokenValue).padStart(3, "0"), kotNumber, kotStatus: "new", kotSnapshot, status: "payment_confirmed", paymentStatus: "success", paymentId: payment?.id || null, transactionId, items: snapshots, paidSnapshot: { items: JSON.parse(JSON.stringify(snapshots)), subtotal: totals.subtotal, tax: totals.tax, taxPercent: totals.taxPercent, total: totals.total, capturedAt: createdAt }, subtotal: totals.subtotal, tax: totals.tax, taxPercent: totals.taxPercent, total: totals.total, estimatedMinutes, simulationReadyAt, simulationMode: "demo-preparation", createdAt, updatedAt: createdAt, timeline: [{ type: "order_created", label: "Paid order created", at: createdAt, actor: "customer" }, { type: "payment_confirmed", label: "Payment confirmed", at: createdAt, actor: "system" }, { type: "kot_generated", label: `KOT #${kotNumber} generated`, at: createdAt, actor: "system" }, { type: "token_allocated", label: `Token #${String(tokenValue).padStart(3, "0")} allocated`, at: createdAt, actor: "system" }] });
      state.alerts.push({ id: createId("alert"), restaurantId, type: "new_order", severity: "info", orderId, message: `New paid order #${String(tokenValue).padStart(3, "0")}`, dismissed: false, createdAt });
      if (!payment) {
        payment = { id: createId("payment"), attemptId: checkoutDraft.attemptId, restaurantId, customerId: session.id, cartId: cart.id, amount: totals.total, method: methodData.method, upiId: methodData.upiId, createdAt };
        state.payments.push(payment);
      }
      state.orders.find((order) => order.id === orderId).paymentId = payment.id;
      state.orders.find((order) => order.id === orderId).inventoryModel = "availability";
      payment.status = "success";
      payment.orderId = orderId;
      payment.transactionId = transactionId;
      payment.updatedAt = createdAt;
      const activeSession = state.activeSession;
      if (activeSession?.id === session.id) activeSession.lastOrderId = orderId;
      cart.items = [];
      cart.updatedAt = createdAt;
      createdOrderId = orderId;
    }, "payment-success-order-created");
    return createdOrderId;
  }

  function renderConfirmation(orderId) {
    const state = global.AutoCodeState.read();
    const order = state.orders.find((candidate) => candidate.id === orderId && candidate.customerId === session.id);
    const container = document.querySelector("[data-confirmation-content]");
    if (!order) {
      container.innerHTML = `<div class="app-card p-10 text-center"><h1 class="text-2xl font-black text-red-900">Order confirmation unavailable</h1><a href="#/menu" class="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-bold text-white">Return to menu</a></div>`;
      return;
    }
    container.innerHTML = `<article class="app-card overflow-hidden"><div class="bg-green-700 p-7 text-center text-white sm:p-10"><p class="text-sm font-extrabold uppercase tracking-[0.16em] text-green-100">Payment successful</p><h1 class="mt-3 text-3xl font-black sm:text-4xl">Your order is confirmed</h1><p class="mt-5 text-sm font-bold text-green-100">ORDER TOKEN</p><p class="mt-1 text-7xl font-black tracking-tight">#${escapeHtml(order.token)}</p></div><div class="p-6 sm:p-8"><div class="grid gap-4 sm:grid-cols-3"><div class="rounded-xl bg-slate-100 p-4"><p class="text-xs font-bold text-slate-500">Order type</p><p class="mt-1 font-extrabold capitalize text-slate-900">${escapeHtml(order.orderType)}${order.tableNumber ? ` · ${escapeHtml(order.tableNumber)}` : ""}</p></div><div class="rounded-xl bg-slate-100 p-4"><p class="text-xs font-bold text-slate-500">Amount paid</p><p class="mt-1 font-extrabold text-slate-900">${formatter.format(order.total)}</p></div><div class="rounded-xl bg-slate-100 p-4"><p class="text-xs font-bold text-slate-500">Estimated time</p><p class="mt-1 font-extrabold text-slate-900">${order.estimatedMinutes} minutes</p></div></div><div class="mt-7"><h2 class="text-lg font-black text-slate-950">Order items</h2>${order.items.map((item) => `<div class="mt-3 flex justify-between gap-4 border-b border-slate-100 pb-3"><p class="font-bold text-slate-700">${item.quantity} × ${escapeHtml(item.name)}</p><p class="font-bold text-slate-900">${formatter.format(item.lineTotal)}</p></div>`).join("")}</div><div class="mt-7 rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-950"><strong>Transaction:</strong> ${escapeHtml(order.transactionId)}<br><strong>Status:</strong> Payment confirmed</div><div class="mt-7 flex flex-wrap gap-3"><a href="#/orders" class="rounded-xl bg-blue-700 px-5 py-3 font-extrabold text-white">Track order</a><a href="#/menu" class="rounded-xl border border-slate-300 px-5 py-3 font-extrabold text-slate-800">Order more</a></div></div></article>`;
  }

  function resolveOutcome(outcome, methodData) {
    const button = document.querySelector("[data-confirm-payment]");
    button.disabled = true;
    try {
      if (outcome === "pending") {
        recordNonSuccess("pending", methodData);
        setPaymentFeedback("The simulated UPI provider has not completed this payment yet.", "pending");
        document.querySelector("[data-payment-fields]").hidden = true;
        document.querySelector("[data-pending-resolution]").hidden = false;
        return;
      }
      if (outcome === "failure") {
        recordNonSuccess("failure", methodData);
        setPaymentFeedback("Payment failed. Your order and inventory allocation are unchanged. You can retry.", "error");
        checkoutDraft.attemptId = createId("attempt");
        document.querySelector("[data-payment-fields]").hidden = false;
        document.querySelector("[data-pending-resolution]").hidden = true;
        button.disabled = false;
        return;
      }
      if (outcome === "cancelled") {
        recordNonSuccess("cancelled", methodData);
        setCheckoutFeedback("Payment was cancelled. Your order has been preserved.", true);
        global.AutoCodeApp.closeDialog(paymentDialog, "cancelled");
        return;
      }
      const orderId = createSuccessfulOrder(methodData);
      setPaymentFeedback("Payment verified. Creating your token…", "success");
      renderConfirmation(orderId);
      global.setTimeout(() => { global.AutoCodeApp.closeDialog(paymentDialog, "success"); global.location.hash = "/game"; renderCheckout(); }, 250);
    } catch (error) {
      setPaymentFeedback(error.message, "error");
      button.disabled = false;
    }
  }

  checkoutForm.addEventListener("change", (event) => { if (event.target.name === "orderType") toggleOrderType(); });
  checkoutForm.addEventListener("submit", (event) => { event.preventDefault(); try { openPayment(); } catch (error) { setCheckoutFeedback(error.message, true); } });
  paymentForm.addEventListener("change", (event) => { if (event.target.name === "upiMethod") document.querySelector("[data-upi-id-field]").hidden = event.target.value !== "upi-id"; });
  paymentForm.addEventListener("submit", (event) => { event.preventDefault(); try { const methodData = paymentMethodData(); resolveOutcome(methodData.outcome, methodData); } catch (error) { setPaymentFeedback(error.message, "error"); } });
  document.querySelector("[data-close-payment]").addEventListener("click", () => {
    if (checkoutDraft) {
      const data = new FormData(paymentForm);
      recordNonSuccess("cancelled", { method: String(data.get("upiMethod") || "mock-app"), upiId: String(data.get("upiId") || "").trim() || null });
    }
    global.AutoCodeApp.closeDialog(paymentDialog, "cancelled");
    setCheckoutFeedback("Payment was cancelled. Your order has been preserved.", true);
  });
  document.querySelectorAll("[data-resolve-payment]").forEach((button) => button.addEventListener("click", () => { const data = paymentMethodData(); resolveOutcome(button.dataset.resolvePayment, data); }));
  global.addEventListener("hashchange", () => { if (global.location.hash === "#/checkout") renderCheckout(); if (global.location.hash === "#/confirmation") { const state = global.AutoCodeState.read(); renderConfirmation(state.activeSession?.lastOrderId); } });
  global.AutoCodeState.subscribe((state) => { if (state) renderCheckout(); });
  prefillCustomer();
  toggleOrderType();
  renderCheckout();
  const initialState = global.AutoCodeState.read();
  if (initialState.activeSession?.lastOrderId) renderConfirmation(initialState.activeSession.lastOrderId);
})(window);
