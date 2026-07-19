(function initializeCustomerQrScanner(global) {
  "use strict";

  const dialog = document.querySelector("#qr-scanner-dialog");
  const openButton = document.querySelector("[data-open-qr-scanner]");
  if (!dialog || !openButton) return;

  const video = dialog.querySelector("[data-qr-video]");
  const status = dialog.querySelector("[data-qr-scanner-status]");
  const startButton = dialog.querySelector("[data-start-qr-camera]");
  const imageInput = dialog.querySelector("[data-qr-image]");
  let stream = null;
  let scanFrame = 0;
  let detector = null;
  let detecting = false;

  function showStatus(message, error) {
    status.textContent = message;
    status.className = `mt-4 rounded-xl px-4 py-3 text-sm font-bold ${error ? "bg-red-50 text-red-800" : "bg-blue-50 text-blue-950"}`;
  }

  function stopCamera() {
    global.cancelAnimationFrame(scanFrame);
    scanFrame = 0;
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    video.srcObject = null;
    startButton.disabled = false;
    startButton.textContent = "Start camera";
  }

  function customerEntryUrl(rawValue) {
    const target = new URL(String(rawValue || "").trim(), global.location.href);
    const normalizedPath = target.pathname.replace(/\/+$/, "");
    const currentCustomerPath = global.location.pathname.replace(/\/+$/, "");
    if (target.origin !== global.location.origin || normalizedPath !== currentCustomerPath) throw new Error("Scan an Autoserve QR code for this site.");
    if (!target.searchParams.get("restaurant")) throw new Error("This QR code does not identify a restaurant.");
    target.hash = "/menu";
    return target.href;
  }

  function useScan(rawValue) {
    const destination = customerEntryUrl(rawValue);
    stopCamera();
    showStatus("QR recognized. Opening the restaurant menu…", false);
    global.location.assign(destination);
  }

  async function scanVideo() {
    if (!stream || detecting) return;
    if (video.readyState >= 2) {
      detecting = true;
      try {
        const codes = await detector.detect(video);
        if (codes[0]?.rawValue) return useScan(codes[0].rawValue);
      } catch (_error) {
        showStatus("Keep the QR code inside the frame and hold the phone steady.", false);
      } finally {
        detecting = false;
      }
    }
    scanFrame = global.requestAnimationFrame(scanVideo);
  }

  function createDetector() {
    if (!("BarcodeDetector" in global)) throw new Error("QR scanning is not supported by this browser. Open this page in a current browser or use the QR link directly.");
    return new global.BarcodeDetector({ formats: ["qr_code"] });
  }

  async function startCamera() {
    try {
      detector = detector || createDetector();
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera access requires HTTPS or localhost.");
      stopCamera();
      startButton.disabled = true;
      startButton.textContent = "Starting…";
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      video.srcObject = stream;
      await video.play();
      startButton.textContent = "Camera active";
      showStatus("Scanning… keep the QR code inside the frame.", false);
      scanFrame = global.requestAnimationFrame(scanVideo);
    } catch (error) {
      stopCamera();
      showStatus(error.name === "NotAllowedError" ? "Camera permission was denied. Allow camera access and try again." : error.message, true);
    }
  }

  async function scanImage(file) {
    if (!file) return;
    try {
      detector = detector || createDetector();
      const bitmap = await createImageBitmap(file);
      const codes = await detector.detect(bitmap);
      bitmap.close();
      if (!codes[0]?.rawValue) throw new Error("No QR code was found in that image.");
      useScan(codes[0].rawValue);
    } catch (error) {
      showStatus(error.message, true);
    } finally {
      imageInput.value = "";
    }
  }

  openButton.addEventListener("click", () => {
    showStatus("Camera starts only when you choose “Start camera”.", false);
    global.AutoCodeApp.openDialog(dialog);
  });
  startButton.addEventListener("click", startCamera);
  imageInput.addEventListener("change", () => scanImage(imageInput.files[0]));
  dialog.querySelector("[data-close-qr-scanner]").addEventListener("click", () => global.AutoCodeApp.closeDialog(dialog));
  dialog.querySelector("[data-skip-qr]").addEventListener("click", () => global.AutoCodeApp.closeDialog(dialog));
  dialog.addEventListener("close", stopCamera);
  dialog.addEventListener("cancel", stopCamera);
})(window);
