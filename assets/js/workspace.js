(function initializeWorkspace(global) {
  "use strict";

  const workspace = document.body.dataset.workspace;
  const allowedRoles = workspace === "customer" ? ["customer", "guest"] : ["admin", "staff"];
  const session = global.AutoCodeApp.requireRole(allowedRoles);
  if (!session) return;
  if (global.AutoCodeEntryError) {
    global.AutoCodeApp.showState("error", global.AutoCodeEntryError);
    return;
  }

  document.querySelectorAll("[data-session-name]").forEach((element) => { element.textContent = session.name; });
  document.querySelectorAll("[data-session-role]").forEach((element) => { element.textContent = session.role; });
  document.querySelectorAll("[data-guest-only]").forEach((element) => { element.hidden = session.role !== "guest"; });
  document.querySelectorAll("[data-customer-only]").forEach((element) => { element.hidden = session.role !== "customer"; });
  document.querySelectorAll("[data-admin-only]").forEach((element) => {
    if (session.role === "admin") return;
    if (element.matches("[data-route]")) element.remove();
    else element.hidden = true;
  });
  document.querySelectorAll("[data-sign-out]").forEach((button) => button.addEventListener("click", global.AutoCodeApp.signOut));

  const menuButton = document.querySelector("[data-mobile-menu-button]");
  const mobileNavigation = document.querySelector("[data-mobile-nav]");
  const menuBackdrop = document.querySelector("[data-mobile-menu-backdrop]");
  const menuCloseButton = document.querySelector("[data-close-mobile-menu]");
  function synchronizeNavigation() {
    if (!menuButton || !mobileNavigation) return;
    mobileNavigation.classList.toggle("hidden", menuButton.getAttribute("aria-expanded") !== "true");
    menuBackdrop?.classList.toggle("hidden", menuButton.getAttribute("aria-expanded") !== "true");
  }
  function closeMobileMenu() {
    if (!menuButton || !mobileNavigation) return;
    mobileNavigation.classList.add("hidden");
    menuBackdrop?.classList.add("hidden");
    document.body.classList.remove("mobile-menu-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.querySelector(".sr-only").textContent = `Open ${workspace} navigation`;
  }
  if (menuButton && mobileNavigation) {
    menuButton.addEventListener("click", () => {
      const opening = mobileNavigation.classList.contains("hidden");
      mobileNavigation.classList.toggle("hidden", !opening);
      menuBackdrop?.classList.toggle("hidden", !opening);
      document.body.classList.toggle("mobile-menu-open", opening);
      menuButton.setAttribute("aria-expanded", String(opening));
      menuButton.querySelector(".sr-only").textContent = `${opening ? "Close" : "Open"} ${workspace} navigation`;
      if (opening) global.setTimeout(() => menuCloseButton?.focus(), 0);
    });
    mobileNavigation.addEventListener("click", (event) => { if (event.target.closest("[data-route-link]")) closeMobileMenu(); });
    menuBackdrop?.addEventListener("click", closeMobileMenu);
    menuCloseButton?.addEventListener("click", () => { closeMobileMenu(); menuButton.focus(); });
    global.addEventListener("hashchange", closeMobileMenu);
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || mobileNavigation.classList.contains("hidden")) return;
      closeMobileMenu();
      menuButton.focus();
    });
    synchronizeNavigation();
  }

  try {
    const state = global.AutoCodeState.read();
    const restaurant = state.restaurants.find((item) => item.id === session.restaurantId) || state.restaurants[0];
    document.querySelectorAll("[data-restaurant-name]").forEach((element) => {
      element.textContent = restaurant ? restaurant.name : "Restaurant unavailable";
    });
    document.querySelectorAll("[data-menu-count]").forEach((element) => {
      element.textContent = String(state.menuItems.filter((item) => item.restaurantId === restaurant?.id && item.status === "published").length);
    });
    document.querySelectorAll("[data-order-count]").forEach((element) => {
      element.textContent = String(state.orders.filter((order) => order.restaurantId === restaurant?.id && !["delivered", "cancelled"].includes(order.status)).length);
    });
    document.querySelectorAll("[data-low-stock-count]").forEach((element) => {
      element.textContent = String(state.menuItems.filter((item) => item.restaurantId === restaurant?.id && ["unavailable", "sold-out"].includes(item.availabilityStatus)).length);
    });
    global.AutoCodeApp.showState("content");
  } catch (_error) {
    global.AutoCodeApp.showState("error", "Stored prototype data could not be loaded safely.");
  }

  const defaultRoute = workspace === "customer" ? "home" : "dashboard";
  global.AutoCodeApp.initHashRoutes(defaultRoute);

  document.querySelectorAll(".desktop-nav-more [data-route-link]").forEach((link) => link.addEventListener("click", () => {
    link.closest("details")?.removeAttribute("open");
  }));

  global.AutoCodeState.subscribe((state, metadata) => {
    const syncMessage = document.querySelector("[data-sync-message]");
    if (!syncMessage || metadata.source !== "storage") return;
    syncMessage.hidden = false;
    syncMessage.textContent = state ? "Workspace updated from another open tab." : "Another tab sent invalid prototype data.";
    global.setTimeout(() => { syncMessage.hidden = true; }, 3500);
  });
})(window);
