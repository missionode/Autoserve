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

test("customer and restaurant shells share the seeded persistent foundation", () => {
  const { api, store } = stateHarness();
  const seeded = api.read();
  assert.equal(seeded.schemaVersion, api.schemaVersion);
  assert.ok(seeded.restaurants.some((restaurant) => restaurant.id === "rest_autoserve_demo"));
  for (const role of ["customer", "admin", "staff", "super_admin", "support"]) assert.ok(seeded.users.some((user) => user.role === role), `missing seeded ${role}`);
  for (const collection of ["categories", "menuItems", "carts", "payments", "orders", "inventoryAudit", "gameAttempts", "supportTickets", "subscriptionPayments"]) assert.ok(Array.isArray(seeded[collection]), `${collection} is not reusable state`);
  assert.ok(store.has("autocode.prototype.state"), "seed was not persisted");
  assert.deepEqual(JSON.parse(JSON.stringify(api.read())), JSON.parse(JSON.stringify(seeded)), "persisted seed changed between shell reads");

  for (const [name, html] of [["customer", customerHtml], ["restaurant", restaurantHtml]]) {
    const statePosition = html.indexOf("assets/js/state.js");
    const appPosition = html.indexOf("assets/js/app.js");
    const workspacePosition = html.indexOf("assets/js/workspace.js");
    assert.ok(statePosition > -1 && appPosition > statePosition && workspacePosition > appPosition, `${name} shell does not load shared state/app before workspace`);
    assert.match(html, /assets\/css\/theme\.css/);
    assert.match(html, /data-route="not-found"/);
  }
  assert.match(scripts["workspace.js"], /workspace === "customer" \? \["customer", "guest"\] : \["admin", "staff"\]/);
  assert.match(scripts["workspace.js"], /requireRole\(allowedRoles\)/);
  assert.match(scripts["workspace.js"], /initHashRoutes/);
  assert.match(scripts["state.js"], /addEventListener\("storage"/);
  assert.match(themeCss, /\.app-shell/);
  assert.match(themeCss, /\.app-card/);
  assert.match(themeCss, /\.app-dialog/);
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

test("customer authentication offers a simulated Google flow", () => {
  const signupHtml = read("signup.html");
  assert.match(loginHtml, /data-google-auth="signin"/);
  assert.match(loginHtml, /Customer sign in with Google/);
  assert.match(loginHtml, /Google sign-in is available only for customers/);
  assert.match(signupHtml, /data-google-auth="signup"/);
  assert.match(signupHtml, /Sign up with Google/);
  assert.match(scripts["auth.js"], /function continueWithGoogle/);
  assert.match(scripts["auth.js"], /authProvider: "google"/);
  assert.match(scripts["auth.js"], /google-customer-signup/);
  assert.match(scripts["auth.js"], /google-customer-signin/);
});

test("password fields support visibility, confirmation, and strong generation", () => {
  for (const file of ["login.html", "signup.html", "restaurant-signup.html", "restaurants/index.html", "super_admin/index.html"]) assert.match(read(file), /password-controls\.js/);
  assert.match(scripts["password-controls.js"], /aria-label\", \"Show password\"/);
  assert.match(scripts["password-controls.js"], /Confirm password/);
  assert.match(scripts["password-controls.js"], /confirmAdminPin/);
  assert.match(scripts["password-controls.js"], /confirmNewPin/);
  assert.match(scripts["password-controls.js"], /Generate strong password/);
  assert.match(scripts["password-controls.js"], /crypto\.getRandomValues/);
  assert.match(scripts["password-controls.js"], /Passwords.*do not match/);
});

test("shared authentication satisfies every workspace entry and session contract", () => {
  const authPages = ["index.html", "login.html", "signup.html", "restaurant-signup.html", "forgot-password.html"];
  for (const file of authPages) {
    const html = read(file);
    assert.match(html, /Prototype|prototype/, file + " must identify the authentication simulation");
    assert.match(html, /assets\/js\/state\.js/);
    assert.match(html, /assets\/js\/app\.js/);
    assert.match(html, /assets\/js\/auth\.js/);
  }

  for (const [role, destination] of Object.entries({
    customer: "customers/",
    guest: "customers/",
    admin: "restaurants/",
    staff: "restaurants/",
    super_admin: "super_admin/",
    support: "support/"
  })) assert.match(scripts["app.js"], new RegExp(role + ': "' + destination.replace("/", "\\/") + '"'));

  assert.match(scripts["auth.js"], /function continueAsGuest/);
  assert.match(scripts["auth.js"], /function transferGuestCart/);
  assert.match(scripts["auth.js"], /candidate\.staffId/);
  assert.match(scripts["auth.js"], /if \(!user\.active\)/);
  assert.match(scripts["auth.js"], /approvalStatus !== "approved"/);
  assert.match(scripts["auth.js"], /lastLoginAt = new Date\(\)\.toISOString\(\)/);
  assert.match(scripts["auth.js"], /data-resume-session/);
  assert.match(scripts["app.js"], /function signOut\(\)/);
  assert.match(scripts["app.js"], /setSession\(null\)/);
  assert.match(scripts["app.js"], /function requireRole\(allowedRoles\)/);
  assert.match(scripts["auth.js"], /\["admin", "staff"\]\.includes\(user\.role\)/);
  assert.match(scripts["auth.js"], /role: "customer"[\s\S]*authProvider: "google"/);
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

test("restaurant subscriptions use Super Admin rates and an explicit simulated UPI AutoPay lifecycle", () => {
  const restaurantSubscriptions = scripts["restaurant-subscriptions.js"];
  const platformSubscriptions = scripts["platform-subscriptions.js"];
  assert.match(scripts["state.js"], /subscriptionPlans = \(\) =>/);
  assert.match(scripts["state.js"], /plan_starter/);
  assert.match(scripts["state.js"], /plan_growth/);
  assert.match(scripts["state.js"], /subscriptionPayments/);
  assert.match(read("restaurants/index.html"), /restaurant-subscriptions\.js/);
  assert.match(read("super_admin/index.html"), /platform-subscriptions\.js/);
  assert.match(platformSubscriptions, /dataset\.routeLink = "settings"/);
  assert.match(platformSubscriptions, /subscription_rates_updated/);
  assert.match(platformSubscriptions, /monthlyPrice/);
  assert.match(restaurantSubscriptions, /Set up simulated UPI AutoPay/);
  assert.match(restaurantSubscriptions, /restaurant-subscription-payment/);
  assert.match(restaurantSubscriptions, /priceSnapshot/);
  assert.match(restaurantSubscriptions, /setMonth\(periodEndDate\.getMonth\(\) \+ 1\)/);
  assert.match(restaurantSubscriptions, /Mandate authorization is pending/);
  assert.match(restaurantSubscriptions, /method: "upi_autopay_simulation"/);
  assert.match(restaurantSubscriptions, /payerReferenceMasked/);
  assert.match(restaurantSubscriptions, /providerMandateReference/);
  assert.match(restaurantSubscriptions, /data-cancel-autopay/);
  assert.match(restaurantSubscriptions, /paymentInFlight/);
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
  assert.match(scripts["administration.js"], /item\.stock !== selectedInventory\.stock \|\| item\.availableQuantity !== selectedInventory\.availableQuantity \|\| item\.updatedAt !== selectedInventory\.updatedAt/);
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

test("customer menu and cart enforce a valid retained customized order", () => {
  const menu = scripts["menu.js"];
  const entry = scripts["customer-entry.js"];
  for (const hook of ["data-menu-search", "data-category-list", "data-menu-grid", "data-item-form", "data-cart-items", "data-cart-subtotal", "data-cart-tax", "data-cart-total"]) {
    assert.match(customerHtml, new RegExp(hook));
  }
  for (const option of ["data-size-options", "data-spice-options", "data-addon-options", "data-item-quantity"]) {
    assert.match(customerHtml, new RegExp(option));
  }
  assert.match(customerHtml, /name="instructions"/);
  assert.match(menu, /activeCategory === "all"/);
  assert.match(menu, /includes\(searchTerm\)/);
  assert.match(menu, /\["unavailable", "sold-out", "cutoff"\]/);
  assert.match(menu, /validSize[\s\S]*validAddOns[\s\S]*validSpice/);
  assert.match(menu, /existingQuantity \+ quantity > availableQuantity\(item\)/);
  assert.match(menu, /otherQuantity \+ nextQuantity > availableQuantity\(item\)/);
  assert.match(menu, /Combo quantities cannot be changed one item at a time/);
  assert.match(menu, /entry\.comboInstance !== selected\.comboInstance/);
  assert.match(menu, /cart-item-added/);
  assert.match(menu, /cart-quantity-changed/);
  assert.match(menu, /cart-item-removed/);
  assert.match(menu, /Your current order belongs to another restaurant/);
  assert.match(entry, /conflictingCarts/);
  assert.match(entry, /global\.confirm/);
  assert.match(entry, /Restaurant change cancelled\. Your current order was kept/);
  assert.match(entry, /tableNumber: tableReference \|\| null/);
  assert.match(scripts["checkout.js"], /has updated options/);
  assert.match(scripts["checkout.js"], /now costs/);
  assert.match(scripts["checkout.js"], /Update your order before payment/);
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

test("checkout payment outcomes preserve exactly-once order, inventory, KOT, and token invariants", () => {
  const checkout = scripts["checkout.js"];
  const nonSuccessPath = checkout.slice(checkout.indexOf("function recordNonSuccess"), checkout.indexOf("function createSuccessfulOrder"));
  const successPath = checkout.slice(checkout.indexOf("function createSuccessfulOrder"), checkout.indexOf("function renderConfirmation"));

  for (const hook of ["data-checkout-form", "data-checkout-table", "data-checkout-items", "data-payment-form", "data-confirmation-content"]) {
    assert.match(customerHtml, new RegExp(hook));
  }
  for (const outcome of ["success", "failure", "cancelled", "pending"]) assert.match(customerHtml, new RegExp('value="' + outcome + '"'));
  assert.match(checkout, /function beginPayment/);
  assert.match(checkout, /recordNonSuccess\("processing"/);
  assert.match(checkout, /paymentInFlight/);
  assert.match(checkout, /clearTimeout\(paymentResolutionTimer\)/);
  assert.match(checkout, /data-resolve-payment/);
  assert.doesNotMatch(nonSuccessPath, /state\.orders\.push/);
  assert.doesNotMatch(nonSuccessPath, /availableQuantity\s*=/);
  assert.match(successPath, /payment\?\.status === "success" && payment\.orderId/);
  assert.match(successPath, /validateCart\(state\)/);
  assert.match(successPath, /restaurant\.nextToken = tokenValue \+ 1/);
  assert.match(successPath, /restaurant\.nextKot = kotValue \+ 1/);
  assert.match(successPath, /item\.availableQuantity = Math\.max/);
  assert.match(successPath, /state\.orders\.push/);
  assert.match(successPath, /paidSnapshot/);
  assert.match(successPath, /payment\.status = "success"/);
  assert.match(successPath, /payment\.orderId = orderId/);
  assert.match(successPath, /cart\.items = \[\]/);
  assert.match(checkout, /checkoutDraft\.attemptId = createId\("attempt"\)/);
  assert.match(checkout, /Payment was cancelled\. Your order has been preserved/);
  for (const detail of ["Order type", "Amount paid", "Order status", "Estimated time", "Order items", "Transaction:", "Service:"]) assert.match(checkout, new RegExp(detail));
  assert.match(checkout, /restaurant\?\.name/);
  assert.match(checkout, /escapeHtml\(order\.id\)/);
});

test("staff delegated actions use a reloadable daily administrative token", () => {
  assert.match(scripts["state.js"], /SCHEMA_VERSION = 19/);
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

test("desktop pop-down menus dismiss outside, after selection, and with Escape", () => {
  assert.match(scripts["app.js"], /function closeOpenPopdownMenus/);
  assert.match(scripts["app.js"], /event\.target\.closest\("\.desktop-nav-more"\)/);
  assert.match(scripts["app.js"], /desktop-nav-more \[data-route-link\]/);
  assert.match(scripts["app.js"], /event\.key !== "Escape"/);
  assert.match(scripts["app.js"], /querySelector\("summary"\)\?\.focus\(\)/);
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
  assert.match(scripts["state.js"], /SCHEMA_VERSION = 19/);
  assert.match(scripts["state.js"], /function sampleHistory\(\)/);
  for (const sample of ["order_sample_100", "order_sample_101", "order_sample_102", "payment_sample_100", "auth_sample_102", "game_sample_100"]) assert.match(scripts["state.js"], new RegExp(sample));
  assert.match(scripts["state.js"], /status: "delivered"/);
  assert.match(scripts["state.js"], /status: "cancelled"/);
  assert.match(scripts["state.js"], /paymentStatus: "refunded"/);
  assert.match(scripts["state.js"], /rewardSource: "tic_tac_toe"/);
  assert.match(scripts["state.js"], /!state\.orders\.some\(\(order\) => \["delivered", "cancelled"\]\.includes\(order\.status\)\)/);
  assert.match(scripts["history-reports.js"], /time: session\.role === "staff" \? "session" : "today"/);
  assert.match(scripts["history-reports.js"], /if \(reportRangeSelect\) reportRangeSelect\.value = "today"/);
  assert.match(scripts["history-reports.js"], /historyTimeSelect\.value = historyFilters\.time/);
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
  assert.match(scripts["checkout.js"], /inventoryModel = "quantity"/);
  assert.match(scripts["checkout.js"], /global\.location\.hash = "\/game"/);
  assert.match(scripts["tracking-game.js"], /order\.serviceMode === "table-service"/);
  assert.match(scripts["tracking-game.js"], /Please collect token/);
  assert.match(scripts["tracking-game.js"], /will be served/);
  assert.match(scripts["hotel-availability.js"], /Limited availability/);
  assert.match(restaurantHtml, /Live KOT queue/);
});

test("restaurant live operations enforce the complete concurrency-safe fulfillment sequence", () => {
  const operations = scripts["operations.js"];
  const tracking = scripts["tracking-game.js"];
  const chain = [
    ["payment_confirmed", "order_received"],
    ["order_received", "preparing"],
    ["preparing", "ready"],
    ["ready", "delivered"]
  ];
  for (const [current, next] of chain) assert.match(operations, new RegExp(current + ': \\{[^}]*next: "' + next + '"'));
  assert.match(operations, /sort\(\(a, b\) => new Date\(a\.createdAt\) - new Date\(b\.createdAt\)\)/);
  assert.match(operations, /data-order-status/);
  assert.match(operations, /order\.status !== expectedStatus/);
  assert.match(operations, /changed in another tab/);
  assert.match(operations, /order\.issue\?\.active[\s\S]*Resolve the active operational issue/);
  assert.match(operations, /all purchased and complimentary items are prepared and packaged/);
  assert.match(operations, /Enter the token or table number verified at handoff/);
  assert.match(operations, /expectedReferences\.includes\(normalizedReference\)/);
  assert.match(operations, /Confirm delivery of token/);
  for (const timestamp of ["acceptedAt", "preparingAt", "readyAt", "deliveredAt"]) assert.match(operations, new RegExp('order\\.' + timestamp + ' = timestamp'));
  assert.match(operations, /order\.kotStatus =/);
  assert.match(operations, /order\.timeline\.push/);
  assert.match(operations, /type: "order_ready"/);
  assert.match(operations, /const phaseTimer =/);
  assert.match(operations, /waiting since Ready/);
  assert.match(operations, /label: "preparing"/);
  assert.match(operations, /restaurant\?\.warningMinutes/);
  assert.match(operations, /restaurant\?\.delayedMinutes/);
  assert.match(operations, /\["processing", "pending"\]\.includes\(payment\.status\)/);
  assert.match(operations, /more than 5 minutes/);
  assert.match(operations, /order-issue-raised/);
  assert.match(operations, /order-issue-resolved/);
  assert.match(operations, /AutoCodeState\.subscribe/);
  assert.match(tracking, /previous !== "ready" && order\.status === "ready"/);
  assert.match(tracking, /order\.serviceMode === "table-service"/);
  assert.match(tracking, /Please collect token/);
  assert.match(tracking, /previous !== "delivered" && order\.status === "delivered"/);
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

test("customer tracking and reward games enforce one attempt and one inventory-safe reward", () => {
  const tracking = scripts["tracking-game.js"];
  const rewardPath = tracking.slice(tracking.indexOf("function completeGame"), tracking.indexOf("function computerMove"));
  const miniGames = scripts["mini-games.js"];
  assert.match(tracking, /ACTIVE TOKEN/);
  assert.match(tracking, /Current status/);
  assert.match(tracking, /elapsedText\(active\)/);
  assert.match(tracking, /Paid \$\{formatter\.format\(active\.total\)\}/);
  assert.match(tracking, /statusTracker\(active\)/);
  assert.match(tracking, /function activeOrderSummary/);
  assert.match(tracking, /Payment confirmed/);
  assert.match(tracking, /item\.sizeName/);
  assert.match(tracking, /item\.instructions/);
  assert.match(tracking, /pickup counter when Ready/);
  assert.match(tracking, /session\.role !== "customer"/);
  assert.match(tracking, /reason: "guest"/);
  assert.match(tracking, /rewardEligibleStatuses/);
  assert.match(tracking, /attempt\?\.status === "in_progress"/);
  assert.match(tracking, /nextState\.gameAttempts\.find\(\(attempt\) => attempt\.orderId === context\.order\.id && attempt\.rewardEligible\)/);
  assert.match(tracking, /claimedAttemptId = existing\.id/);
  assert.match(rewardPath, /attempt\.status = "completed"/);
  assert.match(rewardPath, /attempt\.result = result/);
  assert.match(rewardPath, /result !== "win" \|\| !attempt\.rewardEligible/);
  assert.match(rewardPath, /order\.items\.some\(\(item\) => item\.rewardSource === "tic_tac_toe"\)/);
  assert.match(rewardPath, /rewardItemAvailable\(primary\) \? primary : rewardItemAvailable\(fallback\)/);
  assert.match(tracking, /availableQuantity \?\? item\.stock/);
  assert.match(rewardPath, /reward\.availableQuantity = Math\.max\(0/);
  assert.match(rewardPath, /reward\.availabilityStatus = "sold-out"/);
  assert.match(rewardPath, /rewardLabel: "Tic-Tac-Toe Reward — Complimentary"/);
  assert.match(rewardPath, /unitPrice: 0/);
  assert.match(rewardPath, /lineTotal: 0/);
  assert.doesNotMatch(rewardPath, /order\.total\s*=/);
  assert.match(rewardPath, /rewardStatus = "manual_alternative"/);
  assert.match(tracking, /attempt\.status = "interrupted"/);
  assert.match(tracking, /attempt\.result = "ready_interruption"/);
  assert.match(tracking, /Match paused because your order is ready/);
  assert.match(tracking, /Computer’s turn/);
  assert.match(tracking, /Your turn/);
  assert.match(tracking, /gamePaused = true/);
  assert.match(tracking, /gameFinished = true/);
  assert.doesNotMatch(miniGames, /rewardSource|gameAttempts|AutoCodeState\.update/);
  for (const practice of ["memory", "tap-rush", "ludo"]) assert.match(customerHtml + miniGames, new RegExp('data-game-tab="' + practice + '"|data-game-panel="' + practice + '"'));
});

test("menu and inventory administration safely separates publishing, availability, and physical stock", () => {
  const state = scripts["state.js"];
  const admin = scripts["administration.js"];
  const availability = scripts["hotel-availability.js"];
  const checkout = scripts["checkout.js"];
  const rewards = scripts["tracking-game.js"];
  const operations = scripts["operations.js"];
  const renderAll = admin.slice(admin.indexOf("function renderAll()"), admin.indexOf("document.addEventListener", admin.indexOf("function renderAll()")));

  assert.match(state, /SCHEMA_VERSION = 19/);
  assert.match(state, /item\.availableQuantity = Math\.max\(0, Number\(item\.availableQuantity \?\? item\.stock \?\? 0\)\)/);
  assert.match(state, /if \(item\.status === "sold-out"\)[\s\S]*item\.status = "published";[\s\S]*item\.availabilityStatus = "sold-out";/);

  assert.match(admin, /session\.role !== "admin"/);
  assert.match(admin, /Published items require a category and a food image/);
  assert.match(admin, /const publishingStatus = status === "sold-out" \? "published" : status/);
  assert.match(admin, /availableQuantity: status === "sold-out" \? 0 : stock/);
  assert.match(admin, /item\.availableQuantity !== selectedInventory\.availableQuantity/);
  assert.match(admin, /item\.availableQuantity = next/);
  assert.match(admin, /item\.updatedAt !== current\.updatedAt \|\| item\.emergencyCutoff !== current\.emergencyCutoff/);
  assert.match(admin, /Reason for stopping sales/);
  assert.doesNotMatch(renderAll, /renderInventory\(/, "the availability controller must remain the sole inventory-list renderer");

  assert.match(availability, /option\[value="low"\]/);
  assert.match(availability, /option\[value="cutoff"\]/);
  assert.match(availability, /data-adjust-stock/);
  assert.match(availability, /data-toggle-cutoff/);
  assert.match(availability, /form\.dataset\.availabilityVersion = item\.updatedAt/);
  assert.match(availability, /Another tab changed/);
  assert.match(availability, /Resolve the emergency cutoff before changing normal availability/);
  assert.match(availability, /item\.availableQuantity = \["available", "limited"\]\.includes\(value\) \? quantity : 0/);
  assert.match(availability, /item\.stock = Math\.max\(Number\(item\.stock \|\| 0\), quantity\)/);
  assert.match(availability, /changeType: "availability_change"/);

  assert.match(checkout, /item\.availableQuantity = Math\.max\(0, previousQuantity - entry\.quantity\)/);
  assert.match(checkout, /item\.stock = Math\.max\(0, previousStock - entry\.quantity\)/);
  assert.match(checkout, /changeType: "paid_order_deduction"/);
  assert.match(rewards, /reward\.stock = Math\.max\(0, Number\(reward\.stock \?\? previousRewardQuantity\) - 1\)/);
  assert.match(rewards, /changeType: "reward_deduction"/);
  assert.match(operations, /availableQuantity \?\? item\.stock/);
  assert.match(operations, /lowStockThreshold/);
});

test("cancellation, reopening, history, and reports reconcile against protected order snapshots", () => {
  const history = scripts["history-reports.js"];
  const checkout = scripts["checkout.js"];
  const state = scripts["state.js"];
  const cancellation = history.slice(history.indexOf("async function submitCancellation"), history.indexOf("function reopenOrder"));
  const restoration = history.slice(history.indexOf("function restoreInventory"), history.indexOf("async function submitCancellation"));
  const reopening = history.slice(history.indexOf("function reopenOrder"), history.indexOf("function matchesDate"));
  const reports = history.slice(history.indexOf("function renderReports"), history.indexOf("function renderAll"));

  assert.match(checkout, /inventoryModel = "quantity"/);
  assert.match(state, /activePaidStatuses/);
  assert.match(state, /order\.inventoryModel = "quantity"/);
  const legacy = stateHarness().api.read();
  legacy.schemaVersion = 17;
  legacy.orders.push({ id: "active_legacy_quantity_order", restaurantId: "rest_autoserve_demo", status: "preparing", paymentStatus: "success", inventoryModel: "availability" });
  const migrated = stateHarness(JSON.stringify(legacy)).api.read();
  assert.equal(migrated.orders.find((order) => order.id === "active_legacy_quantity_order").inventoryModel, "quantity");
  assert.equal(migrated.orders.find((order) => order.id === "order_sample_100").inventoryModel, "availability", "completed legacy orders must not gain a restorable deduction");
  assert.match(history, /A cancellation reason is required/);
  assert.match(history, /Confirm the cancellation and refund/);
  assert.match(history, /MAX_PIN_FAILURES = 3/);
  assert.match(history, /RATE_LOCK_MS = 60 \* 1000/);
  assert.match(history, /recordFailedToken/);
  assert.match(cancellation, /submittedToken !== currentRestaurant\?\.administrativeToken/);
  assert.match(cancellation, /This order was already cancelled and refunded/);
  assert.match(cancellation, /order\.refund = \{[^}]*status: "refunded"/);
  assert.match(cancellation, /order\.paymentStatus = "refunded"/);
  assert.match(cancellation, /payment\.status = "refunded"/);
  assert.match(cancellation, /order\.kotStatus = "cancelled"/);
  assert.match(cancellation, /type: "refund_created"/);

  assert.match(restoration, /if \(order\.inventoryRestoredAt\) return \[\]/);
  assert.match(restoration, /order\.inventoryModel !== "quantity"/);
  assert.match(restoration, /item\.stock = previousPhysical \+ quantity/);
  assert.match(restoration, /item\.availableQuantity = previousSellable \+ quantity/);
  assert.match(restoration, /changeType: "cancellation_restoration"/);
  assert.match(restoration, /order\.inventoryRestoredAt = timestamp/);

  assert.match(reopening, /if \(session\.role !== "admin"\) return/);
  assert.match(reopening, /Only an order delivered during the current operating session can be reopened/);
  assert.match(reopening, /current\.updatedAt !== order\.updatedAt/);
  assert.match(reopening, /current\.status = "ready"/);
  assert.match(reopening, /current\.kotStatus = "ready"/);
  assert.match(reopening, /action: "delivered_order_reopened"/);
  assert.match(history, /const canReopen =/);

  assert.match(history, /session\.role === "staff" \? "session" : historyFilters\.time/);
  assert.match(history, /session\.role === "admin" && !matchesDate/);
  assert.match(history, /order\.paidSnapshot \|\|/);
  assert.match(history, /item\.instructions/);
  assert.match(reports, /order\.paidSnapshot\?\.total \?\? order\.total/);
  assert.match(reports, /realized\.forEach/);
  assert.match(reports, /order\.paidSnapshot\?\.items/);
  assert.match(reports, /const delayed = delivered\.filter/);
  assert.match(reports, /availableQuantity \?\? item\.stock/);
  assert.match(reports, /lowStockThreshold/);
});

test("profiles, Staff administration, settings, Help, and simulated AutoPay enforce role boundaries", () => {
  const account = scripts["customer-account.js"];
  const settings = scripts["admin-settings.js"];
  const subscriptions = scripts["restaurant-subscriptions.js"];
  const support = scripts["support-forms.js"];

  assert.match(account, /data-customer-profile-form/);
  assert.match(account, /function saveProfile/);
  assert.match(account, /session\.role !== "customer"/);
  assert.match(account, /entry\.id === session\.id && entry\.role === "customer" && entry\.active/);
  assert.match(account, /Another account already uses that email address or mobile number/);
  assert.match(account, /state\.activeSession\.name = name/);
  assert.match(account, /order\.paidSnapshot\?\.items/);
  assert.match(account, /reservedByItem/);
  assert.match(account, /availableQuantity \?\? item\.stock/);
  assert.match(account, /item\.instructions/);

  assert.match(settings, /session\.role !== "admin"/);
  assert.match(settings, /entry\.id === id && entry\.restaurantId === restaurantId && entry\.role === "staff"/);
  assert.match(settings, /entry\.id === editingStaffId && entry\.restaurantId === restaurantId && entry\.role === "staff"/);
  assert.match(settings, /staff-account-created/);
  assert.match(settings, /staff-activation-changed/);
  assert.match(settings, /settingsForm\.dataset\.settingsVersion/);
  assert.match(settings, /Restaurant settings changed in another tab/);
  assert.match(settings, /Next token must be greater than retained token/);
  assert.match(settings, /Add at least one table number when table service is enabled/);
  assert.match(settings, /Enable dine-in or takeaway before opening the restaurant/);
  assert.match(settings, /A selected reward item is no longer available/);
  assert.match(settings, /user\.adminPinHash !== originalHash/);
  assert.match(settings, /action: "admin_pin_replaced"/);
  assert.match(settings, /administrative_token_rotation/);

  assert.match(subscriptions, /session\.role !== "admin"/);
  assert.match(subscriptions, /Prototype AutoPay mandate/);
  assert.match(subscriptions, /Next simulated debit/);
  assert.match(subscriptions, /method: "upi_autopay_simulation"/);
  assert.match(subscriptions, /priceSnapshot/);
  assert.match(subscriptions, /payerReferenceMasked/);
  assert.match(subscriptions, /providerMandateReference/);
  assert.match(subscriptions, /prototype_autopay_cancelled/);
  assert.match(subscriptions, /No real mandate, UPI request, callback, or charge is made/);

  for (const subject of [customerHtml, restaurantHtml, read("super_admin/index.html")]) assert.match(subject, /data-route="help"/);
  assert.match(customerHtml, /Browse and order/);
  assert.match(restaurantHtml, /Guidance shown for your current/);
  assert.match(support, /requesterRole: session\.role/);
  assert.match(support, /data-my-support-tickets/);

  const legacy = stateHarness().api.read(); legacy.schemaVersion = 18; legacy.subscriptionPayments[0].priceSnapshot = undefined; legacy.restaurants[0].subscription.mandateStatus = undefined;
  const migrated = stateHarness(JSON.stringify(legacy)).api.read();
  assert.equal(migrated.schemaVersion, 19);
  assert.equal(migrated.restaurants[0].subscription.mandateStatus, "active");
  assert.ok(migrated.subscriptionPayments[0].priceSnapshot.features.length > 0);
  assert.equal(migrated.subscriptionPayments[0].method, "upi_autopay_simulation");
  assert.equal("upiId" in migrated.subscriptionPayments[0], false);
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

test("restaurant data management scopes exports and replacements without touching platform or other tenants", () => {
  const { api } = stateHarness();
  const initial = api.read();
  initial.restaurants.push({ id: "rest_other", name: "Other Restaurant" });
  initial.users.push({ id: "admin_other", restaurantId: "rest_other", role: "admin", active: true });
  initial.orders.push({ id: "order_other", restaurantId: "rest_other", customerId: "customer_other" });
  initial.backups.push({ id: "backup_other", restaurantId: "rest_other", data: {} });
  const element = { hidden: false, disabled: false, value: "", innerHTML: "", className: "", checked: false, textContent: "", addEventListener() {}, append() {}, remove() {}, closest() { return element; }, querySelector() { return element; }, querySelectorAll() { return []; }, elements: { backupName: { value: "" } } };
  const document = { querySelector() { return element; }, addEventListener() {}, createElement() { return element; }, body: element };
  const window = {
    AutoCodeApp: { getSession: () => ({ id: "admin_demo", role: "admin", restaurantId: "rest_autoserve_demo" }) },
    AutoCodeState: api,
    crypto: require("node:crypto").webcrypto,
    document,
    Blob,
    TextEncoder,
    URL: { createObjectURL: () => "blob:test", revokeObjectURL() {} },
    setTimeout() {},
    location: { assign() {} },
    confirm: () => true
  };
  window.window = window;
  vm.runInNewContext(scripts["data-management.js"], { window, document, console, JSON, Date, Set, Number, Array, Object, Blob, TextEncoder });
  const manager = window.AutoCodeDataManagement;
  const scoped = manager.scopeState(initial);
  assert.deepEqual(Array.from(scoped.restaurants, (record) => record.id), ["rest_autoserve_demo"]);
  assert.equal(scoped.users.some((record) => record.id === "admin_other"), false);
  assert.equal(scoped.orders.some((record) => record.id === "order_other"), false);
  assert.equal(scoped.backups.length, 0);
  assert.equal("platformSettings" in scoped, false);
  assert.equal(manager.validateState(scoped).valid, true);

  const imported = JSON.parse(JSON.stringify(scoped));
  imported.restaurants[0].name = "Imported Demo Restaurant";
  imported.orders = [];
  const merged = manager.mergeRestaurantState(initial, imported);
  assert.equal(merged.restaurants.find((record) => record.id === "rest_autoserve_demo").name, "Imported Demo Restaurant");
  assert.ok(merged.restaurants.some((record) => record.id === "rest_other"));
  assert.ok(merged.orders.some((record) => record.id === "order_other"));
  assert.ok(merged.backups.some((record) => record.id === "backup_other"));
  assert.deepEqual(merged.platformSettings, initial.platformSettings);
  assert.match(scripts["data-management.js"], /scopeState\(global\.AutoCodeState\.seedState\(\)\)/);
  assert.match(scripts["data-management.js"], /restaurant-prototype-reset/);
  assert.doesNotMatch(scripts["data-management.js"], /global\.AutoCodeState\.reset\(\)/);
  assert.match(scripts["data-management.js"], /platform data and other restaurants remain unchanged/i);

  const foreign = JSON.parse(JSON.stringify(scoped));
  foreign.orders.push({ id: "crafted_foreign", restaurantId: "rest_other" });
  assert.equal(manager.validateState(foreign).valid, false);
});
