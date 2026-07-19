(function initializeTrackingAndGame(global) {
  "use strict";

  const session = global.AutoCodeApp.getSession();
  if (!session || !["customer", "guest"].includes(session.role)) return;

  const restaurantId = session.restaurantId || "rest_autoserve_demo";
  const activeStatuses = ["payment_confirmed", "order_received", "preparing", "ready"];
  const rewardEligibleStatuses = ["payment_confirmed", "order_received", "preparing"];
  const statusOrder = ["payment_confirmed", "order_received", "preparing", "ready", "delivered"];
  const statusLabels = { payment_confirmed: "Payment confirmed", order_received: "Order received", preparing: "Preparing", ready: "Ready", delivered: "Delivered", cancelled: "Cancelled" };
  const formatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
  const winningLines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  let board = Array(9).fill("");
  let gameFinished = false;
  let computerTurn = false;
  let gamePaused = false;
  let gameInitialized = false;
  let gameContext = null;
  let knownStatuses = new Map();

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  const createId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  function customerOrders(state) {
    return state.orders.filter((order) => order.customerId === session.id && order.restaurantId === restaurantId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function activeOrder(state) {
    return customerOrders(state).find((order) => activeStatuses.includes(order.status)) || null;
  }

  function elapsedText(order) {
    const minutes = Math.max(0, Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000));
    return `${minutes} minute${minutes === 1 ? "" : "s"} elapsed`;
  }

  function preparationCountdown(order) {
    if (order.status === "ready") return { label: "Meal ready", progress: 100 };
    if (!order.simulationReadyAt) return { label: `About ${order.estimatedMinutes || 10} min`, progress: 0 };
    const created = new Date(order.createdAt).getTime();
    const ready = new Date(order.simulationReadyAt).getTime();
    const seconds = Math.ceil(Math.max(0, ready - Date.now()) / 1000);
    const progress = Math.max(0, Math.min(100, Math.round(((Date.now() - created) / Math.max(1, ready - created)) * 100)));
    return { label: `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`, progress };
  }

  function countdownCard(order) {
    const countdown = preparationCountdown(order);
    return `<section class="mt-4 rounded-xl bg-blue-50 p-4" aria-live="polite"><div class="flex items-center justify-between gap-4"><div><p class="text-xs font-extrabold uppercase tracking-wider text-blue-700">Demo meal timer</p><p class="mt-1 text-xs text-blue-900">Based on this order’s ${Number(order.estimatedMinutes || 10)}-minute preparation estimate</p></div><strong class="font-mono text-2xl text-blue-900">${escapeHtml(countdown.label)}</strong></div><div class="mt-3 h-2 overflow-hidden rounded-full bg-blue-100"><span class="block h-full rounded-full bg-blue-700 transition-[width]" style="width:${countdown.progress}%"></span></div></section>`;
  }

  function simulatePreparation() {
    const order = activeOrder(global.AutoCodeState.read());
    if (!order?.simulationReadyAt || ["ready", "delivered", "cancelled"].includes(order.status)) return;
    const created = new Date(order.createdAt).getTime();
    const ready = new Date(order.simulationReadyAt).getTime();
    const progress = (Date.now() - created) / Math.max(1, ready - created);
    const target = progress >= 1 ? "ready" : progress >= 0.3 ? "preparing" : progress >= 0.15 ? "order_received" : "payment_confirmed";
    if (statusOrder.indexOf(target) <= statusOrder.indexOf(order.status)) return;
    global.AutoCodeState.update((state) => {
      const current = state.orders.find((entry) => entry.id === order.id);
      if (!current || ["ready", "delivered", "cancelled"].includes(current.status)) return;
      const timestamp = new Date().toISOString();
      const stages = [{ status: "order_received", threshold: 0.15, label: "Order received by demo kitchen" }, { status: "preparing", threshold: 0.3, label: "Demo kitchen started preparation" }, { status: "ready", threshold: 1, label: "Meal ready in preparation simulation" }];
      stages.filter((stage) => progress >= stage.threshold && statusOrder.indexOf(stage.status) > statusOrder.indexOf(current.status)).forEach((stage) => {
        current.status = stage.status;
        current.kotStatus = stage.status === "order_received" ? "accepted" : stage.status;
        current[stage.status === "order_received" ? "receivedAt" : `${stage.status}At`] = timestamp;
        current.timeline.push({ type: stage.status, label: stage.label, at: timestamp, actor: "simulation", actorName: "Demo kitchen" });
      });
      current.updatedAt = timestamp;
      if (current.status === "ready" && !state.alerts.some((alert) => alert.orderId === current.id && alert.type === "order_ready")) state.alerts.push({ id: createId("alert"), restaurantId, orderId: current.id, type: "order_ready", severity: "info", message: `Token #${current.token} is ready`, dismissed: false, createdAt: timestamp });
    }, "demo-meal-preparation-progressed");
  }

  function statusTracker(order) {
    const currentIndex = statusOrder.indexOf(order.status);
    if (order.status === "cancelled") return `<div class="rounded-xl bg-red-50 p-4 font-bold text-red-800">This order was cancelled.</div>`;
    return `<ol class="grid gap-2 sm:grid-cols-5">${statusOrder.map((status, index) => `<li class="rounded-xl border p-3 ${index <= currentIndex ? "border-blue-300 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-400"}"><span class="block text-xs font-black">${index < currentIndex ? "✓" : index + 1}</span><span class="mt-1 block text-xs font-bold">${statusLabels[status]}</span></li>`).join("")}</ol>`;
  }

  function renderTracking() {
    const state = global.AutoCodeState.read();
    const orders = customerOrders(state);
    const active = orders.find((order) => activeStatuses.includes(order.status));
    const tracker = document.querySelector("[data-active-tracker]");
    document.querySelector("[data-customer-orders-empty]").hidden = orders.length > 0;
    if (active) {
      const reward = active.items.find((item) => item.rewardSource === "tic_tac_toe");
      tracker.innerHTML = `<article class="app-card overflow-hidden"><div class="flex flex-col justify-between gap-5 bg-slate-950 p-6 text-white sm:flex-row sm:items-center sm:p-8"><div><p class="text-sm font-bold text-blue-300">ACTIVE TOKEN</p><p class="mt-1 text-5xl font-black">#${escapeHtml(active.token)}</p><p class="mt-2 text-sm text-slate-300">${escapeHtml(elapsedText(active))} · Est. ${active.estimatedMinutes} min</p></div><div class="sm:text-right"><p class="text-sm font-bold text-slate-400">Current status</p><p class="mt-1 text-2xl font-black text-white">${escapeHtml(statusLabels[active.status])}</p><p class="mt-2 text-sm text-slate-300">${active.orderType === "dine-in" ? `Table ${escapeHtml(active.tableNumber)}` : "Takeaway"}</p></div></div><div class="p-6 sm:p-8">${statusTracker(active)}${countdownCard(active)}${reward ? `<div class="mt-5 rounded-xl bg-purple-50 p-4 text-sm font-bold text-purple-900">🎁 ${escapeHtml(reward.name)} added as your complimentary Tic-Tac-Toe reward.</div>` : ""}<div class="mt-6 flex flex-wrap gap-3"><a href="#/game" class="rounded-xl bg-blue-700 px-5 py-3 font-extrabold text-white">Play Tic-Tac-Toe</a><span class="rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700">Paid ${formatter.format(active.total)}</span></div></div></article>`;
    } else {
      tracker.innerHTML = orders.length ? `<div class="app-card p-6 text-center"><p class="font-bold text-slate-600">You have no active order.</p></div>` : "";
    }
    document.querySelector("[data-customer-order-list]").innerHTML = orders.slice(0, 6).map((order) => `<article class="app-card p-5"><div class="flex items-start justify-between gap-4"><div><p class="text-2xl font-black text-slate-950">#${escapeHtml(order.token)}</p><p class="mt-1 text-sm font-bold ${order.status === "ready" ? "text-green-700" : order.status === "cancelled" ? "text-red-700" : "text-blue-700"}">${escapeHtml(statusLabels[order.status] || order.status)}</p></div><p class="text-right text-sm font-bold text-slate-600">${formatter.format(order.total)}<br><span class="font-normal">${new Date(order.createdAt).toLocaleDateString()}</span></p></div><p class="mt-4 text-sm text-slate-600">${order.items.reduce((sum, item) => sum + item.quantity, 0)} items · ${escapeHtml(order.orderType)}</p></article>`).join("");
    renderGameSidebar(state);
  }

  function eligibleContext(state) {
    if (session.role !== "customer") return { eligible: false, reason: "guest", order: activeOrder(state), attempt: null };
    const order = customerOrders(state).find((candidate) => rewardEligibleStatuses.includes(candidate.status));
    if (!order) {
      const active = activeOrder(state);
      return { eligible: false, reason: active?.status === "ready" ? "order-closed" : "no-order", order: active, attempt: null };
    }
    const attempt = state.gameAttempts.find((candidate) => candidate.orderId === order.id && candidate.rewardEligible);
    if (attempt?.status === "in_progress") return { eligible: true, reason: "resume", order, attempt };
    if (attempt) return { eligible: false, reason: "used", order, attempt };
    return { eligible: true, reason: "new", order, attempt: null };
  }

  function renderGameSidebar(state) {
    const context = eligibleContext(state);
    const eligibility = document.querySelector("[data-game-eligibility]");
    const orderBox = document.querySelector("[data-game-order]");
    const messages = {
      guest: "Play for fun! Sign in and place an order to unlock a complimentary reward when you win.",
      "no-order": "Place an order to unlock a reward-eligible match.",
      "order-closed": "This order is already ready, so reward games are now practice-only.",
      used: "Your reward attempt for this order has been used. Additional games are practice-only.",
      new: "Beat the computer to win a complimentary item with your current order.",
      resume: "Your reward-eligible game is in progress and has been restored."
    };
    eligibility.innerHTML = `<p class="rounded-xl ${context.eligible ? "bg-green-50 text-green-900" : "bg-slate-100 text-slate-700"} p-4 text-sm font-bold leading-6">${escapeHtml(messages[context.reason])}</p>`;
    document.querySelector("[data-game-message]").textContent = messages[context.reason];
    orderBox.innerHTML = context.order ? `<p class="text-3xl font-black text-slate-950">#${escapeHtml(context.order.token)}</p><p class="mt-1 text-sm font-bold text-blue-700">${escapeHtml(statusLabels[context.order.status])}</p><p class="mt-2 text-xs text-slate-500">${escapeHtml(elapsedText(context.order))}</p>${countdownCard(context.order)}` : `<p class="text-sm font-bold text-slate-500">No active paid order</p>`;
  }

  function winnerFor(cells) {
    for (const [a, b, c] of winningLines) if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) return cells[a];
    return cells.every(Boolean) ? "draw" : null;
  }

  function persistBoard() {
    if (!gameContext?.eligible || !gameContext.attemptId) return;
    global.AutoCodeState.update((state) => {
      const attempt = state.gameAttempts.find((candidate) => candidate.id === gameContext.attemptId && candidate.status === "in_progress");
      if (attempt) { attempt.board = board.slice(); attempt.currentTurn = computerTurn ? "computer" : "customer"; attempt.updatedAt = new Date().toISOString(); }
    }, "game-board-updated");
  }

  function renderBoard() {
    const boardElement = document.querySelector("[data-game-board]");
    boardElement.innerHTML = board.map((cell, index) => `<button type="button" data-cell="${index}" role="gridcell" ${cell || gameFinished || computerTurn || gamePaused ? "disabled" : ""} aria-label="Cell ${index + 1}${cell ? `: ${cell}` : ""}" class="aspect-square rounded-2xl border-2 ${cell === "X" ? "border-blue-300 bg-blue-50 text-blue-800" : cell === "O" ? "border-slate-300 bg-slate-100 text-slate-700" : "border-slate-300 bg-white text-slate-300 hover:border-blue-600"} text-5xl font-black disabled:cursor-default">${cell || "·"}</button>`).join("");
    document.querySelector("[data-new-game]").disabled = !gameFinished;
    document.querySelector("[data-new-game]").className = `rounded-xl px-5 py-3 font-extrabold text-white ${gameFinished ? "bg-blue-700 hover:bg-blue-800" : "cursor-not-allowed bg-slate-300"}`;
  }

  function startGame() {
    const state = global.AutoCodeState.read();
    const context = eligibleContext(state);
    gameFinished = false;
    computerTurn = false;
    gamePaused = false;
    document.querySelector("[data-game-feedback]").hidden = true;
    if (context.eligible && context.attempt?.status === "in_progress") {
      board = Array.isArray(context.attempt.board) ? context.attempt.board.slice(0, 9) : Array(9).fill("");
      while (board.length < 9) board.push("");
      computerTurn = context.attempt.currentTurn === "computer";
      gameContext = { eligible: true, orderId: context.order.id, attemptId: context.attempt.id };
    } else {
      board = Array(9).fill("");
      gameContext = { eligible: context.eligible, orderId: context.order?.id || null, attemptId: null };
      if (context.eligible) {
        const attemptId = createId("game");
        global.AutoCodeState.update((nextState) => { nextState.gameAttempts.push({ id: attemptId, restaurantId, customerId: session.id, orderId: context.order.id, game: "tic_tac_toe", rewardEligible: true, status: "in_progress", board: board.slice(), currentTurn: "customer", startedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); }, "eligible-game-started");
        gameContext.attemptId = attemptId;
      }
    }
    gameInitialized = true;
    renderBoard();
    renderGameSidebar(global.AutoCodeState.read());
    if (computerTurn) global.setTimeout(computerMove, 350);
  }

  function showGameResult(message, tone) {
    const feedback = document.querySelector("[data-game-feedback]");
    feedback.hidden = false;
    feedback.textContent = message;
    feedback.className = `mx-auto mt-5 max-w-md rounded-xl px-4 py-3 text-center text-sm font-bold ${tone === "win" ? "bg-green-50 text-green-900" : tone === "loss" ? "bg-red-50 text-red-800" : "bg-slate-100 text-slate-700"}`;
  }

  function rewardItemAvailable(item) {
    return item && item.status === "published" && !["unavailable", "sold-out"].includes(item.availabilityStatus) && !item.emergencyCutoff;
  }

  function completeGame(result) {
    gameFinished = true;
    computerTurn = false;
    let resultMessage = result === "win" ? "You won!" : result === "loss" ? "The computer won this round." : "It’s a draw.";
    let rewardMessage = "";
    global.AutoCodeState.update((state) => {
      let attempt = gameContext?.attemptId ? state.gameAttempts.find((candidate) => candidate.id === gameContext.attemptId) : null;
      if (!attempt) {
        attempt = { id: createId("game"), restaurantId, customerId: session.id, orderId: gameContext?.orderId || null, game: "tic_tac_toe", rewardEligible: false, startedAt: new Date().toISOString() };
        state.gameAttempts.push(attempt);
      }
      if (attempt.status && attempt.status !== "in_progress") return;
      const completedAt = new Date().toISOString();
      attempt.status = "completed";
      attempt.result = result;
      attempt.board = board.slice();
      attempt.completedAt = completedAt;
      attempt.updatedAt = completedAt;
      if (result !== "win" || !attempt.rewardEligible) return;
      const order = state.orders.find((candidate) => candidate.id === attempt.orderId && candidate.customerId === session.id);
      if (!order || !rewardEligibleStatuses.includes(order.status) || order.items.some((item) => item.rewardSource === "tic_tac_toe")) {
        attempt.rewardStatus = "not_available";
        rewardMessage = " The order is no longer eligible for a reward.";
        return;
      }
      const restaurant = state.restaurants.find((candidate) => candidate.id === restaurantId);
      const primary = state.menuItems.find((item) => item.id === restaurant.primaryRewardItemId);
      const fallback = state.menuItems.find((item) => item.id === restaurant.fallbackRewardItemId);
      const reward = rewardItemAvailable(primary) ? primary : rewardItemAvailable(fallback) ? fallback : null;
      if (!reward) {
        attempt.rewardStatus = "manual_alternative";
        order.timeline.push({ type: "reward_manual", label: "Tic-Tac-Toe win requires a manual reward alternative", at: completedAt, actor: "system" });
        state.alerts.push({ id: createId("alert"), restaurantId, orderId: order.id, type: "reward_unavailable", severity: "error", message: `Token #${order.token} won, but the reward item is unavailable`, dismissed: false, createdAt: completedAt });
        rewardMessage = " You won a reward; restaurant staff will provide an alternative.";
        return;
      }
      reward.updatedAt = completedAt;
      const rewardLine = { id: createId("reward"), key: `reward|${reward.id}`, itemId: reward.id, name: reward.name, icon: reward.icon, quantity: 1, sizeId: "regular", sizeName: "Regular", spiceLevel: "", addOnIds: [], addOns: [], instructions: "", basePrice: reward.price, unitPrice: 0, lineTotal: 0, rewardSource: "tic_tac_toe", addedAt: completedAt };
      order.items.push(rewardLine);
      order.updatedAt = completedAt;
      order.timeline.push({ type: "reward_added", label: `${reward.name} added as a Tic-Tac-Toe reward`, at: completedAt, actor: "system" });
      attempt.rewardStatus = "issued";
      attempt.rewardItemId = reward.id;
      state.alerts.push({ id: createId("alert"), restaurantId, orderId: order.id, type: "reward_added", severity: "info", message: `${reward.name} reward added to token #${order.token}`, dismissed: false, createdAt: completedAt });
      rewardMessage = ` ${reward.name} was added to your current order at no charge.`;
    }, "tic-tac-toe-completed");
    showGameResult(`${resultMessage}${rewardMessage}`, result === "win" ? "win" : result === "loss" ? "loss" : "draw");
    renderBoard();
    renderTracking();
  }

  function computerMove() {
    if (gameFinished || gamePaused) return;
    const available = board.map((cell, index) => cell ? null : index).filter((index) => index !== null);
    if (!available.length) return completeGame("draw");
    let choice = null;
    for (const line of winningLines) {
      const values = line.map((index) => board[index]);
      if (values.filter((value) => value === "O").length === 2 && values.includes("")) { choice = line[values.indexOf("")]; break; }
    }
    if (choice === null) choice = [4, 0, 8, 2, 6, 1, 3, 5, 7].find((index) => !board[index]);
    board[choice] = "O";
    computerTurn = false;
    persistBoard();
    const winner = winnerFor(board);
    if (winner) completeGame(winner === "O" ? "loss" : "draw");
    else renderBoard();
  }

  function playerMove(index) {
    if (board[index] || gameFinished || computerTurn || gamePaused) return;
    board[index] = "X";
    let winner = winnerFor(board);
    if (winner) { persistBoard(); completeGame(winner === "X" ? "win" : "draw"); return; }
    computerTurn = true;
    persistBoard();
    renderBoard();
    global.setTimeout(computerMove, 450);
  }

  function notifyReady(order) {
    gamePaused = true;
    renderBoard();
    document.querySelector("[data-ready-token]").textContent = `#${order.token}`;
    document.querySelector("[data-ready-title]").textContent = "Order ready";
    document.querySelector("[data-ready-message]").textContent = order.serviceMode === "table-service"
      ? `Your food is ready and will be served${order.tableNumber ? ` at table ${order.tableNumber}` : ""}.`
      : `KOT #${order.kotNumber || order.token} is ready. Please collect token #${order.token} at the pickup counter.`;
    global.AutoCodeApp.openDialog(document.querySelector("#ready-dialog"));
  }

  function notifyDelivered(order) {
    document.querySelector("[data-ready-token]").textContent = `#${order.token}`;
    document.querySelector("[data-ready-title]").textContent = "Order delivered";
    document.querySelector("[data-ready-message]").textContent = "Your order is complete. The final receipt is available in your order history.";
    global.AutoCodeApp.openDialog(document.querySelector("#ready-dialog"));
  }

  function checkStatusNotifications(state) {
    customerOrders(state).forEach((order) => {
      const previous = knownStatuses.get(order.id);
      if (previous && previous !== "ready" && order.status === "ready") notifyReady(order);
      if (previous && previous !== "delivered" && order.status === "delivered") notifyDelivered(order);
      knownStatuses.set(order.id, order.status);
    });
  }

  document.querySelector("[data-game-board]").addEventListener("click", (event) => { const cell = event.target.closest("[data-cell]"); if (cell) playerMove(Number(cell.dataset.cell)); });
  document.querySelector("[data-new-game]").addEventListener("click", startGame);
  document.querySelector("[data-close-ready]").addEventListener("click", () => { gamePaused = false; global.AutoCodeApp.closeDialog(document.querySelector("#ready-dialog")); global.location.hash = "/orders"; renderBoard(); });
  global.addEventListener("hashchange", () => { if (global.location.hash === "#/game" && !gameInitialized) startGame(); if (global.location.hash === "#/orders") renderTracking(); });
  global.AutoCodeState.subscribe((state) => { if (!state) return; checkStatusNotifications(state); renderTracking(); });
  const initialState = global.AutoCodeState.read();
  customerOrders(initialState).forEach((order) => knownStatuses.set(order.id, order.status));
  renderTracking();
  renderBoard();
  if (global.location.hash === "#/game") startGame();
  global.setInterval(() => { simulatePreparation(); renderTracking(); }, 1000);
})(window);
