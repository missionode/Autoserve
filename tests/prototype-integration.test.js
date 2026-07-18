"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const customerHtml = read("customers/index.html");
const restaurantHtml = read("restaurants/index.html");
const scripts = Object.fromEntries(fs.readdirSync(path.join(root, "assets/js")).filter((name) => name.endsWith(".js")).map((name) => [name, read(`assets/js/${name}`)]));

function stateHarness(initialRaw) {
  const store = new Map();
  if (initialRaw !== undefined) store.set("autocode.prototype.state", initialRaw);
  const window = { localStorage: { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) }, addEventListener() {} };
  window.window = window;
  vm.runInNewContext(scripts["state.js"], { window, console, Error, JSON, Date, Set, Number, Array, Object });
  return { api: window.AutoCodeState, window, store };
}

test("every SPA navigation link has a route panel", () => {
  for (const html of [customerHtml, restaurantHtml]) {
    const links = [...html.matchAll(/data-route-link="([^"]+)"/g)].map((match) => match[1]);
    const routes = new Set([...html.matchAll(/data-route="([^"]+)"/g)].map((match) => match[1]));
    links.forEach((route) => assert.ok(routes.has(route), `missing panel for ${route}`));
    assert.ok(routes.has("not-found"));
  }
});

test("all referenced local scripts exist and parse", () => {
  for (const html of [customerHtml, restaurantHtml]) {
    for (const match of html.matchAll(/src="\.\.\/(assets\/js\/[^"]+)"/g)) assert.ok(fs.existsSync(path.join(root, match[1])), `missing ${match[1]}`);
  }
  for (const [name, source] of Object.entries(scripts)) assert.doesNotThrow(() => new vm.Script(source, { filename: name }));
});

test("Admin-only routes and mutation controllers are role gated", () => {
  for (const route of ["admin", "reports", "settings", "data"]) assert.match(restaurantHtml, new RegExp(`data-admin-only data-route="${route}"`));
  assert.match(scripts["workspace.js"], /element\.matches\("\[data-route\]"\).*element\.remove/);
  assert.match(scripts["admin-settings.js"], /session\.role !== "admin"/);
  assert.match(scripts["data-management.js"], /session\.role !== "admin"/);
  assert.match(scripts["administration.js"], /session\.role !== "admin"/);
});

test("state seeds, revisions, clones, and rejects corrupted storage safely", () => {
  const { api } = stateHarness();
  const seeded = api.read();
  assert.equal(seeded.schemaVersion, api.schemaVersion);
  const updated = api.update((state) => state.alerts.push({ id: "contract_alert" }), "contract-test");
  assert.equal(updated.revision, seeded.revision + 1);
  const external = api.read(); external.alerts.length = 0;
  assert.equal(api.read().alerts.length, 1, "reads must be defensive clones");
  const corrupted = stateHarness("{broken");
  assert.throws(() => corrupted.api.read(), /could not be loaded safely/);
});

test("quota failures preserve a recoverable error", () => {
  const { api, window } = stateHarness(); api.read();
  window.localStorage.setItem = () => { const error = new Error("quota"); error.name = "QuotaExceededError"; throw error; };
  assert.throws(() => api.update(() => {}, "quota"), /storage is full/);
});

test("duplicate-sensitive mutations contain explicit idempotency guards", () => {
  assert.match(scripts["checkout.js"], /payment\?\.status === "success" && payment\.orderId/);
  assert.match(scripts["tracking-game.js"], /order\.items\.some\(\(item\) => item\.rewardSource === "tic_tac_toe"\)/);
  assert.match(scripts["history-reports.js"], /order\.status === "cancelled" \|\| order\.refund\?\.status === "refunded"/);
  assert.match(scripts["history-reports.js"], /order\.inventoryRestoredAt/);
  assert.match(scripts["administration.js"], /item\.stock !== selectedInventory\.stock \|\| item\.updatedAt !== selectedInventory\.updatedAt/);
});

test("local and cross-tab state writes refresh customer and restaurant consumers", () => {
  for (const name of ["menu.js", "checkout.js", "tracking-game.js", "operations.js", "administration.js", "history-reports.js"]) assert.match(scripts[name], /AutoCodeState\.subscribe/);
  assert.doesNotMatch(scripts["menu.js"], /metadata\.source === "storage"/);
  assert.doesNotMatch(scripts["checkout.js"], /metadata\.source === "storage"/);
  assert.match(scripts["state.js"], /addEventListener\("storage"/);
});

test("a storage event delivers a cloned cross-tab state update", () => {
  const store = new Map();
  function tab() {
    let storageHandler;
    const window = { localStorage: { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) }, addEventListener(type, handler) { if (type === "storage") storageHandler = handler; } };
    window.window = window;
    vm.runInNewContext(scripts["state.js"], { window, console, Error, JSON, Date, Set, Number, Array, Object });
    return { window, storageHandler };
  }
  const first = tab(), second = tab();
  first.window.AutoCodeState.read();
  let received;
  second.window.AutoCodeState.subscribe((state, metadata) => { received = { state, metadata }; });
  const updated = first.window.AutoCodeState.update((state) => state.alerts.push({ id: "cross_tab" }), "cross-tab-test");
  second.storageHandler({ key: first.window.AutoCodeState.key, newValue: JSON.stringify(updated) });
  assert.equal(received.metadata.source, "storage");
  assert.equal(received.state.alerts.at(-1).id, "cross_tab");
  received.state.alerts.length = 0;
  assert.equal(second.window.AutoCodeState.read().alerts.length, 1, "subscriber receives a defensive clone");
});

test("responsive, keyboard, dialog, and recovery structures are represented", () => {
  const combined = `${customerHtml}\n${restaurantHtml}`;
  for (const breakpoint of ["sm:", "md:", "lg:", "xl:"]) assert.ok(combined.includes(breakpoint), `missing ${breakpoint} responsive rules`);
  assert.match(combined, /class="skip-link"/);
  assert.match(combined, /aria-live="polite"/);
  assert.match(combined, /<dialog/g);
  assert.match(combined, /aria-label=/);
  for (const state of ["loading", "error", "not-found"]) assert.match(combined, new RegExp(`(?:data-ui-state|data-route)="${state}"`));
  assert.match(customerHtml, /Restaurant currently closed|data-menu-empty/);
  assert.match(restaurantHtml, /data-backup-empty|data-history-empty|data-staff-empty/);
  for (const html of [customerHtml, restaurantHtml]) {
    assert.match(html, /data-mobile-menu-button/);
    assert.match(html, /aria-expanded="false"/);
    assert.match(html, /aria-controls=/);
    assert.match(html, /data-mobile-nav class="mobile-navigation hidden"/);
    assert.match(html, /data-mobile-menu-backdrop/);
    assert.match(html, /data-close-mobile-menu/);
  }
  assert.match(scripts["workspace.js"], /event\.key !== "Escape"/);
  assert.match(scripts["workspace.js"], /closest\("\[data-route-link\]"\)/);
});

test("store QR entry preserves restaurant and table context through authentication", () => {
  assert.match(restaurantHtml, /data-route="qr"/);
  assert.match(scripts["qr-entry.js"], /searchParams\.set\("restaurant"/);
  assert.match(scripts["qr-entry.js"], /searchParams\.set\("table"/);
  assert.match(scripts["customer-entry.js"], /item\.id === restaurantReference \|\| item\.slug === restaurantReference/);
  assert.match(scripts["customer-entry.js"], /entryContext/);
  assert.match(scripts["auth.js"], /returnTo.*customers/s);
  assert.match(scripts["checkout.js"], /entryContext\?\.tableNumber/);
});

test("paid hotel orders generate KOTs, wait in the game, and use service-aware ready notices", () => {
  assert.match(scripts["checkout.js"], /kotSnapshot/);
  assert.match(scripts["checkout.js"], /kotStatus: "new"/);
  assert.match(scripts["checkout.js"], /inventoryModel = "availability"/);
  assert.match(scripts["checkout.js"], /global\.location\.hash = "\/game"/);
  assert.match(scripts["tracking-game.js"], /order\.serviceMode === "table-service"/);
  assert.match(scripts["tracking-game.js"], /Please collect token/);
  assert.match(scripts["tracking-game.js"], /will be served/);
  assert.match(scripts["hotel-availability.js"], /Limited availability/);
  assert.match(restaurantHtml, /Live KOT queue/);
});
