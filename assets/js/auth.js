(function initializeAuthentication(global) {
  "use strict";

  const page = document.body.dataset.authPage;
  const stateApi = global.AutoCodeState;
  const app = global.AutoCodeApp;

  function normalized(value) {
    return String(value || "").trim().toLowerCase();
  }

  function setFeedback(message, type) {
    const feedback = document.querySelector("[data-auth-feedback]");
    if (!feedback) return;
    feedback.hidden = false;
    feedback.textContent = message;
    feedback.className = type === "error"
      ? "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
      : "rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800";
  }

  function redirectSession(session) {
    const returnTo = new URLSearchParams(global.location.search).get("returnTo");
    if (returnTo && ["customer", "guest"].includes(session.role)) {
      try {
        const target = new URL(returnTo, global.location.href);
        const sameLocation = target.origin === global.location.origin || (target.protocol === "file:" && global.location.protocol === "file:");
        if (sameLocation && target.pathname.includes("/customers/")) {
          global.location.assign(target.href);
          return;
        }
      } catch (_error) {
        // Fall back to the role destination when the return URL is malformed.
      }
    }
    global.location.assign(app.routeForRole(session.role));
  }

  function transferGuestCart(state, guestSession, customerId) {
    if (!guestSession || guestSession.role !== "guest") return;
    state.carts.forEach((cart) => {
      if (cart.ownerId === guestSession.id || cart.customerId === guestSession.id) {
        cart.ownerId = customerId;
        cart.customerId = customerId;
        cart.updatedAt = new Date().toISOString();
      }
    });
  }

  function continueAsGuest() {
    const session = {
      id: `guest_${Date.now()}`,
      role: "guest",
      name: "Guest Customer",
      restaurantId: "rest_autoserve_demo"
    };
    app.setSession(session);
    redirectSession(session);
  }

  function handleLogin(form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const identifier = normalized(data.get("identifier"));
      const password = String(data.get("password") || "");

      try {
        const state = stateApi.read();
        const guestSession = state.activeSession;
        const user = state.users.find((candidate) => {
          const matchesIdentifier = normalized(candidate.email) === identifier || normalized(candidate.staffId) === identifier || normalized(candidate.mobile) === identifier;
          return matchesIdentifier && candidate.password === password;
        });

        if (!user) {
          setFeedback("The username or password is incorrect. Use the prototype credentials shown below.", "error");
          return;
        }
        if (!user.active) {
          setFeedback("This account is inactive. Contact the restaurant administrator.", "error");
          return;
        }

        const session = {
          id: user.id,
          role: user.role,
          name: user.name,
          restaurantId: user.restaurantId || "rest_autoserve_demo"
        };
        stateApi.update((nextState) => {
          transferGuestCart(nextState, guestSession, user.id);
          const signedInUser = nextState.users.find((candidate) => candidate.id === user.id);
          if (signedInUser) signedInUser.lastLoginAt = new Date().toISOString();
          nextState.activeSession = { ...session, signedInAt: new Date().toISOString() };
        }, "session-created");
        setFeedback("Signed in. Opening your workspace…", "success");
        global.setTimeout(() => redirectSession(session), 250);
      } catch (_error) {
        setFeedback("Prototype data could not be loaded. Please reset the browser data or try again.", "error");
      }
    });
  }

  function handleSignup(form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const email = normalized(data.get("email"));
      const mobile = String(data.get("mobile") || "").trim();
      const password = String(data.get("password") || "");
      const name = String(data.get("name") || "").trim();
      const acceptedTerms = data.get("terms") === "accepted";

      if (!name || !/^\S+@\S+\.\S+$/.test(email) || !/^\d{10}$/.test(mobile) || password.length < 8 || !acceptedTerms) {
        setFeedback("Enter valid account details and accept the prototype terms before continuing.", "error");
        return;
      }

      try {
        const current = stateApi.read();
        const guestSession = current.activeSession;
        if (current.users.some((user) => normalized(user.email) === email || user.mobile === mobile)) {
          setFeedback("An account already uses that email address or mobile number.", "error");
          return;
        }
        const id = `customer_${Date.now()}`;
        stateApi.update((state) => {
          state.users.push({ id, role: "customer", name, email, mobile, password, active: true, createdAt: new Date().toISOString() });
          transferGuestCart(state, guestSession, id);
          state.activeSession = { id, role: "customer", name, restaurantId: "rest_autoserve_demo", signedInAt: new Date().toISOString() };
        }, "customer-signup");
        const session = { id, role: "customer", name, restaurantId: "rest_autoserve_demo" };
        setFeedback("Account created. Opening the customer experience…", "success");
        global.setTimeout(() => redirectSession(session), 250);
      } catch (_error) {
        setFeedback("The account could not be created because prototype data is unavailable.", "error");
      }
    });
  }

  function handleRecovery(form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const identifier = normalized(new FormData(form).get("identifier"));
      if (!identifier) {
        setFeedback("Enter the email, mobile number, or Staff ID associated with the prototype account.", "error");
        return;
      }
      setFeedback("Prototype recovery simulated. Use the seeded credentials in authentication.md to continue.", "success");
    });
  }

  document.querySelectorAll("[data-guest-entry]").forEach((button) => button.addEventListener("click", continueAsGuest));
  const returnTo = new URLSearchParams(global.location.search).get("returnTo");
  if (returnTo) document.querySelectorAll('a[href*="signup.html"]').forEach((link) => { const target = new URL(link.href); target.searchParams.set("returnTo", returnTo); link.href = target.href; });
  const currentSession = app.getSession();
  const sessionNotice = document.querySelector("[data-current-session]");
  if (currentSession && sessionNotice) {
    sessionNotice.hidden = false;
    sessionNotice.querySelector("[data-current-session-name]").textContent = currentSession.name;
    sessionNotice.querySelector("[data-current-session-role]").textContent = currentSession.role;
    sessionNotice.querySelector("[data-resume-session]").addEventListener("click", () => redirectSession(currentSession));
  }
  const form = document.querySelector("[data-auth-form]");
  if (!form) return;
  if (page === "login") handleLogin(form);
  if (page === "signup") handleSignup(form);
  if (page === "forgot-password") handleRecovery(form);
})(window);
