(function initializeCustomerQrEntry(global) {
  "use strict";
  const session = global.AutoCodeApp.getSession();
  if (!session || !["customer", "guest"].includes(session.role)) return;
  const params = new URLSearchParams(global.location.search);
  const restaurantReference = String(params.get("restaurant") || "").trim();
  const tableReference = String(params.get("table") || "").trim();
  const serviceReference = String(params.get("service") || "").trim();
  if (!restaurantReference && !tableReference) return;
  try {
    const state = global.AutoCodeState.read();
    const restaurant = restaurantReference
      ? state.restaurants.find((item) => item.id === restaurantReference || item.slug === restaurantReference)
      : state.restaurants.find((item) => item.id === session.restaurantId);
    if (!restaurant) throw new Error("This QR code refers to a restaurant that is not available in this prototype.");
    if (tableReference && !/^[A-Za-z0-9][A-Za-z0-9_-]{0,19}$/.test(tableReference)) throw new Error("This QR code contains an invalid table reference.");
    if (serviceReference && !["self-service", "table-service"].includes(serviceReference)) throw new Error("This QR code contains an invalid service preference.");
    global.AutoCodeState.update((nextState) => {
      if (!nextState.activeSession || nextState.activeSession.id !== session.id) return;
      nextState.activeSession.restaurantId = restaurant.id;
      nextState.activeSession.entryContext = {
        source: "qr",
        restaurantId: restaurant.id,
        restaurantSlug: restaurant.slug,
        tableNumber: tableReference || null,
        serviceMode: serviceReference || (tableReference ? "table-service" : null),
        detectedAt: new Date().toISOString()
      };
    }, "customer-qr-entry-detected");
  } catch (error) {
    global.AutoCodeEntryError = error.message;
  }
})(window);
