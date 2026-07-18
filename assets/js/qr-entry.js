(function initializeQrGenerator(global) {
  "use strict";
  const session = global.AutoCodeApp.getSession();
  if (!session || session.role !== "admin") return;
  const form = document.querySelector("[data-qr-form]");
  if (!form) return;
  const state = global.AutoCodeState.read();
  const restaurant = state.restaurants.find((item) => item.id === session.restaurantId) || state.restaurants[0];
  let currentLink = "";
  const defaultBase = new URL("../", global.location.href).href;
  form.elements.baseUrl.value = defaultBase.startsWith("http") ? defaultBase : "";

  function show(message, error) {
    const target = document.querySelector("[data-qr-feedback]");
    target.textContent = message;
    target.className = `rounded-xl p-4 text-sm font-bold ${error ? "bg-red-50 text-red-800" : "bg-blue-50 text-blue-950"}`;
  }
  function generate() {
    const data = new FormData(form);
    const base = String(data.get("baseUrl") || "").trim();
    const table = String(data.get("tableNumber") || "").trim().toUpperCase();
    if (!/^https?:\/\//i.test(base)) throw new Error("Enter an HTTP(S) address that the customer phone can open.");
    if (table && !/^[A-Z0-9][A-Z0-9_-]{0,19}$/.test(table)) throw new Error("Use up to 20 letters, numbers, underscores, or hyphens for the table.");
    const target = new URL("customers/", base.endsWith("/") ? base : `${base}/`);
    target.searchParams.set("restaurant", restaurant.slug || restaurant.id);
    if (table) target.searchParams.set("table", table);
    target.hash = "/menu";
    currentLink = target.href;
    const container = document.querySelector("[data-qr-code]");
    container.innerHTML = "";
    if (typeof global.QRCode !== "function") throw new Error("The QR library could not load. The customer link is still available to copy.");
    new global.QRCode(container, { text: currentLink, width: 224, height: 224, colorDark: "#11244d", colorLight: "#ffffff", correctLevel: global.QRCode.CorrectLevel.M });
    container.setAttribute("role", "img"); container.setAttribute("aria-label", table ? `QR code for table ${table}` : "Restaurant customer entry QR code");
    document.querySelector("[data-qr-label]").textContent = table ? `${restaurant.name} · Table ${table}` : `${restaurant.name} · General entry`;
    const link = document.querySelector("[data-qr-link]"); link.href = currentLink; link.textContent = currentLink;
    document.querySelector("[data-qr-output]").hidden = false;
    show("QR code ready. Test the link before printing it for the store.", false);
  }
  form.addEventListener("submit", (event) => { event.preventDefault(); try { generate(); } catch (error) { show(error.message, true); if (currentLink) { const link = document.querySelector("[data-qr-link]"); link.href = currentLink; link.textContent = currentLink; document.querySelector("[data-qr-output]").hidden = false; } } });
  document.querySelector("[data-copy-qr-link]").addEventListener("click", async () => { if (!currentLink) return; try { await navigator.clipboard.writeText(currentLink); show("Customer link copied.", false); } catch (_error) { show("Copy was blocked. Select the displayed link manually.", true); } });
  document.querySelector("[data-print-qr]").addEventListener("click", () => global.print());
})(window);
