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
const loginHtml = read("login.html");
const restaurantSignupHtml = read("restaurant-signup.html");
const themeCss = read("assets/css/theme.css");
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
    for (const match of html.matchAll(/src="\.\.\/(assets\/js\/[^"]+)"/g)) {
      const localPath = match[1].split("?")[0];
      assert.ok(fs.existsSync(path.join(root, localPath)), `missing ${localPath}`);
    }
  }
  for (const [name, source] of Object.entries(scripts)) assert.doesNotThrow(() => new vm.Script(source, { filename: name }));
});

test("login separates customer and restaurant registration paths", () => {
  assert.match(loginHtml, /Welcome back to Autoserve[\s\S]*Create customer account/);
  assert.match(loginHtml, /Are you a restaurant\?/);
  assert.match(loginHtml, /href="\.\/restaurant-signup\.html"/);
  assert.match(restaurantSignupHtml, /Restaurant company onboarding/);
  for (const field of ["legalName", "restaurantName", "businessType", "gstin", "fssaiNumber", "fssaiExpiry", "tradeLicense", "tradeLicenseExpiry", "pan", "address", "contactPhone", "complaintPhone", "dineInServiceMode", "adminName", "adminEmail", "adminPin"]) assert.match(restaurantSignupHtml, new RegExp(`name="${field}"`));
  assert.match(scripts["auth.js"], /function handleRestaurantSignup/);
  assert.match(scripts["auth.js"], /restaurant-company-created/);
  assert.match(scripts["auth.js"], /verificationStatus: "prototype_unverified"/);
  assert.match(scripts["auth.js"], /page === "restaurant-signup"/);
});

test("Super Admin login routes to a platform-wide user and restaurant dashboard", () => {
  const superAdminHtml = read("super_admin/index.html");
  assert.match(loginHtml, /Super Admin:<\/strong> superadmin \/ SuperAdmin@123/);
  assert.match(scripts["state.js"], /username: "superadmin"/);
  assert.match(scripts["state.js"], /role: "super_admin"/);
  assert.match(scripts["app.js"], /super_admin: "super_admin\/"/);
  assert.match(scripts["auth.js"], /normalized\(candidate\.username\) === identifier/);
  assert.match(superAdminHtml, /Super Admin<\/h1>/);
  assert.match(superAdminHtml, /data-open-create-user/);
  assert.match(superAdminHtml, /data-platform-restaurants/);
  assert.match(superAdminHtml, /data-platform-users/);
  assert.match(scripts["super-admin.js"], /requireRole\(\["super_admin"\]\)/);
  assert.match(scripts["super-admin.js"], /super-admin-user-created/);
  assert.match(scripts["super-admin.js"], /restaurant_admin_impersonation/);
});

test("Support account receives Help requests from every workspace", () => {
  const supportHtml = read("support/index.html");
  const superAdminHtml = read("super_admin/index.html");
  assert.match(loginHtml, /Support:<\/strong> support \/ Support@123/);
  assert.match(scripts["state.js"], /role: "support"/);
  assert.match(scripts["state.js"], /supportTickets: sampleSupportTickets\(\)/);
  assert.match(scripts["app.js"], /support: "support\/"/);
  for (const html of [customerHtml, restaurantHtml, superAdminHtml]) {
    assert.match(html, /data-route="help"/);
    assert.match(html, /support-forms\.js/);
  }
  assert.match(scripts["support-forms.js"], /support-ticket-created/);
  assert.match(scripts["support-forms.js"], /requesterRole: session\.role/);
  assert.match(supportHtml, /data-support-ticket-list/);
  assert.match(supportHtml, /data-support-reply-form/);
  for (const route of ["dashboard", "requests", "activity"]) {
    assert.match(supportHtml, new RegExp(`data-route-link="${route}"`));
    assert.match(supportHtml, new RegExp(`data-route="${route}"`));
  }
  assert.match(supportHtml, /data-support-mobile-menu/);
  for (const sample of ["support_ticket_sample_100", "support_ticket_sample_101", "support_ticket_sample_102"]) assert.match(scripts["state.js"], new RegExp(sample));
  assert.match(scripts["support-dashboard.js"], /requireRole\(\["support"\]\)/);
  assert.match(scripts["support-dashboard.js"], /support-ticket-replied/);
  assert.match(scripts["support-dashboard.js"], /support-ticket-status-changed/);
});

test("new restaurants require Super Admin licence approval before operations", () => {
  assert.match(scripts["auth.js"], /approvalStatus = "pending"/);
  assert.match(scripts["auth.js"], /awaiting Super Admin approval/);
  assert.match(scripts["auth.js"], /reason=pending-approval/);
  assert.match(scripts["workspace.js"], /restaurant\?\.approvalStatus !== "approved"/);
  assert.match(scripts["super-admin.js"], /data-approve-restaurant/);
  assert.match(scripts["super-admin.js"], /data-reject-restaurant/);
  assert.match(scripts["super-admin.js"], /restaurant_approved/);
  assert.match(scripts["super-admin.js"], /restaurant_rejected/);
  assert.match(scripts["super-admin.js"], /prototype_approved/);
});

test("Super Admin exposes scalable header pages for registered restaurants", () => {
  const html = read("super_admin/index.html");
  for (const route of ["dashboard", "restaurants", "users", "activity"]) { assert.match(html, new RegExp(`data-route-link="${route}"`)); assert.match(html, new RegExp(`data-route="${route}"`)); }
  assert.match(html, /data-super-mobile-nav/);
  assert.match(html, /Search name, company or email/);
  assert.match(scripts["super-admin.js"], /initHashRoutes\("dashboard"\)/);
  assert.match(scripts["super-admin.js"], /closeMobileNavigation/);
  assert.match(scripts["app.js"], /restaurants: "home"/);
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
  assert.match(themeCss, /@media \(min-width: 768px\)[\s\S]*?\.mobile-menu-button,[\s\S]*?display: none !important;/);
  assert.match(scripts["workspace.js"], /event\.key !== "Escape"/);
  assert.match(scripts["workspace.js"], /closest\("\[data-route-link\]"\)/);
});

test("customer-facing ordering language matches a restaurant workflow", () => {
  for (const label of ["View order", "Add to order", "Edit order", "Your order", "Review and pay"]) assert.match(customerHtml, new RegExp(label));
  for (const legacyLabel of [">Cart<", "Add to cart", "Edit cart", "Your cart", "in cart"]) assert.doesNotMatch(customerHtml, new RegExp(legacyLabel, "i"));
  assert.match(scripts["menu.js"], /Item added to your order/);
  assert.match(scripts["checkout.js"], /Your order has been preserved/);
});

test("menu cards disclose defaults and support one-tap ordering", () => {
  assert.match(scripts["menu.js"], /Quick-add defaults/);
  assert.match(scripts["menu.js"], /No add-ons/);
  assert.match(scripts["menu.js"], /data-quick-add=/);
  assert.match(scripts["menu.js"], /aria-hidden="true">⚡<\/span><span>Quick add/);
  assert.match(scripts["menu.js"], /function quickAddItem/);
  assert.match(scripts["menu.js"], /item\.sizes\?\.\[0\]/);
  assert.match(scripts["menu.js"], /item\.spiceLevels\?\.\[0\]/);
  assert.match(scripts["menu.js"], /quick-order-item-added/);
});

test("digital menu uses local restaurant photography with accessible fallbacks", () => {
  for (const image of ["classic-veg-burger.jpg", "seasoned-fries.jpg", "cold-coffee.jpg", "chocolate-brownie.jpg"]) {
    assert.ok(fs.existsSync(path.join(root, "assets/images/menu", image)), `missing menu photograph ${image}`);
    assert.match(scripts["state.js"], new RegExp(image.replace(".", "\\.")));
  }
  assert.match(scripts["menu.js"], /itemVisual\(item/);
  assert.match(scripts["menu.js"], /loading="lazy" decoding="async"/);
  assert.match(customerHtml, /data-item-image hidden/);
  assert.match(scripts["checkout.js"], /imageSource\(item\)/);
  assert.match(scripts["hotel-availability.js"], /hydrateFoodImages\(list, items\)/);
  assert.match(scripts["administration.js"], /hydrateFoodImages\(list, items\)/);
  assert.match(scripts["administration.js"], /hydrateFoodImages\(document\.querySelector\("\[data-admin-menu-list\]"\), items\)/);
  for (const name of ["menu.js", "checkout.js", "hotel-availability.js", "administration.js"]) assert.match(scripts[name], /imagePath \|\| item\?*\.imageUrl|item\?\.imagePath \|\| item\?\.imageUrl/);
});

test("checkout respects restaurant fulfillment preferences", () => {
  assert.match(customerHtml, /data-service-preference/);
  assert.match(customerHtml, /data-service-option="self-service"/);
  assert.match(customerHtml, /data-service-option="table-service"/);
  assert.match(customerHtml, /name="terms" value="accepted" type="checkbox" checked/);
  assert.match(scripts["state.js"], /dineInServiceMode: "both"/);
  assert.match(scripts["admin-settings.js"], /name="dineInServiceMode"/);
  assert.match(scripts["admin-settings.js"], /Self-service pickup only/);
  assert.match(scripts["admin-settings.js"], /Table service only/);
  assert.match(scripts["checkout.js"], /serviceField\.hidden = orderType !== "dine-in"/);
  assert.match(scripts["checkout.js"], /orderType === "takeaway" \? "self-service"/);
  assert.match(scripts["checkout.js"], /serviceMode !== configuredMode/);
});

test("staff delegated actions use a reloadable daily administrative token", () => {
  assert.match(scripts["state.js"], /SCHEMA_VERSION = 15/);
  assert.match(scripts["state.js"], /administrativeToken: createAdministrativeToken\(\)/);
  assert.match(scripts["state.js"], /administrativeTokenExpiresAt: nextLocalMidnight\(\)/);
  assert.match(scripts["admin-settings.js"], /Daily administrative token/);
  assert.match(scripts["admin-settings.js"], /data-reload-admin-token/);
  assert.match(scripts["admin-settings.js"], /rotateAdministrativeToken\("manual_reload"\)/);
  assert.match(scripts["admin-settings.js"], /scheduleAdministrativeTokenRotation\(\)/);
  assert.match(scripts["history-reports.js"], /submittedToken === restaurant\?\.administrativeToken/);
  assert.match(scripts["history-reports.js"], /administrativeTokenExpiresAt/);
  assert.match(scripts["history-reports.js"], /expired_administrative_token/);
});

test("all availability statuses collect and enforce meaningful details", () => {
  assert.match(scripts["hotel-availability.js"], /Quantity remaining/);
  assert.match(scripts["hotel-availability.js"], /Quantity ready to sell/);
  assert.match(scripts["hotel-availability.js"], /Staff reason/);
  assert.match(scripts["hotel-availability.js"], /\["available", "limited"\]\.includes/);
  assert.match(scripts["hotel-availability.js"], /\["unavailable", "sold-out"\]\.includes/);
  assert.match(scripts["hotel-availability.js"], /item\.availableQuantity/);
  assert.match(scripts["hotel-availability.js"], /item\.availabilityNote/);
  assert.match(scripts["menu.js"], /Only \$\{availableQuantity\(item\)\} left/);
  assert.match(scripts["checkout.js"], /quantity > remaining/);
  assert.match(scripts["checkout.js"], /item\.availableQuantity === 0/);
});

test("adding food briefly confirms the selection and exposes a compact order review action", () => {
  assert.match(customerHtml, /data-floating-order/);
  assert.match(customerHtml, /data-floating-order-count/);
  assert.match(customerHtml, /data-floating-order-total/);
  assert.match(customerHtml, /customer-order-action\.js\?v=/);
  assert.match(scripts["menu.js"], /feedbackDismissTimer = global\.setTimeout/);
  assert.match(scripts["menu.js"], /}, 2400\)/);
  assert.match(scripts["customer-order-action.js"], /hasItems && route !== "checkout"/);
  assert.match(scripts["customer-order-action.js"], /AutoCodeState\.subscribe/);
  assert.match(scripts["customer-order-action.js"], /addEventListener\("hashchange", synchronizeRouteVisibility\)/);
  assert.match(themeCss, /\.floating-order-action\.is-visible\s*{\s*display: inline-flex;/);
  assert.match(scripts["customer-order-action.js"], /Review your order:/);
});

test("customer desktop header provides navigation without the mobile menu", () => {
  assert.match(customerHtml, /<nav class="desktop-navigation" aria-label="Customer navigation">/);
  assert.match(themeCss, /@media \(min-width: 768px\)[\s\S]*?\.desktop-navigation\s*{[\s\S]*?display: flex;/);
  assert.match(themeCss, /\.mobile-menu-button,[\s\S]*?display: none !important;/);
});

test("restaurant desktop header provides role-aware operations navigation", () => {
  assert.match(restaurantHtml, /<nav class="desktop-navigation" aria-label="Restaurant navigation">/);
  assert.match(restaurantHtml, /data-route-link="dashboard"/);
  assert.match(restaurantHtml, /data-admin-only class="desktop-nav-more"/);
  for (const route of ["admin", "settings", "data", "qr"]) assert.match(restaurantHtml, new RegExp(`data-route-link="${route}"`));
  assert.match(themeCss, /\.desktop-nav-more > div/);
  assert.match(scripts["workspace.js"], /\.desktop-nav-more \[data-route-link\]/);
});

test("workspace headers remain compact across tablet and desktop sizes", () => {
  for (const html of [restaurantHtml, customerHtml]) {
    assert.match(html, /data-route-link="help"[^>]*class="desktop-nav-icon"/);
    assert.match(html, /aria-label="Help and FAQ"/);
    assert.doesNotMatch(html, /order-3 flex w-full/);
  }
  assert.match(themeCss, /@media \(min-width: 768px\) and \(max-width: 1023px\)/);
  assert.match(themeCss, /\.mobile-menu-button\s*{\s*display: inline-flex !important;/);
  assert.match(themeCss, /\.desktop-navigation \.desktop-nav-icon/);
});

test("meaningful CTAs receive consistent accessible icons across user roles", () => {
  assert.match(scripts["app.js"], /function iconForAction/);
  assert.match(scripts["app.js"], /new MutationObserver/);
  assert.match(scripts["app.js"], /element\.closest\("nav"\)/);
  assert.match(scripts["app.js"], /element\.querySelector\('\[aria-hidden="true"\]'\)/);
  for (const icon of ["cart", "save", "trash", "edit", "print", "qr", "camera", "logout", "receipt"]) assert.match(scripts["app.js"], new RegExp(`${icon}:`));
  assert.match(themeCss, /\.icon-cta\s*{/);
  assert.match(themeCss, /\.cta-icon svg\s*{/);
});

test("every mobile workspace destination receives a corresponding menu icon", () => {
  assert.match(scripts["app.js"], /const navigationIcons =/);
  for (const route of ["home", "menu", "orders", "game", "profile", "help", "dashboard", "inventory", "history", "reports", "admin", "settings", "data", "qr"]) {
    assert.match(scripts["app.js"], new RegExp(`${route}:`));
  }
  assert.match(scripts["app.js"], /\.mobile-navigation \[data-route-link\]/);
  assert.match(scripts["app.js"], /data\.menuIcon|dataset\.menuIcon/);
  assert.match(themeCss, /\.mobile-nav-icon\s*{/);
  assert.match(themeCss, /\.mobile-navigation a\[aria-current="page"\] \.mobile-nav-icon/);
});

test("demo state includes coherent order, payment, reward, and cancellation history", () => {
  assert.match(scripts["state.js"], /SCHEMA_VERSION = 15/);
  assert.match(scripts["state.js"], /function sampleHistory\(\)/);
  for (const sample of ["order_sample_100", "order_sample_101", "order_sample_102", "payment_sample_100", "auth_sample_102", "game_sample_100"]) assert.match(scripts["state.js"], new RegExp(sample));
  assert.match(scripts["state.js"], /status: "delivered"/);
  assert.match(scripts["state.js"], /status: "cancelled"/);
  assert.match(scripts["state.js"], /paymentStatus: "refunded"/);
  assert.match(scripts["state.js"], /rewardSource: "tic_tac_toe"/);
  assert.match(scripts["state.js"], /!state\.orders\.some\(\(order\) => \["delivered", "cancelled"\]\.includes\(order\.status\)\)/);
  assert.match(scripts["history-reports.js"], /time: "today"/);
  assert.match(scripts["history-reports.js"], /if \(reportRangeSelect\) reportRangeSelect\.value = "today"/);
  assert.match(scripts["history-reports.js"], /if \(historyTimeSelect\) historyTimeSelect\.value = "today"/);
});

test("store QR entry preserves restaurant and table context through authentication", () => {
  assert.match(restaurantHtml, /data-route="qr"/);
  assert.match(scripts["qr-entry.js"], /searchParams\.set\("restaurant"/);
  assert.match(scripts["qr-entry.js"], /searchParams\.set\("table"/);
  assert.match(scripts["customer-entry.js"], /item\.id === restaurantReference \|\| item\.slug === restaurantReference/);
  assert.match(scripts["customer-entry.js"], /entryContext/);
  assert.match(scripts["auth.js"], /returnTo.*customers/s);
  assert.match(scripts["checkout.js"], /entryContext\?\.tableNumber/);
  assert.match(scripts["state.js"], /tableNumbers: \["T01"/);
  assert.match(scripts["state.js"], /if \(state\.schemaVersion === 3\)/);
  assert.match(scripts["admin-settings.js"], /name="tableNumbers"/);
  assert.match(scripts["admin-settings.js"], /restaurant\.tableNumbers \|\| \[\]/);
  assert.match(scripts["qr-entry.js"], /value="counter"/);
  assert.match(scripts["qr-entry.js"], /value="table"/);
  assert.match(scripts["qr-entry.js"], /configuredTables\.includes\(table\)/);
  assert.match(scripts["qr-entry.js"], /searchParams\.set\("service"/);
  assert.match(scripts["customer-entry.js"], /serviceMode: serviceReference/);
  assert.match(scripts["checkout.js"], /entryContext\?\.serviceMode/);
});

test("QR cards include configurable restaurant branding and print details", () => {
  assert.ok(fs.existsSync(path.join(root, "assets/images/branding/demo-kitchen-logo.jpg")), "missing demo restaurant logo");
  for (const field of ["brandLogoPath", "complaintPhone", "qrGuestMessage"]) {
    assert.match(scripts["state.js"], new RegExp(field));
    assert.match(scripts["admin-settings.js"], new RegExp(`name="${field}"`));
  }
  assert.match(scripts["qr-entry.js"], /data-printable-qr/);
  assert.match(scripts["qr-entry.js"], /Powered by<\/span><img src="\.\.\/design_template\/Autoserve%20logo\.svg" alt="Autoserve"/);
  assert.match(scripts["qr-entry.js"], /Questions or complaints/);
  assert.match(scripts["qr-entry.js"], /restaurant\.brandLogoPath/);
  assert.match(scripts["qr-entry.js"], /restaurant\.complaintPhone/);
  assert.match(themeCss, /@media print/);
  assert.match(themeCss, /@page \{ size: A5 portrait; margin: 0; \}/);
  assert.match(themeCss, /\[data-printable-qr\]/);
  assert.match(scripts["qr-entry.js"], /document\.title = ""/);
  assert.match(scripts["qr-entry.js"], /afterprint/);
  assert.match(scripts["qr-entry.js"], /All restaurant tables/);
  assert.match(scripts["qr-entry.js"], /configuredTables\.slice\(1\)/);
  assert.match(scripts["qr-entry.js"], /card\.classList\.add\("qr-print-copy"\)/);
  assert.match(themeCss, /width: 148mm; height: 210mm/);
  assert.match(themeCss, /\[data-printable-qr\]:last-child/);
});

test("customer home opens a validated camera QR ordering flow", () => {
  assert.match(customerHtml, /data-open-qr-scanner/);
  assert.match(customerHtml, /id="qr-scanner-dialog"/);
  assert.match(customerHtml, /data-qr-video/);
  assert.match(customerHtml, /customer-qr-scanner\.js/);
  assert.match(scripts["customer-qr-scanner.js"], /getUserMedia/);
  assert.match(scripts["customer-qr-scanner.js"], /BarcodeDetector/);
  assert.match(scripts["customer-qr-scanner.js"], /target\.origin !== global\.location\.origin/);
  assert.match(scripts["customer-qr-scanner.js"], /target\.searchParams\.get\("restaurant"\)/);
  assert.match(scripts["customer-qr-scanner.js"], /getTracks\(\).*track\.stop/);
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

test("post-payment game shows an order-based countdown and simulates meal readiness", () => {
  assert.match(scripts["checkout.js"], /const estimatedMinutes = Math\.max/);
  assert.match(scripts["checkout.js"], /estimatedMinutes \* 5000/);
  assert.match(scripts["checkout.js"], /simulationReadyAt/);
  assert.match(scripts["checkout.js"], /global\.location\.hash = "\/game"/);
  assert.match(scripts["tracking-game.js"], /function preparationCountdown/);
  assert.match(scripts["tracking-game.js"], /Demo meal timer/);
  assert.match(scripts["tracking-game.js"], /function simulatePreparation/);
  assert.match(scripts["tracking-game.js"], /order_received.*preparing.*ready/s);
  assert.match(scripts["tracking-game.js"], /demo-meal-preparation-progressed/);
  assert.match(scripts["tracking-game.js"], /setInterval\(\(\) => \{ simulatePreparation\(\); renderTracking\(\); \}, 1000\)/);
});

test("customer game corner includes unlimited practice mini-games", () => {
  for (const game of ["tic-tac-toe", "memory", "tap-rush"]) {
    assert.match(customerHtml, new RegExp(`data-game-tab="${game}"`));
    assert.match(customerHtml, new RegExp(`data-game-panel="${game}"`));
  }
  assert.match(customerHtml, /mini-games\.js/);
  assert.match(scripts["mini-games.js"], /function startMemory/);
  assert.match(scripts["mini-games.js"], /function startTap/);
  assert.match(scripts["mini-games.js"], /data-game-tab=\"ludo\"/);
  assert.match(scripts["mini-games.js"], /data-game-panel=\"ludo\"/);
  assert.match(scripts["mini-games.js"], /function playerRoll/);
  assert.match(scripts["mini-games.js"], /function computerRoll/);
  assert.match(customerHtml, /Only Tic-Tac-Toe uses the complimentary reward attempt/);
});

test("digital menu presents an Admin-configurable featured combo for guests and customers", () => {
  assert.match(customerHtml, /data-combo-section/);
  assert.match(scripts["state.js"], /comboSectionTitle: "Popular meal combos"/);
  assert.match(scripts["state.js"], /combos: \[\{ id: "combo_signature"/);
  assert.match(scripts["admin-settings.js"], /Digital-menu combo manager/);
  assert.match(scripts["admin-settings.js"], /data-combo-item-search/);
  assert.match(scripts["admin-settings.js"], /data-combo-item-chips/);
  assert.match(scripts["admin-settings.js"], /combo-created/);
  assert.match(scripts["menu.js"], /function renderCombo/);
  assert.match(scripts["menu.js"], /function addCombo/);
  assert.match(scripts["menu.js"], /featured-combo-added/);
  assert.match(scripts["checkout.js"], /const comboGroups = new Map\(\)/);
  assert.match(scripts["checkout.js"], /combo\.itemIds\.includes\(item\.id\)/);
  assert.match(scripts["menu.js"], /aria-roledescription="carousel"/);
  assert.match(scripts["menu.js"], /data-combo-prev/);
  assert.match(scripts["menu.js"], /data-combo-next/);
  assert.doesNotMatch(scripts["menu.js"], /data-combo-toggle/);
  assert.doesNotMatch(scripts["menu.js"], />Play<|>Pause</);
  assert.match(scripts["menu.js"], /setInterval[\s\S]*5000/);
  assert.match(scripts["menu.js"], /pointerenter/);
});
