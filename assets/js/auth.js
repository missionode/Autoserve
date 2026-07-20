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

  function continueWithGoogle(mode) {
    const googleId = "google_customer_demo";
    const googleEmail = "google.customer@autoserve.demo";
    try {
      const current = stateApi.read();
      const guestSession = current.activeSession;
      const existing = current.users.find((user) => user.id === googleId || normalized(user.email) === googleEmail);
      if (existing && !existing.active) {
        setFeedback("This simulated Google customer account is inactive.", "error");
        return;
      }
      const session = { id: existing?.id || googleId, role: "customer", name: existing?.name || "Google Demo Customer", restaurantId: guestSession?.restaurantId || existing?.restaurantId || "rest_autoserve_demo" };
      stateApi.update((state) => {
        let user = state.users.find((candidate) => candidate.id === session.id || normalized(candidate.email) === googleEmail);
        if (!user) {
          user = { id: googleId, role: "customer", name: "Google Demo Customer", email: googleEmail, mobile: "", authProvider: "google", active: true, createdAt: new Date().toISOString() };
          state.users.push(user);
        }
        user.authProvider = "google";
        user.lastLoginAt = new Date().toISOString();
        transferGuestCart(state, guestSession, user.id);
        state.activeSession = { ...session, id: user.id, name: user.name, signedInAt: new Date().toISOString(), authProvider: "google" };
      }, mode === "signup" ? "google-customer-signup" : "google-customer-signin");
      setFeedback(mode === "signup" ? "Google account created. Opening the customer experience…" : "Signed in with Google. Opening the customer experience…", "success");
      global.setTimeout(() => redirectSession(session), 250);
    } catch (_error) {
      setFeedback("The simulated Google sign-in is unavailable because prototype data could not be loaded.", "error");
    }
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
          const matchesIdentifier = normalized(candidate.username) === identifier || normalized(candidate.email) === identifier || normalized(candidate.staffId) === identifier || normalized(candidate.mobile) === identifier;
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
        if (["admin", "staff"].includes(user.role)) {
          const restaurant = state.restaurants.find((entry) => entry.id === user.restaurantId);
          if (restaurant?.approvalStatus !== "approved") {
            setFeedback(restaurant?.approvalStatus === "rejected" ? `This restaurant application was rejected${restaurant.rejectionReason ? `: ${restaurant.rejectionReason}` : "."}` : "This restaurant is awaiting Super Admin approval. You can sign in after approval.", "error");
            return;
          }
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
      setFeedback("Prototype recovery simulated. Use the seeded credentials in docs/authentication.md to continue.", "success");
    });
  }

  async function sha256(value) { const digest = await global.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join(""); }

  function handleRestaurantSignup(form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(form); const value = (name) => String(data.get(name) || "").trim(); const adminEmail = normalized(value("adminEmail")); const contactEmail = normalized(value("contactEmail")); const password = value("password"); const adminPin = value("adminPin");
      const required = ["legalName", "restaurantName", "gstin", "fssaiNumber", "fssaiExpiry", "tradeLicense", "tradeLicenseExpiry", "pan", "address", "city", "stateName", "postalCode", "contactPhone", "contactEmail", "complaintPhone", "adminName", "adminEmail"];
      if (required.some((name) => !value(name)) || !/^\S+@\S+\.\S+$/.test(adminEmail) || !/^\S+@\S+\.\S+$/.test(contactEmail) || !/^[0-9A-Z]{15}$/.test(value("gstin").toUpperCase()) || !/^\d{14}$/.test(value("fssaiNumber")) || !/^[A-Z]{5}\d{4}[A-Z]$/.test(value("pan").toUpperCase()) || !/^\d{6}$/.test(value("postalCode")) || password.length < 8 || !/^\d{4,8}$/.test(adminPin) || data.get("terms") !== "accepted") return setFeedback("Complete all required business, licence, contact, and Admin fields using valid formats.", "error");
      if (new Date(value("fssaiExpiry")) <= new Date() || new Date(value("tradeLicenseExpiry")) <= new Date()) return setFeedback("FSSAI and trade licences must have future expiry dates.", "error");
      try {
        const current = stateApi.read();
        if (current.users.some((user) => normalized(user.email) === adminEmail) || current.restaurants.some((restaurant) => normalized(restaurant.contactEmail) === contactEmail || normalized(restaurant.licenses?.gstin) === normalized(value("gstin")))) return setFeedback("That Admin email, restaurant email, or GSTIN is already registered.", "error");
        const stamp = Date.now(); const restaurantId = `rest_${stamp}`; const adminId = `admin_${stamp}`; const slugBase = value("restaurantName").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `restaurant-${stamp}`; const expires = new Date(); expires.setHours(24, 0, 0, 0); const pinHash = await sha256(adminPin);
        stateApi.update((state) => {
          const demo = state.restaurants.find((restaurant) => restaurant.id === "rest_autoserve_demo");
          const categoryMap = new Map(); state.categories.filter((category) => category.restaurantId === "rest_autoserve_demo").forEach((category, index) => { const id = `${restaurantId}_cat_${index + 1}`; categoryMap.set(category.id, id); state.categories.push({ ...category, id, restaurantId }); });
          const itemMap = new Map(); state.menuItems.filter((item) => item.restaurantId === "rest_autoserve_demo").forEach((item, index) => { const id = `${restaurantId}_item_${index + 1}`; itemMap.set(item.id, id); state.menuItems.push({ ...JSON.parse(JSON.stringify(item)), id, restaurantId, categoryId: categoryMap.get(item.categoryId), stock: 0, availableQuantity: 0, availabilityStatus: "unavailable", availabilityNote: "Set opening availability before publishing", updatedAt: new Date().toISOString() }); });
          state.restaurants.push({ id: restaurantId, slug: state.restaurants.some((restaurant) => restaurant.slug === slugBase) ? `${slugBase}-${stamp}` : slugBase, name: value("restaurantName"), legalName: value("legalName"), businessType: value("businessType"), status: "closed", currency: "INR", taxPercent: Number(value("taxPercent")), contactPhone: value("contactPhone"), contactEmail, complaintPhone: value("complaintPhone"), address: value("address"), city: value("city"), state: value("stateName"), postalCode: value("postalCode"), operatingHours: value("operatingHours"), dineInEnabled: data.get("dineInEnabled") === "on", takeawayEnabled: data.get("takeawayEnabled") === "on", dineInServiceMode: value("dineInServiceMode"), tableNumbers: [...new Set(value("tableNumbers").split(",").map((entry) => entry.trim().toUpperCase()).filter(Boolean))], licenses: { gstin: value("gstin").toUpperCase(), fssaiNumber: value("fssaiNumber"), fssaiExpiry: value("fssaiExpiry"), tradeLicense: value("tradeLicense"), tradeLicenseExpiry: value("tradeLicenseExpiry"), pan: value("pan").toUpperCase(), localRegistration: value("localRegistration"), verificationStatus: "prototype_unverified" }, administrativeToken: String(Math.floor(100000 + Math.random() * 900000)), administrativeTokenExpiresAt: expires.toISOString(), tokenStart: 100, nextToken: 100, nextKot: 1, defaultPreparationMinutes: 10, warningMinutes: 8, delayedMinutes: 15, lowStockDefault: 5, primaryRewardItemId: itemMap.get(demo?.primaryRewardItemId), fallbackRewardItemId: itemMap.get(demo?.fallbackRewardItemId), brandLogoPath: "assets/images/branding/demo-kitchen-logo.jpg", qrGuestMessage: "Scan to view the menu and place your order", combosEnabled: false, comboSectionTitle: "Popular meal combos", combos: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
          const createdRestaurant = state.restaurants.find((restaurant) => restaurant.id === restaurantId); createdRestaurant.approvalStatus = "pending"; createdRestaurant.approvalSubmittedAt = new Date().toISOString();
          state.users.push({ id: adminId, restaurantId, role: "admin", name: value("adminName"), email: adminEmail, password, adminPinHash: pinHash, active: true, createdAt: new Date().toISOString() });
          state.activeSession = null;
        }, "restaurant-company-created");
        setFeedback("Application submitted. A Super Admin must approve the restaurant before sign-in.", "success"); global.setTimeout(() => global.location.assign("./login.html?reason=pending-approval"), 700);
      } catch (error) { setFeedback(error.message || "The restaurant account could not be created.", "error"); }
    });
  }

  document.querySelectorAll("[data-guest-entry]").forEach((button) => button.addEventListener("click", continueAsGuest));
  document.querySelectorAll("[data-google-auth]").forEach((button) => button.addEventListener("click", () => continueWithGoogle(button.dataset.googleAuth)));
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
  if (page === "restaurant-signup") handleRestaurantSignup(form);
  if (page === "forgot-password") handleRecovery(form);
})(window);
