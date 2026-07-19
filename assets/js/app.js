(function createAutoCodeApp(global) {
  "use strict";

  const roleDestinations = {
    customer: "customers/",
    guest: "customers/",
    admin: "restaurants/",
    staff: "restaurants/"
  };

  function rootPath(pathname) {
    const path = global.location.pathname;
    const nested = /\/(customers|restaurants)\//.test(path);
    return `${nested ? "../" : "./"}${pathname || ""}`;
  }

  function getSession() {
    try {
      return global.AutoCodeState.read().activeSession;
    } catch (_error) {
      return null;
    }
  }

  function setSession(session) {
    return global.AutoCodeState.update((state) => {
      state.activeSession = session
        ? { ...session, signedInAt: session.signedInAt || new Date().toISOString() }
        : null;
    }, session ? "session-created" : "session-cleared");
  }

  function signOut() {
    setSession(null);
    global.location.assign(rootPath("login.html"));
  }

  function routeForRole(role) {
    return rootPath(roleDestinations[role] || "login.html");
  }

  function requireRole(allowedRoles) {
    const session = getSession();
    if (!session || !allowedRoles.includes(session.role)) {
      const requested = encodeURIComponent(global.location.href);
      global.location.replace(`${rootPath("login.html")}?reason=unauthorized&returnTo=${requested}`);
      return null;
    }
    return session;
  }

  function showState(name, message) {
    document.querySelectorAll("[data-ui-state]").forEach((element) => {
      element.hidden = element.dataset.uiState !== name;
    });
    const messageTarget = document.querySelector(`[data-ui-state="${name}"] [data-state-message]`);
    if (messageTarget && message) messageTarget.textContent = message;
  }

  function openDialog(dialogOrSelector) {
    const dialog = typeof dialogOrSelector === "string" ? document.querySelector(dialogOrSelector) : dialogOrSelector;
    if (!dialog || typeof dialog.showModal !== "function") return false;
    dialog.showModal();
    return true;
  }

  function closeDialog(dialogOrSelector, returnValue) {
    const dialog = typeof dialogOrSelector === "string" ? document.querySelector(dialogOrSelector) : dialogOrSelector;
    if (!dialog || typeof dialog.close !== "function") return false;
    dialog.close(returnValue || "");
    return true;
  }

  function initHashRoutes(defaultRoute) {
    const panels = Array.from(document.querySelectorAll("[data-route]"));
    const links = Array.from(document.querySelectorAll("[data-route-link]"));
    if (!panels.length) return () => {};

    const render = () => {
      const requested = global.location.hash.replace(/^#\/?/, "") || defaultRoute;
      const active = panels.some((panel) => panel.dataset.route === requested) ? requested : "not-found";
      panels.forEach((panel) => { panel.hidden = panel.dataset.route !== active; });
      links.forEach((link) => {
        const current = link.dataset.routeLink === active;
        link.setAttribute("aria-current", current ? "page" : "false");
      });
      document.title = `${active === "not-found" ? "Not Found" : active.replaceAll("-", " ")} | Autocode`;
    };

    global.addEventListener("hashchange", render);
    render();
    return () => global.removeEventListener("hashchange", render);
  }

  const actionIcons = {
    add: '<path d="M12 5v14M5 12h14"/>',
    arrow: '<path d="m9 18 6-6-6-6"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    camera: '<path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3z"/><circle cx="12" cy="13" r="3"/>',
    cart: '<circle cx="9" cy="20" r="1"/><circle cx="19" cy="20" r="1"/><path d="M3 4h2l2.5 11h10l2-7H7"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"/>',
    download: '<path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14"/>',
    edit: '<path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10zM14 7l3 3"/>',
    eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
    flag: '<path d="M5 21V4m0 1h11l-2 4 2 4H5"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8m-3 3 2 2"/>',
    logout: '<path d="M10 17l5-5-5-5m5 5H3m11-8h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5"/>',
    pay: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/>',
    print: '<path d="M7 9V3h10v6M7 18H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M7 14h10v7H7z"/>',
    qr: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v6h-6v-2"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6"/>',
    refresh: '<path d="M20 7v5h-5M4 17v-5h5M6.1 8a7 7 0 0 1 11.4-2L20 12M4 12l2.5 6a7 7 0 0 0 11.4-2"/>',
    save: '<path d="M5 3h12l2 2v16H5zM8 3v6h8V3M8 21v-7h8v7"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    home: '<path d="m3 11 9-8 9 8v10h-6v-6H9v6H3z"/>',
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    orders: '<path d="M6 3h12v18H6zM9 8h6M9 12h6M9 16h4"/>',
    inventory: '<path d="m4 7 8-4 8 4-8 4zM4 7v10l8 4 8-4V7M12 11v10"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2"/>',
    reports: '<path d="M4 20V10m5 10V4m5 16v-7m5 7V7"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.5 2.5 0 1 1 3.8 2.1c-1 .6-1.5 1.1-1.5 2.4M12 17h.01"/>'
  };

  const navigationIcons = { home: "home", menu: "menu", orders: "orders", game: "play", profile: "user", help: "help", dashboard: "dashboard", inventory: "inventory", history: "history", reports: "reports", admin: "menu", settings: "settings", data: "database", qr: "qr" };

  function enhanceMobileNavigation(root) {
    const links = [];
    if (root instanceof global.Element && root.matches(".mobile-navigation [data-route-link]")) links.push(root);
    root.querySelectorAll?.(".mobile-navigation [data-route-link]").forEach((link) => links.push(link));
    links.forEach((link) => {
      if (link.querySelector(":scope > [data-menu-icon]")) return;
      const icon = navigationIcons[link.dataset.routeLink];
      if (!icon) return;
      const visual = document.createElement("span");
      visual.dataset.menuIcon = icon;
      visual.setAttribute("aria-hidden", "true");
      visual.className = "mobile-nav-icon";
      visual.innerHTML = `<svg viewBox="0 0 24 24" focusable="false">${actionIcons[icon]}</svg>`;
      link.prepend(visual);
    });
  }

  function iconForAction(element) {
    const text = element.textContent.replace(/\s+/g, " ").trim().toLowerCase();
    if (!text || text === "×" || element.closest("nav") || element.matches('[data-close-mobile-menu], [data-mobile-menu-button], [data-cart-increase], [data-cart-decrease], [data-category-move]') || element.querySelector('[aria-hidden="true"]')) return null;
    if (/sign out/.test(text)) return "logout";
    if (/scan|camera/.test(text)) return "camera";
    if (/qr code|generate qr/.test(text)) return "qr";
    if (/print/.test(text)) return "print";
    if (/copy/.test(text)) return "copy";
    if (/download|export/.test(text)) return "download";
    if (/purge|reset to|delete|remove|archive|cancel|dismiss|deactivate/.test(text)) return "trash";
    if (/save/.test(text)) return "save";
    if (/replace pin|authorize/.test(text)) return "key";
    if (/confirm|resolve as success|mark ready|delivered|accept order|start preparation|activate/.test(text)) return "check";
    if (/reload|restore|reopen|resume|reorder|new game/.test(text)) return "refresh";
    if (/edit|customize|adjust|rename/.test(text)) return "edit";
    if (/receipt/.test(text)) return "receipt";
    if (/view|open full|details/.test(text)) return "eye";
    if (/pay|payment/.test(text)) return "pay";
    if (/order|cart|add to order|browse menu/.test(text)) return "cart";
    if (/play/.test(text)) return "play";
    if (/flag|issue|failure|cutoff/.test(text)) return "flag";
    if (/create account|add staff|create menu|^add$|^create$/.test(text)) return text.includes("staff") || text.includes("account") ? "user" : "add";
    if (/return|back/.test(text)) return "back";
    if (/sign in|continue as guest/.test(text)) return "user";
    if (/recovery/.test(text)) return "key";
    if (/continue|next/.test(text)) return "arrow";
    return null;
  }

  function enhanceAction(element) {
    if (!(element instanceof global.Element) || element.querySelector(":scope > [data-cta-icon]")) return;
    const icon = iconForAction(element);
    if (!icon) return;
    const visual = document.createElement("span");
    visual.dataset.ctaIcon = icon;
    visual.setAttribute("aria-hidden", "true");
    visual.className = "cta-icon";
    visual.innerHTML = `<svg viewBox="0 0 24 24" focusable="false">${actionIcons[icon]}</svg>`;
    element.prepend(visual);
    element.classList.add("icon-cta");
  }

  function enhanceActions(root) {
    enhanceMobileNavigation(root);
    if (root instanceof global.Element && root.matches("button, a")) enhanceAction(root);
    root.querySelectorAll?.("button, a").forEach(enhanceAction);
  }

  enhanceActions(document);
  new MutationObserver((mutations) => mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => { if (node.nodeType === 1) enhanceActions(node); }))).observe(document.body, { childList: true, subtree: true });

  global.AutoCodeApp = Object.freeze({
    getSession,
    setSession,
    signOut,
    routeForRole,
    requireRole,
    showState,
    openDialog,
    closeDialog,
    initHashRoutes,
    rootPath
  });
})(window);
