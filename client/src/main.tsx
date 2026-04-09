import { createRoot } from "react-dom/client";

// Force framer-motion into main bundle immediately to prevent Safari chunk race
import * as motionModule from "framer-motion";
(window as any)._motion_preloaded = motionModule;
console.log("APP VERSION HASH KEY: 2026-04-09-V4");

import App from "./App";
import "./index.css";
// Import Android-specific styles
import "./android-styles.css";

// Detect if the device is running Android
function detectAndroid() {
  const userAgent = navigator.userAgent.toLowerCase();
  return /android/i.test(userAgent);
}

// Apply Android-specific class and optimizations if needed
if (detectAndroid()) {
  document.documentElement.classList.add('android-device');
  console.log('Android device detected - applying specific styles');

  // Ensure the viewport meta tag is properly set for mobile
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (viewportMeta) {
    viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
  }

  // Add a listener to ensure bottom navigation stays fixed when keyboard appears
  window.addEventListener('resize', () => {
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) {
      // Force repaint to ensure proper positioning
      bottomNav.classList.add('force-fixed');
      setTimeout(() => {
        bottomNav.classList.remove('force-fixed');
      }, 300);
    }
  });
}

// Global error handler — shows error instead of white screen
window.onerror = (msg, src, line, col, err) => {
  document.getElementById("root")!.innerHTML = `<div style="background:#0f172a;color:#f87171;padding:20px;font-family:monospace;font-size:12px;white-space:pre-wrap;word-break:break-all;min-height:100vh"><h2 style="color:#fff;font-size:18px">App Crash</h2><p>${msg}</p><p>Source: ${src}:${line}:${col}</p><pre>${err?.stack || 'no stack'}</pre></div>`;
};
window.addEventListener('unhandledrejection', (e) => {
  document.getElementById("root")!.innerHTML = `<div style="background:#0f172a;color:#f87171;padding:20px;font-family:monospace;font-size:12px;white-space:pre-wrap;word-break:break-all;min-height:100vh"><h2 style="color:#fff;font-size:18px">Promise Rejection</h2><pre>${e.reason?.stack || e.reason || 'unknown'}</pre></div>`;
});

try {
  createRoot(document.getElementById("root")!).render(
    <App />
  );
} catch (e: any) {
  document.getElementById("root")!.innerHTML = `<div style="background:#0f172a;color:#f87171;padding:20px;font-family:monospace;font-size:12px;white-space:pre-wrap;word-break:break-all;min-height:100vh"><h2 style="color:#fff;font-size:18px">Render Error</h2><pre>${e?.stack || e?.message || e}</pre></div>`;
}
