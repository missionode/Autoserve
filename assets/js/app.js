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
