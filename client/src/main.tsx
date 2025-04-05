import { createRoot } from "react-dom/client";
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
    viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
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

createRoot(document.getElementById("root")!).render(
  <App />
);
