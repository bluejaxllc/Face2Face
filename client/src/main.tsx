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

// Apply Android-specific class if needed
if (detectAndroid()) {
  document.documentElement.classList.add('android-device');
  console.log('Android device detected - applying specific styles');
}

createRoot(document.getElementById("root")!).render(
  <App />
);
