(function initializeMiniGames(global) {
  "use strict";
  const tabs = Array.from(document.querySelectorAll("[data-game-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-game-panel]"));
  if (!tabs.length) return;

  function selectGame(name) {
    tabs.forEach((tab) => { const active = tab.dataset.gameTab === name; tab.setAttribute("aria-selected", String(active)); tab.className = `rounded-xl px-3 py-3 text-sm font-extrabold ${active ? "bg-white text-blue-800 shadow-sm" : "text-slate-600"}`; });
    panels.forEach((panel) => { panel.hidden = panel.dataset.gamePanel !== name; });
  }
  tabs.forEach((tab) => tab.addEventListener("click", () => selectGame(tab.dataset.gameTab)));

  const memoryBoard = document.querySelector("[data-memory-board]"); const memoryStatus = document.querySelector("[data-memory-status]");
  const foods = ["🍔", "🍟", "🥤", "🍰"]; let memoryCards = []; let revealed = []; let matched = new Set(); let moves = 0; let memoryLocked = false;
  function shuffle(values) { return values.map((value) => ({ value, order: Math.random() })).sort((a, b) => a.order - b.order).map((entry) => entry.value); }
  function renderMemory() { memoryBoard.innerHTML = memoryCards.map((food, index) => { const visible = revealed.includes(index) || matched.has(index); return `<button type="button" data-memory-card="${index}" ${matched.has(index) || memoryLocked ? "disabled" : ""} class="aspect-square rounded-2xl border-2 ${visible ? "border-blue-300 bg-blue-50" : "border-slate-300 bg-slate-900"} text-4xl font-black shadow-sm" aria-label="${visible ? `Food card ${food}` : "Hidden food card"}">${visible ? food : "?"}</button>`; }).join(""); memoryStatus.textContent = matched.size === memoryCards.length ? `Completed in ${moves} moves — great memory!` : `${moves} move${moves === 1 ? "" : "s"} · ${matched.size / 2} of 4 pairs found`; }
  function startMemory() { memoryCards = shuffle([...foods, ...foods]); revealed = []; matched = new Set(); moves = 0; memoryLocked = false; renderMemory(); }
  memoryBoard.addEventListener("click", (event) => { const button = event.target.closest("[data-memory-card]"); if (!button || memoryLocked) return; const index = Number(button.dataset.memoryCard); if (revealed.includes(index) || matched.has(index)) return; revealed.push(index); renderMemory(); if (revealed.length < 2) return; moves += 1; const [first, second] = revealed; if (memoryCards[first] === memoryCards[second]) { matched.add(first); matched.add(second); revealed = []; renderMemory(); return; } memoryLocked = true; global.setTimeout(() => { revealed = []; memoryLocked = false; renderMemory(); }, 650); });
  document.querySelector("[data-new-memory]").addEventListener("click", startMemory); startMemory();

  const tapTarget = document.querySelector("[data-tap-target]"); const tapTime = document.querySelector("[data-tap-time]"); const tapScore = document.querySelector("[data-tap-score]"); const tapStatus = document.querySelector("[data-tap-status]"); const tapStart = document.querySelector("[data-start-tap]");
  const tapFoods = ["🍔", "🍟", "🥤", "🍕", "🍰"]; let score = 0; let timeLeft = 10; let tapTimer = null;
  function finishTap() { global.clearInterval(tapTimer); tapTimer = null; tapTarget.disabled = true; tapStart.disabled = false; tapStart.textContent = "Play again"; tapStatus.textContent = `Time! You scored ${score}. ${score >= 20 ? "Lightning fast!" : score >= 12 ? "Great tapping!" : "Try again and beat your score."}`; }
  function startTap() { if (tapTimer) return; score = 0; timeLeft = 10; tapScore.textContent = "0"; tapTime.textContent = "10"; tapStatus.textContent = "Go! Tap the food target."; tapTarget.disabled = false; tapStart.disabled = true; tapTimer = global.setInterval(() => { timeLeft -= 1; tapTime.textContent = String(timeLeft); if (timeLeft <= 0) finishTap(); }, 1000); }
  tapTarget.addEventListener("click", () => { if (!tapTimer) return; score += 1; tapScore.textContent = String(score); tapTarget.textContent = tapFoods[Math.floor(Math.random() * tapFoods.length)]; }); tapStart.addEventListener("click", startTap);
})(window);
