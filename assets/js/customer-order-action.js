(function initializeCustomerOrderAction(global) {
  "use strict";

  const action = document.querySelector("[data-floating-order]");
  if (!action) return;

  const formatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
  let hasItems = false;

  function synchronizeRouteVisibility() {
    const route = global.location.hash.replace(/^#\/?/, "") || "home";
    action.classList.toggle("is-visible", hasItems && route !== "checkout");
  }

  function render(state) {
    const session = state?.activeSession;
    if (!session || !["customer", "guest"].includes(session.role)) {
      hasItems = false;
      action.classList.remove("is-visible");
      return;
    }
    const restaurantId = session.restaurantId || "rest_autoserve_demo";
    const order = state.carts.find((candidate) => candidate.ownerId === session.id && candidate.restaurantId === restaurantId);
    const items = order?.items || [];
    const quantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const subtotal = items.reduce((sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0), 0);
    const restaurant = state.restaurants.find((candidate) => candidate.id === restaurantId);
    const total = subtotal + subtotal * Number(restaurant?.taxPercent || 0) / 100;

    action.querySelector("[data-floating-order-count]").textContent = `${quantity} ${quantity === 1 ? "item" : "items"}`;
    action.querySelector("[data-floating-order-total]").textContent = formatter.format(total);
    action.setAttribute("aria-label", `Review your order: ${quantity} ${quantity === 1 ? "item" : "items"}, ${formatter.format(total)}`);
    hasItems = quantity > 0;
    synchronizeRouteVisibility();
  }

  try {
    render(global.AutoCodeState.read());
  } catch (_error) {
    action.classList.remove("is-visible");
  }
  global.AutoCodeState.subscribe((state) => { if (state) render(state); });
  global.addEventListener("hashchange", synchronizeRouteVisibility);
})(window);
