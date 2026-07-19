(function initializeMiniGames(global) {
  "use strict";
  const tabList = document.querySelector('[role="tablist"][aria-label="Choose a game"]');
  const gameColumn = document.querySelector('[data-game-panel="tic-tac-toe"]')?.parentElement;
  if (tabList && gameColumn) {
    tabList.className = "game-picker mt-5";
    tabList.insertAdjacentHTML("beforeend", '<button data-game-tab="ludo" role="tab" aria-selected="false" class="rounded-xl px-3 py-3 text-sm font-extrabold text-slate-600">Ludo Race</button>');
    gameColumn.insertAdjacentHTML("beforeend", '<article data-game-panel="ludo" hidden class="app-card p-6 text-center sm:p-8"><h2 class="text-3xl font-black">Ludo Race</h2><p class="mt-2 text-slate-600">Race your blue token against the computer. Roll the exact number to reach Home.</p><div data-ludo-track class="mx-auto mt-6 grid max-w-lg grid-cols-5 gap-2" aria-label="Ludo race track"></div><div class="mx-auto mt-6 grid max-w-md grid-cols-3 gap-3"><div class="rounded-xl bg-blue-50 p-3"><span class="block text-xs font-bold text-blue-700">YOU</span><strong data-ludo-player class="text-2xl">0</strong></div><div class="rounded-xl bg-white p-3 shadow-sm"><span class="block text-xs font-bold text-slate-500">DICE</span><strong data-ludo-dice class="text-3xl">–</strong></div><div class="rounded-xl bg-red-50 p-3"><span class="block text-xs font-bold text-red-700">CPU</span><strong data-ludo-computer class="text-2xl">0</strong></div></div><p data-ludo-status class="mt-5 font-bold text-slate-700" aria-live="polite">Your turn. Roll the dice.</p><div class="mt-5 flex flex-wrap justify-center gap-3"><button data-roll-ludo class="rounded-xl bg-blue-700 px-6 py-3 font-extrabold text-white">Roll dice</button><button data-new-ludo class="rounded-xl border border-slate-300 px-6 py-3 font-extrabold">New race</button></div></article>');
    const practiceNote = document.querySelector("[data-game-eligibility]")?.nextElementSibling;
    if (practiceNote) practiceNote.textContent = "Only Tic-Tac-Toe uses the complimentary reward attempt. Memory Match, Tap Rush, and Ludo Race are unlimited practice games.";
  }
  const tabs = Array.from(document.querySelectorAll("[data-game-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-game-panel]"));
  if (!tabs.length) return;
  const gameLabels = { "tic-tac-toe": ["#", "Tic-Tac-Toe"], memory: ["▦", "Memory"], "tap-rush": ["⚡", "Tap Rush"], ludo: ["⚄", "Ludo"] };
  tabs.forEach((tab) => { const [icon, label] = gameLabels[tab.dataset.gameTab]; tab.setAttribute("aria-label", label); tab.innerHTML = `<span class="game-picker-icon" aria-hidden="true">${icon}</span><span>${label}</span>`; });

  function selectGame(name) {
    tabs.forEach((tab) => { const active = tab.dataset.gameTab === name; tab.setAttribute("aria-selected", String(active)); tab.className = `game-picker-button ${active ? "is-active" : ""}`; });
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

  const finish = 20; let playerPosition = 0; let computerPosition = 0; let ludoFinished = false; let computerRolling = false;
  const ludoTrack = document.querySelector("[data-ludo-track]"); const ludoStatus = document.querySelector("[data-ludo-status]"); const rollButton = document.querySelector("[data-roll-ludo]");
  function renderLudo() {
    ludoTrack.innerHTML = Array.from({ length: finish }, (_, index) => { const step = index + 1; const pieces = `${playerPosition === step ? "🔵" : ""}${computerPosition === step ? "🔴" : ""}`; return `<div class="flex aspect-square items-center justify-center rounded-xl border ${step === finish ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"} text-lg font-black" aria-label="Step ${step}${pieces ? `: ${pieces}` : ""}">${pieces || (step === finish ? "🏠" : step)}</div>`; }).join(""); document.querySelector("[data-ludo-player]").textContent = `${playerPosition}/${finish}`; document.querySelector("[data-ludo-computer]").textContent = `${computerPosition}/${finish}`; rollButton.disabled = ludoFinished || computerRolling; rollButton.classList.toggle("opacity-50", rollButton.disabled);
  }
  function move(position, roll) { return position + roll <= finish ? position + roll : position; }
  function computerRoll() { if (ludoFinished) return; const roll = Math.floor(Math.random() * 6) + 1; document.querySelector("[data-ludo-dice]").textContent = String(roll); computerPosition = move(computerPosition, roll); if (computerPosition === finish) { ludoFinished = true; ludoStatus.textContent = "The computer reached Home first. Start a new race for a rematch!"; } else { ludoStatus.textContent = `Computer rolled ${roll}. Your turn.`; } computerRolling = false; renderLudo(); }
  function playerRoll() { if (ludoFinished || computerRolling) return; const roll = Math.floor(Math.random() * 6) + 1; document.querySelector("[data-ludo-dice]").textContent = String(roll); playerPosition = move(playerPosition, roll); if (playerPosition === finish) { ludoFinished = true; ludoStatus.textContent = "You reached Home first — you win the race!"; renderLudo(); return; } computerRolling = true; ludoStatus.textContent = `You rolled ${roll}. Computer is rolling…`; renderLudo(); global.setTimeout(computerRoll, 650); }
  function newLudo() { playerPosition = 0; computerPosition = 0; ludoFinished = false; computerRolling = false; document.querySelector("[data-ludo-dice]").textContent = "–"; ludoStatus.textContent = "Your turn. Roll the dice."; renderLudo(); }
  rollButton.addEventListener("click", playerRoll); document.querySelector("[data-new-ludo]").addEventListener("click", newLudo); newLudo();
})(window);
