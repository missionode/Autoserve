(function initializeHistoryAndReports(global) {
  "use strict";

  const session = global.AutoCodeApp.getSession();
  if (!session || !["admin", "staff"].includes(session.role)) return;

  const restaurantId = session.restaurantId || "rest_autoserve_demo";
  const cancellationDialog = document.querySelector("#cancellation-dialog");
  const cancellationForm = document.querySelector("[data-cancellation-form]");
  const receiptDialog = document.querySelector("#receipt-dialog");
  const formatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
  const terminalStatuses = ["delivered", "cancelled"];
  const prePreparationStatuses = ["payment_confirmed", "order_received"];
  const RATE_WINDOW_MS = 5 * 60 * 1000;
  const RATE_LOCK_MS = 60 * 1000;
  const MAX_PIN_FAILURES = 3;
  let cancellationOrderId = null;
  let historyFilters = { search: "", status: "all", type: "all", time: "session", from: "", to: "", payment: "all", reward: "all", actor: "all" };

  if (!cancellationDialog || !cancellationForm || !receiptDialog) return;
  const delegatedTokenField = document.querySelector("[data-admin-pin-field]");
  delegatedTokenField.querySelector("span").textContent = "Daily administrative token";
  delegatedTokenField.querySelector("input").placeholder = "Enter today’s 6-digit token";
  delegatedTokenField.querySelector("input").minLength = 6;
  delegatedTokenField.querySelector("input").maxLength = 6;
  const cancellationHelp = [...document.querySelectorAll('[data-route="help"] article')].find((article) => article.querySelector("h2")?.textContent.trim() === "Cancellation");
  if (cancellationHelp) cancellationHelp.querySelector("p").textContent = "A reason is required. Staff must obtain today’s administrative token from an Admin. Tokens expire at local midnight and can be reloaded in Settings.";

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  const createId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = () => new Date().toISOString();
  const sessionStart = () => new Date(session.signedInAt || global.AutoCodeState.read().activeSession?.signedInAt || 0).getTime();
  const ordersFor = (state) => state.orders.filter((order) => order.restaurantId === restaurantId);
  const dateKey = (value) => new Date(value).toLocaleDateString("en-CA");
  const rewardIssued = (order) => order.items.some((item) => item.rewardSource === "tic_tac_toe");

  function setFeedback(message, error) {
    const target = document.querySelector("[data-cancellation-feedback]");
    target.hidden = false;
    target.textContent = message;
    target.className = `mt-5 rounded-xl px-4 py-3 text-sm font-bold ${error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`;
  }

  async function sha256(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await global.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function recentPinFailures(state) {
    const boundary = Date.now() - RATE_WINDOW_MS;
    return (state.authorizationAttempts || []).filter((attempt) => attempt.restaurantId === restaurantId && attempt.actorId === session.id && !attempt.success && new Date(attempt.at).getTime() >= boundary);
  }

  function pinLockRemaining(state) {
    const failures = recentPinFailures(state);
    if (failures.length < MAX_PIN_FAILURES) return 0;
    return Math.max(0, RATE_LOCK_MS - (Date.now() - new Date(failures.at(-1).at).getTime()));
  }

  function openCancellation(orderId) {
    const state = global.AutoCodeState.read();
    const order = ordersFor(state).find((entry) => entry.id === orderId);
    if (!order || !["payment_confirmed", "order_received", "preparing", "ready"].includes(order.status)) {
      global.alert("Only an active paid order can be cancelled.");
      return;
    }
    cancellationOrderId = order.id;
    cancellationForm.reset();
    document.querySelector("[data-cancellation-feedback]").hidden = true;
    document.querySelector("[data-cancel-token]").textContent = `#${order.token}`;
    const automatic = prePreparationStatuses.includes(order.status);
    const usesAvailability = order.inventoryModel === "availability";
    document.querySelector("[data-restoration-help]").textContent = usesAvailability ? "This KOT uses kitchen item availability. No numeric stock was deducted, so nothing will be restored." : automatic ? "Preparation has not started, so all purchased and complimentary inventory will be restored automatically." : "Preparation has started. Select only items that can safely return to stock.";
    document.querySelector("[data-restoration-items]").innerHTML = usesAvailability ? "" : order.items.map((item, index) => `<label class="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white p-3"><span class="text-sm font-bold text-slate-800">${item.quantity} × ${escapeHtml(item.name)}${item.rewardSource ? " · Complimentary" : ""}</span><span class="flex items-center gap-2 text-xs font-bold text-amber-900"><input type="checkbox" name="restoreItem" value="${index}" ${automatic ? "checked disabled" : ""}> Return to stock</span></label>`).join("");
    document.querySelector("[data-admin-pin-field]").hidden = session.role === "admin";
    cancellationForm.elements.adminPin.required = session.role === "staff";
    const lock = pinLockRemaining(state);
    document.querySelector("[data-pin-rate-note]").textContent = lock ? `Too many invalid attempts. Try again in ${Math.ceil(lock / 1000)} seconds.` : "Token attempts are audited and rate-limited. Ask an Admin for today’s token.";
    document.querySelector("[data-confirm-cancellation]").disabled = lock > 0;
    global.AutoCodeApp.openDialog(cancellationDialog);
  }

  function recordFailedToken(orderId, reason) {
    global.AutoCodeState.update((state) => {
      state.authorizationAttempts ||= [];
      const order = ordersFor(state).find((entry) => entry.id === orderId);
      const timestamp = now();
      state.authorizationAttempts.push({ id: createId("auth_attempt"), restaurantId, orderId, actorId: session.id, actorName: session.name, action: "order_cancellation", success: false, reason, at: timestamp });
      if (order && !terminalStatuses.includes(order.status)) order.timeline.push({ type: "cancellation_authorization_failed", label: "Cancellation authorization rejected", at: timestamp, actor: session.id, actorName: session.name });
    }, "cancellation-token-rejected");
  }

  function restoreInventory(state, order, selectedIndexes, automatic, timestamp) {
    if (order.inventoryRestoredAt) return [];
    if (order.inventoryModel === "availability") {
      order.inventoryRestoredAt = timestamp;
      order.restoredItems = [];
      return [];
    }
    const restored = [];
    order.items.forEach((line, index) => {
      if (!automatic && !selectedIndexes.includes(index)) return;
      const item = state.menuItems.find((candidate) => candidate.id === line.itemId && candidate.restaurantId === restaurantId);
      if (!item) return;
      const previous = item.stock;
      item.stock += Number(line.quantity || 0);
      if (item.stock > 0 && item.status === "sold-out") item.status = "published";
      item.updatedAt = timestamp;
      item.lastUpdatedBy = session.id;
      item.lastUpdatedByName = session.name;
      state.inventoryAudit.push({ id: createId("audit"), restaurantId, itemId: item.id, itemName: item.name, actorId: session.id, actorName: session.name, actorRole: session.role, changeType: "cancellation_restoration", previousQuantity: previous, newQuantity: item.stock, at: timestamp, note: `Restored from cancelled token #${order.token}` });
      restored.push({ itemId: item.id, name: item.name, quantity: Number(line.quantity || 0) });
    });
    order.inventoryRestoredAt = timestamp;
    order.restoredItems = restored;
    return restored;
  }

  async function submitCancellation() {
    const data = new FormData(cancellationForm);
    const reason = String(data.get("reason") || "").trim();
    if (!reason) { setFeedback("A cancellation reason is required.", true); return; }
    if (data.get("confirmed") !== "yes") { setFeedback("Confirm the cancellation and refund before continuing.", true); return; }
    const initial = global.AutoCodeState.read();
    const lock = pinLockRemaining(initial);
    if (lock > 0) { setFeedback(`Token authorization is rate-limited for ${Math.ceil(lock / 1000)} more seconds.`, true); return; }

    let authorizer = session.role === "admin" ? initial.users.find((user) => user.id === session.id) : null;
    if (session.role === "staff") {
      const restaurant = initial.restaurants.find((entry) => entry.id === restaurantId);
      const tokenExpired = new Date(restaurant?.administrativeTokenExpiresAt || 0).getTime() <= Date.now();
      const submittedToken = String(data.get("adminPin") || "").trim();
      authorizer = !tokenExpired && submittedToken === restaurant?.administrativeToken ? initial.users.find((user) => user.restaurantId === restaurantId && user.role === "admin" && user.active) : null;
      if (!authorizer) {
        recordFailedToken(cancellationOrderId, tokenExpired ? "expired_administrative_token" : "invalid_administrative_token");
        const failures = recentPinFailures(global.AutoCodeState.read()).length;
        setFeedback(tokenExpired ? "Today’s administrative token has expired. Ask an Admin to open Settings or reload the token." : failures >= MAX_PIN_FAILURES ? "Incorrect token. Further attempts are locked for 60 seconds." : `Incorrect administrative token. ${MAX_PIN_FAILURES - failures} attempt(s) remain before a temporary lock.`, true);
        if (failures >= MAX_PIN_FAILURES) document.querySelector("[data-confirm-cancellation]").disabled = true;
        return;
      }
    }

    try {
      const selectedIndexes = data.getAll("restoreItem").map(Number);
      global.AutoCodeState.update((state) => {
        const order = ordersFor(state).find((entry) => entry.id === cancellationOrderId);
        if (!order) throw new Error("This order no longer exists.");
        if (order.status === "cancelled" || order.refund?.status === "refunded") throw new Error("This order was already cancelled and refunded.");
        if (order.status === "delivered") throw new Error("A delivered order cannot be cancelled. An Admin may reopen it first.");
        const timestamp = now();
        const automatic = prePreparationStatuses.includes(order.status);
        const statusAtCancellation = order.status;
        const restored = restoreInventory(state, order, selectedIndexes, automatic, timestamp);
        order.status = "cancelled";
        order.updatedAt = timestamp;
        order.cancelledAt = timestamp;
        order.cancelledBy = session.id;
        order.cancellation = { id: createId("cancel"), reasonType: String(data.get("reasonType")), reason, requestedBy: session.id, requestedByName: session.name, authorizedBy: authorizer.id, authorizedByName: authorizer.name, statusAtCancellation, restoredItems: restored, at: timestamp };
        order.refund = { id: createId("refund"), status: "refunded", mode: "simulated", amount: order.total, transactionId: `SIM-REF-${Date.now()}`, createdAt: timestamp };
        order.paymentStatus = "refunded";
        const payment = state.payments.find((entry) => entry.id === order.paymentId);
        if (payment && payment.status !== "refunded") { payment.status = "refunded"; payment.refundId = order.refund.id; payment.refundedAt = timestamp; payment.updatedAt = timestamp; }
        state.authorizationAttempts ||= [];
        state.authorizationAttempts.push({ id: createId("auth_attempt"), restaurantId, orderId: order.id, actorId: session.id, actorName: session.name, authorizerId: authorizer.id, authorizerName: authorizer.name, action: "order_cancellation", success: true, at: timestamp });
        order.timeline.push({ type: "cancellation_requested", label: `Cancellation requested: ${reason}`, at: timestamp, actor: session.id, actorName: session.name });
        order.timeline.push({ type: "cancellation_authorized", label: `Cancellation authorized by ${authorizer.name}`, at: timestamp, actor: authorizer.id, actorName: authorizer.name });
        order.timeline.push({ type: "order_cancelled", label: `Order cancelled · simulated refund ${formatter.format(order.total)}`, at: timestamp, actor: session.id, actorName: session.name });
      }, "order-cancelled-refunded");
      global.AutoCodeApp.closeDialog(cancellationDialog, "cancelled");
      cancellationOrderId = null;
      renderAll();
    } catch (error) { setFeedback(error.message, true); }
  }

  function reopenOrder(orderId) {
    if (session.role !== "admin") return;
    const state = global.AutoCodeState.read();
    const order = ordersFor(state).find((entry) => entry.id === orderId);
    if (!order || order.status !== "delivered") { global.alert("Only a delivered order can be reopened."); return; }
    if (new Date(order.deliveredAt || order.updatedAt).getTime() < sessionStart()) { global.alert("Only an order delivered during the current operating session can be reopened."); return; }
    const reason = global.prompt(`Reason for reopening token #${order.token}:`, "Marked delivered by mistake")?.trim();
    if (!reason) return;
    if (!global.confirm(`Reopen token #${order.token} as Ready?`)) return;
    try {
      global.AutoCodeState.update((nextState) => {
        const current = ordersFor(nextState).find((entry) => entry.id === orderId);
        if (!current || current.status !== "delivered") throw new Error("This order changed in another tab.");
        const timestamp = now();
        current.status = "ready";
        current.updatedAt = timestamp;
        current.reopenedAt = timestamp;
        current.reopenedBy = session.id;
        current.reopenReason = reason;
        current.timeline.push({ type: "order_reopened", label: `Reopened as Ready: ${reason}`, at: timestamp, actor: session.id, actorName: session.name });
      }, "delivered-order-reopened");
      renderAll();
    } catch (error) { global.alert(error.message); }
  }

  function matchesDate(timestamp, from, to) {
    const key = dateKey(timestamp);
    return (!from || key >= from) && (!to || key <= to);
  }

  function historyOrders(state) {
    const today = dateKey(new Date());
    return ordersFor(state).filter((order) => terminalStatuses.includes(order.status)).filter((order) => {
      const completedAt = order.cancelledAt || order.deliveredAt || order.updatedAt;
      const text = `${order.token} ${order.id} ${order.customerName || ""} ${order.mobile || ""}`.toLowerCase();
      const actors = (order.timeline || []).map((event) => event.actorName || "").join(" ").toLowerCase();
      if (historyFilters.search && !`${text} ${actors}`.includes(historyFilters.search)) return false;
      if (historyFilters.status !== "all" && order.status !== historyFilters.status) return false;
      if (historyFilters.type !== "all" && order.orderType !== historyFilters.type) return false;
      if (historyFilters.time === "session" && new Date(completedAt).getTime() < sessionStart()) return false;
      if (historyFilters.time === "today" && dateKey(completedAt) !== today) return false;
      if (session.role === "admin" && !matchesDate(completedAt, historyFilters.from, historyFilters.to)) return false;
      if (historyFilters.payment !== "all" && order.paymentStatus !== historyFilters.payment) return false;
      if (historyFilters.reward === "yes" && !rewardIssued(order)) return false;
      if (historyFilters.reward === "no" && rewardIssued(order)) return false;
      if (historyFilters.actor !== "all" && !(order.timeline || []).some((event) => event.actor === historyFilters.actor)) return false;
      return true;
    }).sort((a, b) => new Date(b.cancelledAt || b.deliveredAt || b.updatedAt) - new Date(a.cancelledAt || a.deliveredAt || a.updatedAt));
  }

  function renderHistory() {
    const state = global.AutoCodeState.read();
    const orders = historyOrders(state);
    const actorSelect = document.querySelector("[data-history-actor]");
    if (actorSelect) {
      const selected = historyFilters.actor;
      const actors = state.users.filter((user) => user.restaurantId === restaurantId && ["admin", "staff"].includes(user.role));
      actorSelect.innerHTML = '<option value="all">All acting staff</option>' + actors.map((user) => `<option value="${escapeHtml(user.id)}">${escapeHtml(user.name)}</option>`).join("");
      actorSelect.value = selected;
    }
    document.querySelector("[data-history-scope]").textContent = session.role === "admin" ? "Review retained receipts, refunds, rewards, and activity." : "Completed and cancelled orders from your current signed-in session.";
    document.querySelector("[data-history-empty]").hidden = orders.length > 0;
    document.querySelector("[data-history-list]").innerHTML = orders.map((order) => `<article class="app-card p-5"><div class="flex items-start justify-between gap-4"><div><div class="flex items-center gap-2"><h2 class="text-2xl font-black text-slate-950">#${escapeHtml(order.token)}</h2><span class="rounded-full px-2.5 py-1 text-xs font-extrabold ${order.status === "cancelled" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}">${order.status === "cancelled" ? "Cancelled" : "Delivered"}</span>${rewardIssued(order) ? '<span class="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-extrabold text-purple-800">Reward</span>' : ""}</div><p class="mt-2 text-sm font-bold text-slate-700">${escapeHtml(order.customerName || "Guest")} · ${escapeHtml(order.orderType)}</p><p class="mt-1 text-xs text-slate-500">${new Date(order.cancelledAt || order.deliveredAt || order.updatedAt).toLocaleString("en-IN")} · ${escapeHtml(order.id)}</p></div><p class="text-right font-black text-slate-900">${formatter.format(order.total)}<br><span class="text-xs font-bold ${order.paymentStatus === "refunded" ? "text-red-700" : "text-green-700"}">${escapeHtml(order.paymentStatus)}</span></p></div>${order.cancellation ? `<p class="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-900"><strong>Reason:</strong> ${escapeHtml(order.cancellation.reason)}<br><strong>Authorized by:</strong> ${escapeHtml(order.cancellation.authorizedByName)}</p>` : ""}<div class="mt-4 flex flex-wrap gap-2"><button data-view-receipt="${escapeHtml(order.id)}" class="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white">View receipt</button>${session.role === "admin" && order.status === "delivered" ? `<button data-reopen-order="${escapeHtml(order.id)}" class="rounded-lg border border-amber-300 px-4 py-2 text-sm font-bold text-amber-800">Reopen as Ready</button>` : ""}</div></article>`).join("");
  }

  function openReceipt(orderId) {
    const state = global.AutoCodeState.read();
    const order = ordersFor(state).find((entry) => entry.id === orderId);
    if (!order) return;
    const payment = state.payments.find((entry) => entry.id === order.paymentId);
    const snapshot = order.paidSnapshot || { items: order.items.filter((item) => !item.rewardSource), subtotal: order.subtotal, tax: order.tax, taxPercent: order.taxPercent, total: order.total, capturedAt: order.createdAt };
    const receiptItems = [...snapshot.items, ...order.items.filter((item) => item.rewardSource)];
    document.querySelector("[data-receipt-token]").textContent = `#${order.token}`;
    const content = document.querySelector("[data-receipt-content]");
    content.innerHTML = `<div class="grid gap-3 rounded-xl bg-slate-100 p-4 sm:grid-cols-2"><div><p class="text-xs font-bold text-slate-500">Order ID</p><p class="mt-1 break-all text-sm font-extrabold">${escapeHtml(order.id)}</p></div><div><p class="text-xs font-bold text-slate-500">Paid</p><p class="mt-1 text-sm font-extrabold">${new Date(snapshot.capturedAt).toLocaleString("en-IN")}</p></div><div><p class="text-xs font-bold text-slate-500">Transaction</p><p class="mt-1 break-all text-sm font-extrabold">${escapeHtml(order.transactionId || payment?.transactionId || "—")}</p></div><div><p class="text-xs font-bold text-slate-500">Payment / order</p><p class="mt-1 text-sm font-extrabold capitalize">${escapeHtml(order.paymentStatus)} · ${escapeHtml(order.status)}</p></div></div><div class="mt-5 divide-y divide-slate-200">${receiptItems.map((item) => `<div class="flex justify-between gap-4 py-4"><div><p class="font-extrabold text-slate-900">${item.quantity} × ${escapeHtml(item.name)}${item.rewardSource ? ' <span class="text-purple-700">· Complimentary</span>' : ""}</p><p class="mt-1 text-xs text-slate-500">${escapeHtml([item.sizeName, item.spiceLevel, ...(item.addOns || []).map((entry) => entry.name)].filter(Boolean).join(" · "))}</p></div><p class="font-bold">${formatter.format(item.lineTotal || 0)}</p></div>`).join("")}</div><dl class="mt-5 space-y-2 border-t-2 border-slate-900 pt-4"><div class="flex justify-between"><dt>Subtotal</dt><dd class="font-bold">${formatter.format(snapshot.subtotal)}</dd></div><div class="flex justify-between"><dt>Tax (${snapshot.taxPercent}%)</dt><dd class="font-bold">${formatter.format(snapshot.tax)}</dd></div><div class="flex justify-between text-lg font-black"><dt>Total paid</dt><dd>${formatter.format(snapshot.total)}</dd></div>${order.refund ? `<div class="flex justify-between font-bold text-red-700"><dt>Simulated refund</dt><dd>${formatter.format(order.refund.amount)}</dd></div>` : ""}</dl>${order.cancellation ? `<div class="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-900"><strong>Cancellation:</strong> ${escapeHtml(order.cancellation.reason)}<br><strong>Refund ID:</strong> ${escapeHtml(order.refund?.transactionId || "—")}</div>` : ""}<section class="mt-6"><h3 class="font-black text-slate-950">Activity snapshot</h3><ol class="mt-3 space-y-2">${(order.timeline || []).map((event) => `<li class="border-l-2 border-slate-200 pl-3 text-sm"><strong>${escapeHtml(event.label)}</strong><br><span class="text-xs text-slate-500">${new Date(event.at).toLocaleString("en-IN")} · ${escapeHtml(event.actorName || event.actor)}</span></li>`).join("")}</ol></section>`;
    global.AutoCodeApp.openDialog(receiptDialog);
  }

  function reportWindow(timestamp, range, from, to) {
    const time = new Date(timestamp).getTime();
    if (range === "session") return time >= sessionStart();
    if (range === "today") return dateKey(timestamp) === dateKey(new Date());
    if (range === "custom") return matchesDate(timestamp, from, to);
    return true;
  }

  function metricCard(label, value, tone) {
    return `<article class="app-card p-5"><p class="text-sm font-bold text-slate-500">${label}</p><p class="mt-2 text-3xl font-black ${tone || "text-slate-950"}">${value}</p></article>`;
  }

  function renderReports() {
    if (session.role !== "admin") return;
    const state = global.AutoCodeState.read();
    const range = document.querySelector("[data-report-range]").value;
    const from = document.querySelector("[data-report-from]").value;
    const to = document.querySelector("[data-report-to]").value;
    const orders = ordersFor(state).filter((order) => reportWindow(order.createdAt, range, from, to));
    const payments = state.payments.filter((payment) => payment.restaurantId === restaurantId && reportWindow(payment.createdAt, range, from, to));
    const delivered = orders.filter((order) => order.status === "delivered");
    const cancelled = orders.filter((order) => order.status === "cancelled");
    const paid = orders.filter((order) => ["success", "refunded"].includes(order.paymentStatus));
    const realized = paid.filter((order) => order.status !== "cancelled");
    const average = realized.length ? realized.reduce((sum, order) => sum + order.total, 0) / realized.length : 0;
    const preparation = delivered.map((order) => (new Date(order.readyAt || order.deliveredAt) - new Date(order.preparingAt || order.createdAt)) / 60000).filter((value) => value >= 0);
    const waiting = delivered.map((order) => (new Date(order.deliveredAt) - new Date(order.readyAt || order.deliveredAt)) / 60000).filter((value) => value >= 0);
    const delayed = orders.filter((order) => order.readyAt && (new Date(order.readyAt) - new Date(order.createdAt)) / 60000 > Number(order.estimatedMinutes || 10));
    document.querySelector("[data-report-metrics]").innerHTML = [
      metricCard("Total sales", formatter.format(realized.reduce((sum, order) => sum + order.total, 0)), "text-blue-800"), metricCard("Paid orders", String(paid.length)),
      metricCard("Delivered", String(delivered.length), "text-green-700"), metricCard("Cancelled", String(cancelled.length), "text-red-700"),
      metricCard("Average order", formatter.format(average)), metricCard("Average preparation", preparation.length ? `${Math.round(preparation.reduce((a, b) => a + b, 0) / preparation.length)} min` : "—"),
      metricCard("Ready-to-delivery", waiting.length ? `${Math.round(waiting.reduce((a, b) => a + b, 0) / waiting.length)} min` : "—"), metricCard("Delayed orders", String(delayed.length), "text-amber-700"),
      metricCard("Rewards issued", String(orders.filter(rewardIssued).length), "text-purple-700")
    ].join("");

    const itemCounts = new Map();
    orders.forEach((order) => order.items.filter((item) => !item.rewardSource).forEach((item) => itemCounts.set(item.name, (itemCounts.get(item.name) || 0) + item.quantity)));
    const topItems = [...itemCounts].sort((a, b) => b[1] - a[1]).slice(0, 8);
    document.querySelector("[data-report-items]").innerHTML = topItems.length ? topItems.map(([name, count], index) => `<div class="flex justify-between border-b border-slate-100 py-3"><span class="font-bold">${index + 1}. ${escapeHtml(name)}</span><span>${count}</span></div>`).join("") : '<p class="text-sm text-slate-500">No item sales in this range.</p>';

    const staff = new Map();
    orders.forEach((order) => (order.timeline || []).filter((event) => ["order_received", "preparing", "ready", "delivered"].includes(event.type)).forEach((event) => { const name = event.actorName || event.actor; staff.set(name, (staff.get(name) || 0) + 1); }));
    document.querySelector("[data-report-staff]").innerHTML = staff.size ? [...staff].sort((a, b) => b[1] - a[1]).map(([name, count]) => `<div class="flex justify-between border-b border-slate-100 py-3"><span class="font-bold">${escapeHtml(name)}</span><span>${count} actions</span></div>`).join("") : '<p class="text-sm text-slate-500">No fulfillment activity in this range.</p>';

    const paymentStatuses = ["success", "failure", "cancelled", "pending", "refunded"];
    document.querySelector("[data-report-payments]").innerHTML = paymentStatuses.map((status) => `<div class="flex justify-between border-b border-slate-100 py-3"><span class="font-bold capitalize">${status}</span><span>${payments.filter((payment) => payment.status === status).length}</span></div>`).join("");
    const stock = state.menuItems.filter((item) => item.restaurantId === restaurantId && ["limited", "unavailable", "sold-out"].includes(item.availabilityStatus));
    document.querySelector("[data-report-stock]").innerHTML = stock.length ? stock.map((item) => `<div class="flex justify-between border-b border-slate-100 py-3"><span class="font-bold">${escapeHtml(item.name)}</span><span class="${item.availabilityStatus === "limited" ? "text-amber-700" : "text-red-700"}">${item.availabilityStatus === "limited" ? "Limited" : item.availabilityStatus === "sold-out" ? "Sold out today" : "Unavailable"}</span></div>`).join("") : '<p class="text-sm text-slate-500">All published kitchen items are available.</p>';
  }

  function renderAll() { renderHistory(); renderReports(); }

  document.addEventListener("click", (event) => {
    const cancel = event.target.closest("[data-request-cancellation]");
    const reopen = event.target.closest("[data-reopen-order]");
    const receipt = event.target.closest("[data-view-receipt]");
    if (cancel) openCancellation(cancel.dataset.requestCancellation);
    if (reopen) reopenOrder(reopen.dataset.reopenOrder);
    if (receipt) openReceipt(receipt.dataset.viewReceipt);
  });
  document.querySelector("[data-close-cancellation]").addEventListener("click", () => global.AutoCodeApp.closeDialog(cancellationDialog, "cancel"));
  document.querySelector("[data-close-receipt]").addEventListener("click", () => global.AutoCodeApp.closeDialog(receiptDialog, "close"));
  cancellationForm.addEventListener("submit", (event) => { event.preventDefault(); submitCancellation().catch((error) => setFeedback(error.message, true)); });
  const bindHistory = (selector, key, transform) => document.querySelector(selector)?.addEventListener("input", (event) => { historyFilters[key] = transform ? transform(event.target.value) : event.target.value; renderHistory(); });
  bindHistory("[data-history-search]", "search", (value) => value.trim().toLowerCase());
  bindHistory("[data-history-status]", "status"); bindHistory("[data-history-type]", "type"); bindHistory("[data-history-time]", "time"); bindHistory("[data-history-from]", "from"); bindHistory("[data-history-to]", "to"); bindHistory("[data-history-payment]", "payment"); bindHistory("[data-history-reward]", "reward");
  bindHistory("[data-history-actor]", "actor");
  document.querySelector("[data-report-range]")?.addEventListener("change", (event) => { const custom = event.target.value === "custom"; document.querySelector("[data-report-from]").hidden = !custom; document.querySelector("[data-report-to]").hidden = !custom; renderReports(); });
  document.querySelector("[data-report-from]")?.addEventListener("input", renderReports);
  document.querySelector("[data-report-to]")?.addEventListener("input", renderReports);
  global.AutoCodeState.subscribe((state) => { if (state) renderAll(); });
  renderAll();
})(window);
