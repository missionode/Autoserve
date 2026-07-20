(function initializePasswordControls(global) {
  "use strict";
  const eye = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>';
  const eyeOff = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18M10.6 6.2A9.7 9.7 0 0 1 12 6c6 0 9.5 6 9.5 6a15.4 15.4 0 0 1-2.2 2.8M6.1 6.1C3.8 7.7 2.5 12 2.5 12s3.5 6 9.5 6c1.3 0 2.5-.3 3.5-.7M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
  const setPasswordNames = new Set(["password", "adminPin", "newPin"]);

  function isPasswordCreation(input) {
    if (input.name === "newPin") return true;
    if (input.name === "adminPin") return Boolean(input.closest('[data-auth-page="restaurant-signup"]'));
    if (input.name !== "password" || input.autocomplete === "current-password") return false;
    return Boolean(input.closest('[data-auth-page="signup"], [data-auth-page="restaurant-signup"], [data-staff-form], [data-create-user-form]'));
  }

  function addVisibility(input) {
    if (input.dataset.passwordEnhanced) return;
    input.dataset.passwordEnhanced = "true";
    const wrapper = document.createElement("span"); wrapper.className = "password-input-wrap";
    input.parentNode.insertBefore(wrapper, input); wrapper.appendChild(input);
    const button = document.createElement("button"); button.type = "button"; button.className = "password-visibility"; button.setAttribute("aria-label", "Show password"); button.innerHTML = eye; wrapper.appendChild(button);
    button.addEventListener("click", () => { const showing = input.type === "text"; input.type = showing ? "password" : "text"; button.setAttribute("aria-label", showing ? "Show password" : "Hide password"); button.setAttribute("aria-pressed", String(!showing)); button.innerHTML = showing ? eye : eyeOff; });
  }

  function strength(value) {
    const checks = [value.length >= 12, /[a-z]/.test(value), /[A-Z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)];
    const score = checks.filter(Boolean).length;
    return score >= 5 ? ["Strong", "text-green-700"] : score >= 3 ? ["Medium", "text-amber-700"] : ["Weak", "text-red-700"];
  }

  function generatedPassword() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
    const bytes = new Uint32Array(16); global.crypto.getRandomValues(bytes);
    return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("");
  }

  function addCreationControls(input) {
    const field = input.closest("label"); if (!field || field.dataset.passwordCreation) return; field.dataset.passwordCreation = "true";
    const isPin = input.name === "newPin" || input.name === "adminPin";
    const confirmName = input.name === "newPin" ? "confirmNewPin" : input.name === "adminPin" ? "confirmAdminPin" : "confirmPassword";
    const title = isPin ? `Confirm ${input.name === "newPin" ? "new " : ""}PIN` : "Confirm password";
    const confirm = document.createElement("label"); confirm.className = field.className; confirm.dataset.generatedPasswordConfirm = input.name;
    confirm.innerHTML = `<span class="text-sm font-bold text-slate-800">${title}</span><input name="${confirmName}" type="password" autocomplete="new-password" ${input.required ? "required" : ""} ${isPin ? 'inputmode="numeric" pattern="[0-9]{4,8}" minlength="4" maxlength="8"' : 'minlength="8"'} class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Enter it again">`;
    field.insertAdjacentElement("afterend", confirm); addVisibility(confirm.querySelector("input"));
    if (!isPin) {
      const tools = document.createElement("span"); tools.className = "mt-2 flex flex-wrap items-center justify-between gap-2 text-xs"; tools.innerHTML = '<span data-password-strength class="font-bold text-slate-500">Enter 12+ characters with upper, lower, number, and symbol.</span><button data-generate-password type="button" class="font-extrabold text-blue-700 hover:underline">Generate strong password</button>'; field.appendChild(tools);
      const strengthLabel = tools.querySelector("[data-password-strength]");
      input.addEventListener("input", () => { const [label, tone] = strength(input.value); strengthLabel.className = `font-bold ${tone}`; strengthLabel.textContent = input.value ? `${label} password` : "Enter 12+ characters with upper, lower, number, and symbol."; });
      tools.querySelector("[data-generate-password]").addEventListener("click", () => { const value = generatedPassword(); input.value = value; confirm.querySelector("input").value = value; input.dispatchEvent(new Event("input", { bubbles: true })); input.type = "text"; confirm.querySelector("input").type = "text"; input.focus(); });
    }
  }

  function matching(form, report) {
    for (const input of form.querySelectorAll('input[type="password"], input[data-password-enhanced]')) {
      if (!setPasswordNames.has(input.name) || !isPasswordCreation(input)) continue;
      const isPin = input.name === "newPin" || input.name === "adminPin"; const confirmName = input.name === "newPin" ? "confirmNewPin" : input.name === "adminPin" ? "confirmAdminPin" : "confirmPassword"; const confirmation = form.elements[confirmName];
      if (!confirmation) continue; const mismatch = input.value !== confirmation.value; confirmation.setCustomValidity(mismatch ? `${isPin ? "PINs" : "Passwords"} do not match.` : "");
      if (mismatch) { if (report) confirmation.reportValidity(); return false; }
    }
    return true;
  }

  document.querySelectorAll('input[type="password"]').forEach((input) => { addVisibility(input); if (isPasswordCreation(input)) addCreationControls(input); });
  document.addEventListener("submit", (event) => { if (!matching(event.target, true)) { event.preventDefault(); event.stopImmediatePropagation(); } }, true);
  document.addEventListener("click", (event) => { if (event.target.closest("[data-change-pin]") && !matching(event.target.closest("form"), true)) { event.preventDefault(); event.stopImmediatePropagation(); } }, true);
})(window);
