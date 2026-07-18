(function initializeRestaurantOperations(global) {
  "use strict";

  const session = global.AutoCodeApp.getSession();
  if (!session || !["admin", "staff"].includes(session.role)) return;

  const restaurantId = session.restaurantId || "rest_autoserve_demo";
  const orderDialog = document.querySelector("#order-dialog");
  const activeStatuses = ["payment_confirmed", "order_received", "preparing", "ready"];
  const statusDetails = {
    payment_confirmed: { label: "Payment confirmed", action: "Accept order", next: "order_received", tone: "blue" },
    order_received: { label: "Order received", action: "Start preparing", next: "preparing", tone: "indigo" },
    preparing: { label: "Preparing", action: "Mark ready", next: "ready", tone: "amber" },
    ready: { label: "Ready", action: "Mark delivered", next: "delivered", tone: "green" },
    delivered: { label: "Delivered", action: null, next: null, tone: "slate" },
    cancelled: { label: "Cancelled", action: null, next: null, tone: "red" }
  };
  const formatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
  let orderFilter = "active";
  let selectedOrderId = null;

  if (!orderDialog) return;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  const minutesSince = (timestamp) => Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000));
  const todayKey = (timestamp) => new Date(timestamp).toLocaleDateString("en-CA");

  function restaurantOrders(state) {
    return state.orders.filter((order) => order.restaurantId === restaurantId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  function urgencyFor(order) {
    if (order.status === "ready") return { label: "Ready", classes: "bg-green-100 text-green-800 border-green-200" };
    const elapsed = minutesSince(order.createdAt);
    const estimate = Number(order.estimatedMinutes || 10);
    if (elapsed > estimate) return { label: "Delayed", classes: "bg-red-100 text-red-800 border-red-200" };
    if (elapsed >= Math.max(1, estimate - 3)) return { label: "Due soon", classes: "bg-amber-100 text-amber-900 border-amber-200" };
    return { label: "On time", classes: "bg-slate-100 text-slate-700 border-slate-200" };
  }

  function orderCard(order, compact) {
    const status = statusDetails[order.status] || { label: order.status, action: null };
    const urgency = urgencyFor(order);
    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const reward = order.items.some((item) => item.rewardSource === "tic_tac_toe");
    return `<article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${order.issue?.active ? "ring-2 ring-amber-400" : ""}">
      <div class="flex items-start justify-between gap-4"><div><div class="flex flex-wrap items-center gap-2"><span class="text-2xl font-black text-slate-950">KOT #${escapeHtml(order.kotNumber || order.token)}</span><span class="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-extrabold text-blue-800">Token #${escapeHtml(order.token)}</span><span class="rounded-full border px-2.5 py-1 text-xs font-extrabold ${urgency.classes}">${urgency.label}</span>${order.issue?.active ? '<span class="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-extrabold text-amber-900">Attention</span>' : ""}${reward ? '<span class="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-extrabold text-purple-800">Game reward</span>' : ""}</div><p class="mt-1 text-sm font-bold text-blue-700">${escapeHtml(status.label)} · ${escapeHtml(order.serviceMode === "table-service" ? "Table service" : "Self-service")}</p></div><p class="text-right text-xs font-bold text-slate-500">${minutesSince(order.createdAt)} min<br><span class="font-normal">elapsed</span></p></div>
      <div class="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600"><span class="font-bold capitalize">${escapeHtml(order.orderType)}</span>${order.tableNumber ? `<span>Table ${escapeHtml(order.tableNumber)}</span>` : ""}<span>${itemCount} item${itemCount === 1 ? "" : "s"}</span><span>${formatter.format(order.total)}</span></div>
      ${compact ? "" : `<ul class="mt-4 space-y-1 text-sm text-slate-700">${order.items.slice(0, 3).map((item) => `<li>${item.quantity} × ${escapeHtml(item.name)}${item.rewardSource ? " · Complimentary" : ""}</li>`).join("")}${order.items.length > 3 ? `<li class="text-slate-500">+${order.items.length - 3} more line items</li>` : ""}</ul>`}
      <div class="mt-5 flex flex-wrap gap-2"><button type="button" data-open-order="${escapeHtml(order.id)}" class="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-extrabold text-slate-800 hover:border-blue-700">View details</button>${status.action ? `<button type="button" data-order-action="${escapeHtml(order.id)}" class="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-blue-800">${escapeHtml(status.action)}</button>` : ""}${activeStatuses.includes(order.status) ? `<button type="button" data-request-cancellation="${escapeHtml(order.id)}" class="rounded-xl border border-red-300 px-4 py-2.5 text-sm font-extrabold text-red-700">Cancel</button>` : ""}${session.role === "admin" && order.status === "delivered" ? `<button type="button" data-reopen-order="${escapeHtml(order.id)}" class="rounded-xl border border-amber-300 px-4 py-2.5 text-sm font-extrabold text-amber-800">Reopen</button>` : ""}</div>
    </article>`;
  }

  function renderMetrics(state, orders) {
    const today = todayKey(new Date());
    const newCount = orders.filter((order) => ["payment_confirmed", "order_received"].includes(order.status)).length;
    const preparing = orders.filter((order) => order.status === "preparing").length;
    const ready = orders.filter((order) => order.status === "ready").length;
    const deliveredToday = orders.filter((order) => order.status === "delivered" && todayKey(order.deliveredAt || order.updatedAt) === today);
    const completedDurations = deliveredToday.map((order) => Math.max(0, Math.round((new Date(order.readyAt || order.deliveredAt).getTime() - new Date(order.preparingAt || order.createdAt).getTime()) / 60000))).filter(Number.isFinite);
    const active = orders.filter((order) => activeStatuses.includes(order.status));
    const delayed = active.filter((order) => order.status !== "ready" && minutesSince(order.createdAt) > Number(order.estimatedMinutes || 10));
    const items = state.menuItems.filter((item) => item.restaurantId === restaurantId);
    document.querySelector("[data-metric-new]").textContent = String(newCount);
    document.querySelector("[data-metric-preparing]").textContent = String(preparing);
    document.querySelector("[data-metric-ready]").textContent = String(ready);
    document.querySelector("[data-metric-delivered]").textContent = String(deliveredToday.length);
    document.querySelector("[data-metric-average]").textContent = completedDurations.length ? `${Math.round(completedDurations.reduce((sum, value) => sum + value, 0) / completedDurations.length)} min` : "—";
    document.querySelector("[data-metric-delayed]").textContent = String(delayed.length);
    document.querySelectorAll("[data-low-stock-count]").forEach((element) => { element.textContent = String(items.filter((item) => ["unavailable", "sold-out"].includes(item.availabilityStatus) || item.emergencyCutoff).length); });
    document.querySelector("[data-metric-soldout]").textContent = String(items.filter((item) => item.availabilityStatus === "sold-out").length);
  }

  function derivedAlerts(state, orders) {
    const stored = state.alerts.filter((alert) => alert.restaurantId === restaurantId && !alert.dismissed);
    const delayed = orders.filter((order) => activeStatuses.includes(order.status) && order.status !== "ready" && minutesSince(order.createdAt) > Number(order.estimatedMinutes || 10)).map((order) => ({ id: `delayed_${order.id}`, type: "delayed", severity: "warning", message: `Token #${order.token} is delayed`, orderId: order.id, derived: true }));
    const restaurant = state.restaurants.find((item) => item.id === restaurantId);
    const low = state.menuItems.filter((item) => item.restaurantId === restaurantId && ["limited", "unavailable", "sold-out"].includes(item.availabilityStatus)).map((item) => {
      const reward = [restaurant?.primaryRewardItemId, restaurant?.fallbackRewardItemId].includes(item.id);
      const label = item.availabilityStatus === "limited" ? "has limited availability" : item.availabilityStatus === "sold-out" ? "is sold out today" : "is temporarily unavailable";
      return { id: `availability_${item.id}`, type: reward ? "reward_unavailable" : "item_unavailable", severity: item.availabilityStatus === "limited" ? "warning" : "error", message: `${reward ? "Reward item: " : ""}${item.name} ${label}`, derived: true };
    });
    return [...stored, ...delayed, ...low];
  }

  function renderAlerts(state, orders) {
    const alerts = derivedAlerts(state, orders);
    const list = document.querySelector("[data-alert-list]");
    document.querySelector("[data-alert-count]").textContent = String(alerts.length);
    document.querySelector("[data-alert-empty]").hidden = alerts.length > 0;
    list.innerHTML = alerts.map((alert) => `<div class="rounded-xl ${alert.severity === "error" ? "bg-red-50 text-red-900" : alert.severity === "warning" ? "bg-amber-50 text-amber-950" : "bg-blue-50 text-blue-950"} p-3"><p class="text-sm font-bold">${escapeHtml(alert.message)}</p><div class="mt-2 flex gap-3">${alert.orderId ? `<button data-open-order="${escapeHtml(alert.orderId)}" class="text-xs font-extrabold underline">View order</button>` : ""}${!alert.derived ? `<button data-dismiss-alert="${escapeHtml(alert.id)}" class="text-xs font-extrabold underline">Dismiss</button>` : ""}</div></div>`).join("");
  }

  function renderOperations() {
    const state = global.AutoCodeState.read();
    const orders = restaurantOrders(state);
    const active = orders.filter((order) => activeStatuses.includes(order.status));
    const dashboard = document.querySelector("[data-dashboard-queue]");
    dashboard.innerHTML = active.slice(0, 4).map((order) => orderCard(order, true)).join("");
    document.querySelector("[data-dashboard-empty]").hidden = active.length > 0;
    const today = todayKey(new Date());
    const filtered = orderFilter === "active" ? active : orders.filter((order) => ["delivered", "cancelled"].includes(order.status) && todayKey(order.updatedAt) === today).reverse();
    const list = document.querySelector("[data-orders-list]");
    list.innerHTML = filtered.map((order) => orderCard(order, false)).join("");
    document.querySelector("[data-orders-empty]").hidden = filtered.length > 0;
    renderMetrics(state, orders);
    renderAlerts(state, orders);
  }

  function nextStatus(order) {
    return statusDetails[order.status]?.next || null;
  }

  function transitionOrder(orderId) {
    try {
      global.AutoCodeState.update((state) => {
        const order = state.orders.find((candidate) => candidate.id === orderId && candidate.restaurantId === restaurantId);
        if (!order) throw new Error("This order no longer exists.");
        const next = nextStatus(order);
        if (!next) throw new Error("This order has no permitted next action.");
        if (next === "ready") {
          const rewardMissing = order.items.some((item) => item.rewardSource === "tic_tac_toe" && item.fulfillmentExcluded);
          if (rewardMissing) throw new Error("Confirm the complimentary reward before marking this order Ready.");
          if (!global.confirm("Confirm that all purchased and complimentary items are prepared and packaged.")) return;
        }
        if (next === "delivered" && !global.confirm(`Confirm delivery of token #${order.token}.`)) return;
        const timestamp = new Date().toISOString();
        const labels = { order_received: "Order accepted", preparing: "Preparation started", ready: "Marked ready", delivered: "Marked delivered" };
        order.status = next;
        order.updatedAt = timestamp;
        if (next === "order_received") order.acceptedAt = timestamp;
        if (next === "preparing") order.preparingAt = timestamp;
        if (next === "ready") order.readyAt = timestamp;
        if (next === "delivered") order.deliveredAt = timestamp;
        order.kotStatus = next === "order_received" ? "accepted" : next === "delivered" ? "served" : next;
        order.timeline.push({ type: next, label: labels[next], at: timestamp, actor: session.id, actorName: session.name });
        if (next === "ready") state.alerts.push({ id: `alert_ready_${order.id}`, restaurantId, orderId: order.id, type: "order_ready", severity: "info", message: `Token #${order.token} is ready`, dismissed: false, createdAt: timestamp });
      }, `order-transition-${orderId}`);
      renderOperations();
      if (orderDialog.open && selectedOrderId === orderId) openOrder(orderId);
    } catch (error) {
      showDetailFeedback(error.message, true);
    }
  }

  function showDetailFeedback(message, error) {
    const element = document.querySelector("[data-detail-feedback]");
    element.hidden = false;
    element.textContent = message;
    element.className = `mt-5 rounded-xl px-4 py-3 text-sm font-bold ${error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`;
  }

  function openOrder(orderId) {
    const state = global.AutoCodeState.read();
    const order = state.orders.find((candidate) => candidate.id === orderId && candidate.restaurantId === restaurantId);
    if (!order) return;
    selectedOrderId = order.id;
    const status = statusDetails[order.status] || { label: order.status, action: null };
    document.querySelector("[data-detail-status]").textContent = status.label;
    document.querySelector("[data-detail-token]").textContent = `#${order.token} · KOT #${order.kotNumber || order.token}`;
    document.querySelector("[data-detail-meta]").textContent = `${order.customerName} · ${order.orderType} · ${order.serviceMode === "table-service" ? "Table service" : "Self-service"}${order.tableNumber ? ` · Table ${order.tableNumber}` : ""}`;
    document.querySelector("[data-detail-payment]").textContent = `${order.paymentStatus} · ${formatter.format(order.total)}`;
    document.querySelector("[data-detail-elapsed]").textContent = `${minutesSince(order.createdAt)} minutes`;
    document.querySelector("[data-detail-items]").innerHTML = order.items.map((item) => `<div class="flex justify-between gap-4 py-4"><div><p class="font-extrabold text-slate-900">${item.quantity} × ${escapeHtml(item.name)}${item.rewardSource ? ' <span class="text-purple-700">· Complimentary reward</span>' : ""}</p><p class="mt-1 text-xs text-slate-500">${escapeHtml([item.sizeName, item.spiceLevel, ...(item.addOns || []).map((addOn) => addOn.name)].filter(Boolean).join(" · "))}</p>${item.instructions ? `<p class="mt-1 text-xs italic text-slate-500">“${escapeHtml(item.instructions)}”</p>` : ""}</div><p class="font-bold">${formatter.format(item.lineTotal || 0)}</p></div>`).join("");
    const notes = document.querySelector("[data-detail-notes]");
    notes.hidden = !order.orderNotes && !order.issue?.active;
    notes.innerHTML = `${order.orderNotes ? `<p><strong>Customer note:</strong> ${escapeHtml(order.orderNotes)}</p>` : ""}${order.issue?.active ? `<p class="mt-2"><strong>Attention:</strong> ${escapeHtml(order.issue.type.replaceAll("_", " "))}${order.issue.note ? ` — ${escapeHtml(order.issue.note)}` : ""}</p>` : ""}`;
    document.querySelector("[data-detail-timeline]").innerHTML = order.timeline.slice().reverse().map((event) => `<li><p class="text-sm font-extrabold text-slate-800">${escapeHtml(event.label)}</p><p class="mt-1 text-xs text-slate-500">${new Date(event.at).toLocaleString()} · ${escapeHtml(event.actorName || event.actor)}</p></li>`).join("");
    document.querySelector("[data-detail-feedback]").hidden = true;
    document.querySelector("[data-resolve-issue]").disabled = !order.issue?.active;
    document.querySelector("[data-detail-actions]").innerHTML = `<div class="grid gap-3">${status.action ? `<button data-order-action="${escapeHtml(order.id)}" class="w-full rounded-xl bg-blue-700 px-6 py-3.5 font-extrabold text-white">${escapeHtml(status.action)}</button>` : ""}${activeStatuses.includes(order.status) ? `<button data-request-cancellation="${escapeHtml(order.id)}" class="w-full rounded-xl border border-red-300 px-6 py-3.5 font-extrabold text-red-700">Request cancellation</button>` : ""}${session.role === "admin" && order.status === "delivered" ? `<button data-reopen-order="${escapeHtml(order.id)}" class="w-full rounded-xl border border-amber-300 px-6 py-3.5 font-extrabold text-amber-800">Reopen as Ready</button>` : ""}${!status.action && !activeStatuses.includes(order.status) && !(session.role === "admin" && order.status === "delivered") ? `<p class="rounded-xl bg-slate-100 p-4 text-center text-sm font-bold text-slate-600">No further fulfillment action is available.</p>` : ""}</div>`;
    if (!orderDialog.open) global.AutoCodeApp.openDialog(orderDialog);
  }

  function updateIssue(resolve) {
    if (!selectedOrderId) return;
    try {
      global.AutoCodeState.update((state) => {
        const order = state.orders.find((candidate) => candidate.id === selectedOrderId);
        if (!order || !activeStatuses.includes(order.status)) throw new Error("Only active orders can be flagged.");
        const timestamp = new Date().toISOString();
        if (resolve) {
          if (!order.issue?.active) throw new Error("This order has no active issue.");
          order.issue.active = false;
          order.issue.resolvedAt = timestamp;
          order.issue.resolvedBy = session.id;
          order.timeline.push({ type: "issue_resolved", label: "Operational issue resolved", at: timestamp, actor: session.id, actorName: session.name });
        } else {
          const type = document.querySelector("[data-issue-type]").value;
          const note = document.querySelector("[data-issue-note]").value.trim().slice(0, 120);
          order.issue = { active: true, type, note, raisedAt: timestamp, raisedBy: session.id };
          order.timeline.push({ type: "issue_raised", label: `Issue flagged: ${type.replaceAll("_", " ")}`, at: timestamp, actor: session.id, actorName: session.name });
        }
        order.updatedAt = timestamp;
      }, resolve ? "order-issue-resolved" : "order-issue-raised");
      renderOperations();
      openOrder(selectedOrderId);
      showDetailFeedback(resolve ? "Issue resolved." : "Order flagged for attention.", false);
    } catch (error) {
      showDetailFeedback(error.message, true);
    }
  }

  document.addEventListener("click", (event) => {
    const open = event.target.closest("[data-open-order]");
    const action = event.target.closest("[data-order-action]");
    const dismiss = event.target.closest("[data-dismiss-alert]");
    if (open) openOrder(open.dataset.openOrder);
    if (action) transitionOrder(action.dataset.orderAction);
    if (dismiss) {
      global.AutoCodeState.update((state) => { const alert = state.alerts.find((item) => item.id === dismiss.dataset.dismissAlert); if (alert) alert.dismissed = true; }, "alert-dismissed");
      renderOperations();
    }
  });
  document.querySelector("[data-close-order]").addEventListener("click", () => global.AutoCodeApp.closeDialog(orderDialog));
  document.querySelector("[data-raise-issue]").addEventListener("click", () => updateIssue(false));
  document.querySelector("[data-resolve-issue]").addEventListener("click", () => updateIssue(true));
  document.querySelectorAll("[data-order-filter]").forEach((button) => button.addEventListener("click", () => {
    orderFilter = button.dataset.orderFilter;
    document.querySelectorAll("[data-order-filter]").forEach((candidate) => { candidate.className = candidate === button ? "rounded-full bg-blue-700 px-4 py-2 text-sm font-bold text-white" : "rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700"; });
    renderOperations();
  }));
  global.AutoCodeState.subscribe((state) => { if (state) { renderOperations(); if (orderDialog.open && selectedOrderId) openOrder(selectedOrderId); } });
  global.setInterval(renderOperations, 30000);
  renderOperations();
})(window);
