(function initializeDataManagement(global) {
  "use strict";
  const session = global.AutoCodeApp.getSession();
  if (!session || session.role !== "admin") return;
  const restaurantId = session.restaurantId || "rest_autoserve_demo";
  const requiredCollections = ["restaurants", "users", "categories", "menuItems", "carts", "payments", "orders", "inventoryAudit", "gameAttempts", "backups", "alerts"];
  let pendingImport = null;
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  const createId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const filenamePart = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "autoserve";
  if (!document.querySelector("[data-route='data']")) return;

  function feedback(message, error) {
    const target = document.querySelector("[data-data-feedback]");
    target.hidden = false; target.textContent = message;
    target.className = `mt-5 rounded-xl px-4 py-3 text-sm font-bold ${error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`;
  }
  async function sha256(value) { const digest = await global.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
  function snapshot(state) { const copy = clone(state); copy.backups = []; copy.activeSession = null; return copy; }
  function byteSize(value) { return new Blob([JSON.stringify(value)]).size; }

  function validateState(candidate) {
    const errors = [], warnings = [];
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return { valid: false, errors: ["State must be a JSON object."], warnings, counts: {} };
    if (!Number.isInteger(candidate.schemaVersion)) errors.push("schemaVersion must be an integer.");
    else if (candidate.schemaVersion > global.AutoCodeState.schemaVersion) errors.push(`Schema ${candidate.schemaVersion} is newer than supported schema ${global.AutoCodeState.schemaVersion}.`);
    else if (candidate.schemaVersion !== global.AutoCodeState.schemaVersion) errors.push(`Schema ${candidate.schemaVersion} requires migration before it can replace schema ${global.AutoCodeState.schemaVersion}.`);
    requiredCollections.forEach((key) => { if (!Array.isArray(candidate[key])) errors.push(`${key} must be an array.`); });
    const counts = Object.fromEntries(requiredCollections.map((key) => [key, Array.isArray(candidate[key]) ? candidate[key].length : 0]));
    if (errors.length) return { valid: false, errors, warnings, counts };
    requiredCollections.forEach((key) => {
      const ids = new Set();
      candidate[key].forEach((record, index) => {
        if (!record || typeof record !== "object") { errors.push(`${key}[${index}] must be an object.`); return; }
        if (key !== "backups" && !record.id) errors.push(`${key}[${index}] is missing an id.`);
        if (record.id && ids.has(record.id)) errors.push(`${key} contains duplicate id ${record.id}.`);
        if (record.id) ids.add(record.id);
      });
    });
    const restaurantIds = new Set(candidate.restaurants.map((item) => item.id));
    if (!restaurantIds.has(restaurantId)) errors.push(`Import does not contain selected restaurant ${restaurantId}.`);
    ["categories", "menuItems", "orders", "inventoryAudit"].forEach((key) => candidate[key].forEach((record) => { if (record.restaurantId && !restaurantIds.has(record.restaurantId)) errors.push(`${key} record ${record.id} references an unknown restaurant.`); }));
    const categoryIds = new Set(candidate.categories.map((item) => item.id));
    candidate.menuItems.forEach((item) => { if (!categoryIds.has(item.categoryId)) warnings.push(`Menu item ${item.name || item.id} references a missing category.`); if (!Number.isFinite(Number(item.stock)) || Number(item.stock) < 0) errors.push(`Menu item ${item.name || item.id} has invalid stock.`); });
    if (!candidate.users.some((user) => user.restaurantId === restaurantId && user.role === "admin" && user.active)) errors.push("Import must contain an active Admin for the selected restaurant.");
    return { valid: errors.length === 0, errors, warnings, counts };
  }

  async function exportPackage(state, kind, name) {
    const clean = kind === "backup" ? snapshot(state) : clone(state);
    const digest = await sha256(JSON.stringify(clean));
    return { format: "autocode-prototype-export", formatVersion: 1, schemaVersion: clean.schemaVersion, exportedAt: new Date().toISOString(), restaurantId, kind: kind || "complete", name: name || null, integrity: { algorithm: "SHA-256", digest }, state: clean };
  }
  function downloadJson(value, filename) {
    const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove(); global.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function downloadState() {
    try { const state = global.AutoCodeState.read(); const restaurant = state.restaurants.find((item) => item.id === restaurantId); const packaged = await exportPackage(state, "complete"); downloadJson(packaged, `${filenamePart(restaurant?.slug || restaurant?.name)}-complete-${new Date().toISOString().slice(0, 10)}.json`); feedback("Complete JSON export downloaded.", false); } catch (error) { feedback(error.message, true); }
  }

  async function inspectImport(file) {
    pendingImport = null; document.querySelector("[data-confirm-import]").disabled = true;
    const summary = document.querySelector("[data-import-summary]"); summary.hidden = false;
    try {
      if (!file) throw new Error("Choose a JSON export file.");
      if (file.size > 10 * 1024 * 1024) throw new Error("Import exceeds the 10 MB prototype safety limit.");
      const parsed = JSON.parse(await file.text());
      const candidate = parsed.state || parsed;
      const result = validateState(candidate);
      if (parsed.integrity?.digest) { const digest = await sha256(JSON.stringify(candidate)); if (digest !== parsed.integrity.digest) result.errors.push("Integrity digest does not match the imported state."); }
      else result.warnings.push("No integrity digest was supplied.");
      result.valid = result.errors.length === 0;
      summary.innerHTML = `<p class="font-extrabold ${result.valid ? "text-green-800" : "text-red-800"}">${result.valid ? "Validation passed" : "Validation failed"}</p><p class="mt-2">Schema ${escapeHtml(candidate.schemaVersion)} · ${result.counts.orders || 0} orders · ${result.counts.menuItems || 0} menu items · ${result.counts.users || 0} users · ${result.counts.backups || 0} embedded backups</p>${result.warnings.length ? `<p class="mt-2 text-amber-800"><strong>Warnings:</strong> ${result.warnings.map(escapeHtml).join(" ")}</p>` : ""}${result.errors.length ? `<ul class="mt-2 list-disc pl-5 text-red-800">${result.errors.slice(0, 8).map((error) => `<li>${escapeHtml(error)}</li>`).join("")}</ul>` : ""}`;
      if (result.valid) { pendingImport = clone(candidate); document.querySelector("[data-confirm-import]").disabled = false; }
    } catch (error) { summary.innerHTML = `<p class="font-extrabold text-red-800">${escapeHtml(error instanceof SyntaxError ? "The selected file is not valid JSON." : error.message)}</p>`; }
  }

  function makeBackupRecord(state, name, type) { const data = snapshot(state); return { id: createId("backup"), restaurantId, name, type: type || "manual", createdAt: new Date().toISOString(), schemaVersion: data.schemaVersion, size: byteSize(data), data }; }
  function createBackup(name, type) {
    let backup;
    global.AutoCodeState.update((state) => { backup = makeBackupRecord(state, name, type); state.backups.push(backup); }, `backup-${type || "manual"}-created`);
    return backup;
  }
  function renderBackups() {
    const state = global.AutoCodeState.read(); const backups = state.backups.filter((item) => !item.restaurantId || item.restaurantId === restaurantId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    document.querySelector("[data-backup-empty]").hidden = backups.length > 0;
    document.querySelector("[data-purge-all-backups]").disabled = !backups.length;
    document.querySelector("[data-backup-list]").innerHTML = backups.map((backup) => `<article class="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"><div><h3 class="font-black text-slate-950">${escapeHtml(backup.name)}</h3><p class="mt-1 text-xs text-slate-500">${new Date(backup.createdAt).toLocaleString("en-IN")} · ${Math.max(1, Math.ceil(Number(backup.size || byteSize(backup.data)) / 1024))} KB · ${escapeHtml(backup.type || "manual")}</p></div><div class="flex flex-wrap gap-3"><button data-restore-backup="${escapeHtml(backup.id)}" class="text-sm font-bold text-blue-700">Restore</button><button data-download-backup="${escapeHtml(backup.id)}" class="text-sm font-bold text-slate-700">Download</button><button data-purge-backup="${escapeHtml(backup.id)}" class="text-sm font-bold text-red-700">Purge</button></div></article>`).join("");
  }

  function importReplacement() {
    if (!pendingImport || !global.confirm("Replace all active prototype data with this validated import? A pre-import backup will be retained.")) return;
    const current = global.AutoCodeState.read(); const rollback = clone(current);
    try {
      const preImport = makeBackupRecord(current, `Pre-import ${new Date().toLocaleString("en-IN")}`, "pre-import");
      const replacement = clone(pendingImport); replacement.backups = [...replacement.backups, preImport]; replacement.activeSession = clone(current.activeSession);
      global.AutoCodeState.write(replacement, "validated-full-replacement-import");
      const check = validateState(global.AutoCodeState.read()); if (!check.valid) throw new Error("Post-import validation failed.");
      pendingImport = null; document.querySelector("[data-confirm-import]").disabled = true; document.querySelector("[data-import-file]").value = ""; document.querySelector("[data-import-summary]").hidden = true;
      feedback("Import completed. A pre-import backup was retained.", false); renderBackups();
    } catch (error) {
      try { global.AutoCodeState.write(rollback, "import-rollback"); feedback(`Import failed and previous state was restored: ${error.message}`, true); } catch (rollbackError) { feedback(`Import failed. Automatic rollback also failed: ${rollbackError.message}`, true); }
    }
  }
  function restoreBackup(id) {
    const current = global.AutoCodeState.read(); const backup = current.backups.find((item) => item.id === id); if (!backup || !global.confirm(`Restore “${backup.name}”? Current active data will be replaced.`)) return;
    const validation = validateState(backup.data); if (!validation.valid) return feedback(`Backup is invalid: ${validation.errors[0]}`, true);
    const rollback = clone(current);
    try { const replacement = clone(backup.data); replacement.backups = current.backups; replacement.activeSession = clone(current.activeSession); global.AutoCodeState.write(replacement, "backup-restored"); feedback(`Backup “${backup.name}” restored.`, false); renderBackups(); } catch (error) { try { global.AutoCodeState.write(rollback, "restore-rollback"); } catch (_rollbackError) {} feedback(`Restore failed; previous state was retained: ${error.message}`, true); }
  }
  async function downloadBackup(id) { const state = global.AutoCodeState.read(); const backup = state.backups.find((item) => item.id === id); if (!backup) return; const packaged = await exportPackage(backup.data, "backup", backup.name); downloadJson(packaged, `${filenamePart(backup.name)}-${backup.createdAt.slice(0, 10)}.json`); feedback(`Backup “${backup.name}” downloaded.`, false); }
  function purgeBackup(id) { const state = global.AutoCodeState.read(); const backup = state.backups.find((item) => item.id === id); if (!backup || !global.confirm(`Permanently purge backup “${backup.name}”? Active data will not be changed.`)) return; global.AutoCodeState.update((next) => { next.backups = next.backups.filter((item) => item.id !== id); }, "backup-purged"); feedback("Backup purged; active data was unchanged.", false); renderBackups(); }
  function purgeAll() { const count = global.AutoCodeState.read().backups.length; if (!count || !global.confirm(`Permanently purge all ${count} backups? Active data will not be changed.`)) return; global.AutoCodeState.update((state) => { state.backups = []; }, "all-backups-purged"); feedback("All backups purged; active data was unchanged.", false); renderBackups(); }

  async function resetPrototype() {
    const credential = document.querySelector("[data-reset-credential]").value; const confirmation = document.querySelector("[data-reset-confirmation]").value;
    if (confirmation !== "RESET") return feedback("Type RESET exactly to confirm the reset scope.", true);
    const state = global.AutoCodeState.read(); const admin = state.users.find((user) => user.id === session.id && user.role === "admin");
    if (!admin || (credential !== admin.password && await sha256(credential) !== admin.adminPinHash)) return feedback("Admin password or authorization PIN is incorrect.", true);
    if (!global.confirm("Final confirmation: replace all prototype data and backups with seeded demo data?")) return;
    try {
      if (document.querySelector("[data-reset-backup]").checked) { const packaged = await exportPackage(state, "pre-reset", "Final pre-reset backup"); downloadJson(packaged, `autoserve-final-pre-reset-${new Date().toISOString().slice(0, 10)}.json`); }
      try { global.localStorage.setItem("autocode.prototype.lastReset", JSON.stringify({ at: new Date().toISOString(), actorId: session.id })); } catch (_loggingError) {}
      global.AutoCodeState.reset(); global.location.assign("../login.html?reason=reset");
    } catch (error) { feedback(error.message, true); }
  }

  document.querySelector("[data-export-state]").addEventListener("click", downloadState);
  document.querySelector("[data-import-file]").addEventListener("change", (event) => inspectImport(event.target.files[0]));
  document.querySelector("[data-confirm-import]").addEventListener("click", importReplacement);
  document.querySelector("[data-backup-form]").addEventListener("submit", (event) => { event.preventDefault(); const input = event.currentTarget.elements.backupName; try { createBackup(input.value.trim(), "manual"); feedback("Manual backup created.", false); input.value = ""; renderBackups(); } catch (error) { feedback(error.message, true); } });
  document.querySelector("[data-purge-all-backups]").addEventListener("click", purgeAll);
  document.querySelector("[data-reset-prototype]").addEventListener("click", () => resetPrototype().catch((error) => feedback(error.message, true)));
  document.addEventListener("click", (event) => { const target = event.target.closest("button"); if (!target) return; if (target.dataset.restoreBackup) restoreBackup(target.dataset.restoreBackup); if (target.dataset.downloadBackup) downloadBackup(target.dataset.downloadBackup).catch((error) => feedback(error.message, true)); if (target.dataset.purgeBackup) purgeBackup(target.dataset.purgeBackup); });
  global.AutoCodeState.subscribe((state) => { if (state) renderBackups(); }); renderBackups();
})(window);
