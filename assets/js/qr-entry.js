(function initializeQrGenerator(global) {
  "use strict";
  const session = global.AutoCodeApp.getSession();
  if (!session || session.role !== "admin") return;
  const form = document.querySelector("[data-qr-form]");
  if (!form) return;
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  const state = global.AutoCodeState.read();
  const restaurant = state.restaurants.find((item) => item.id === session.restaurantId) || state.restaurants[0];
  const configuredTables = restaurant.tableNumbers || [];
  const assetSource = (value) => !value ? "" : /^https?:\/\//i.test(value) ? value : `../${value.replace(/^\/+/, "")}`;
  const tableField = form.elements.tableNumber.closest("label");
  tableField.outerHTML = `<fieldset class="mt-5"><legend class="text-sm font-extrabold">QR location</legend><div class="mt-3 grid gap-3 sm:grid-cols-2"><label class="rounded-xl border border-slate-300 p-3 has-[:checked]:border-blue-700 has-[:checked]:bg-blue-50"><input type="radio" name="entryPoint" value="counter" checked><span class="ml-2 font-bold">Pickup counter</span></label><label class="rounded-xl border border-slate-300 p-3 has-[:checked]:border-blue-700 has-[:checked]:bg-blue-50"><input type="radio" name="entryPoint" value="table" ${configuredTables.length ? "" : "disabled"}><span class="ml-2 font-bold">All restaurant tables</span></label></div><div data-qr-table-field hidden class="mt-4 rounded-xl bg-blue-50 p-4 text-sm font-bold text-blue-950">Previewing Table ${escapeHtml(configuredTables[0] || "")}. Printing creates one page for each of the ${configuredTables.length} configured tables.</div>${configuredTables.length ? "" : '<p class="mt-3 text-xs font-bold text-amber-800">Add table numbers in Restaurant Settings to generate table QR codes.</p>'}</fieldset>`;
  const output = document.querySelector("[data-qr-output]");
  output.innerHTML = `<article data-printable-qr class="qr-print-card"><img data-qr-brand-logo class="qr-print-logo" alt=""><p class="qr-print-eyebrow">Welcome to</p><h2 data-qr-restaurant-name class="qr-print-name"></h2><p data-qr-location class="qr-print-location"></p><div data-qr-code class="qr-print-code"></div><p data-qr-message class="qr-print-message"></p><p data-qr-address class="qr-print-address"></p><div class="qr-print-support"><strong>Questions or complaints?</strong><span data-qr-complaint></span></div><div class="qr-print-powered"><span>Powered by</span><img src="../design_template/Autoserve%20logo.svg" alt="Autoserve"></div></article><div class="mt-5"><p data-qr-label class="font-black text-slate-950"></p><a data-qr-link class="mt-2 block break-all text-sm font-bold text-blue-700 underline" target="_blank" rel="noopener"></a><div class="mt-5 flex flex-wrap justify-center gap-3"><button data-copy-qr-link type="button" class="rounded-xl border border-blue-300 px-4 py-2.5 text-sm font-bold text-blue-700">Copy customer link</button><button data-print-qr type="button" class="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700">Print branded QR card</button></div></div>`;
  const printPages = document.createElement("div");
  printPages.dataset.qrPrintPages = "";
  output.insertBefore(printPages, output.firstChild);
  printPages.append(output.querySelector("[data-printable-qr]"));
  const brandLogo = document.querySelector("[data-qr-brand-logo]");
  brandLogo.src = assetSource(restaurant.brandLogoPath || "assets/images/branding/demo-kitchen-logo.jpg");
  brandLogo.alt = `${restaurant.name} logo`;
  document.querySelector("[data-qr-restaurant-name]").textContent = restaurant.name;
  document.querySelector("[data-qr-message]").textContent = restaurant.qrGuestMessage || "Scan to view the menu and place your order";
  document.querySelector("[data-qr-address]").textContent = restaurant.address || "Dine in · Pickup";
  document.querySelector("[data-qr-complaint]").textContent = restaurant.complaintPhone || restaurant.contactPhone || "Ask a member of staff";
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
    const entryPoint = String(data.get("entryPoint") || "counter");
    const table = entryPoint === "table" ? String(configuredTables[0] || "").trim().toUpperCase() : "";
    if (!/^https?:\/\//i.test(base)) throw new Error("Enter an HTTP(S) address that the customer phone can open.");
    if (table && !/^[A-Z0-9][A-Z0-9_-]{0,19}$/.test(table)) throw new Error("Use up to 20 letters, numbers, underscores, or hyphens for the table.");
    if (table && !configuredTables.includes(table)) throw new Error("Choose a table configured in Restaurant Settings.");
    const target = new URL("customers/", base.endsWith("/") ? base : `${base}/`);
    target.searchParams.set("restaurant", restaurant.slug || restaurant.id);
    target.searchParams.set("service", table ? "table-service" : "self-service");
    if (table) target.searchParams.set("table", table);
    target.hash = "/menu";
    currentLink = target.href;
    printPages.querySelectorAll(".qr-print-copy").forEach((card) => card.remove());
    const container = document.querySelector("[data-qr-code]");
    container.innerHTML = "";
    if (typeof global.QRCode !== "function") throw new Error("The QR library could not load. The customer link is still available to copy.");
    new global.QRCode(container, { text: currentLink, width: 224, height: 224, colorDark: "#11244d", colorLight: "#ffffff", correctLevel: global.QRCode.CorrectLevel.M });
    container.setAttribute("role", "img"); container.setAttribute("aria-label", table ? `QR code for table ${table}` : "Restaurant customer entry QR code");
    document.querySelector("[data-qr-label]").textContent = table ? `${restaurant.name} · Table ${table}` : `${restaurant.name} · Pickup counter`;
    document.querySelector("[data-qr-location]").textContent = table ? `TABLE ${table}` : "PICKUP COUNTER";
    if (table) configuredTables.slice(1).forEach((tableNumber) => {
      const card = printPages.querySelector("[data-printable-qr]").cloneNode(true);
      card.classList.add("qr-print-copy");
      card.querySelector("[data-qr-location]").textContent = `TABLE ${tableNumber}`;
      const code = card.querySelector("[data-qr-code]");
      code.innerHTML = "";
      const tableTarget = new URL(currentLink);
      tableTarget.searchParams.set("table", tableNumber);
      new global.QRCode(code, { text: tableTarget.href, width: 224, height: 224, colorDark: "#11244d", colorLight: "#ffffff", correctLevel: global.QRCode.CorrectLevel.M });
      code.setAttribute("role", "img");
      code.setAttribute("aria-label", `QR code for table ${tableNumber}`);
      printPages.append(card);
    });
    const link = document.querySelector("[data-qr-link]"); link.href = currentLink; link.textContent = currentLink;
    document.querySelector("[data-qr-output]").hidden = false;
    show("QR code ready. Test the link before printing it for the store.", false);
  }
  form.addEventListener("submit", (event) => { event.preventDefault(); try { generate(); } catch (error) { show(error.message, true); if (currentLink) { const link = document.querySelector("[data-qr-link]"); link.href = currentLink; link.textContent = currentLink; document.querySelector("[data-qr-output]").hidden = false; } } });
  form.addEventListener("change", (event) => { if (event.target.name === "entryPoint") document.querySelector("[data-qr-table-field]").hidden = event.target.value !== "table"; });
  document.querySelector("[data-copy-qr-link]").addEventListener("click", async () => { if (!currentLink) return; try { await navigator.clipboard.writeText(currentLink); show("Customer link copied.", false); } catch (_error) { show("Copy was blocked. Select the displayed link manually.", true); } });
  document.querySelector("[data-print-qr]").addEventListener("click", () => {
    const previousTitle = document.title;
    document.title = "";
    const restoreTitle = () => { document.title = previousTitle; };
    global.addEventListener("afterprint", restoreTitle, { once: true });
    global.print();
    global.setTimeout(restoreTitle, 1000);
  });
})(window);
