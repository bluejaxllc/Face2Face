/**
 * Haptics Service
 * Cross-platform haptic feedback using:
 * 1. navigator.vibrate() for Android + supporting browsers
 * 2. iOS 17.4+ <input type="checkbox" switch> hack for Safari
 * 
 * IMPORTANT: Haptic triggers MUST be called from within a user gesture
 * event handler (click, tap) to work reliably on iOS.
 */

/**
 * Detect if we're on iOS Safari
 */
function isIOSSafari(): boolean {
    const ua = navigator.userAgent;
    return /iPhone|iPad|iPod/.test(ua) && /AppleWebKit/.test(ua) && !/CriOS|FxiOS/.test(ua);
}

/**
 * Trigger a single haptic tap using the best available method.
 * 
 * @param durationMs - Vibration duration in ms (Android only, default 50ms)
 */
export function triggerHaptic(durationMs: number = 50): void {
    // 1. Try the standard Vibration API (Android Chrome, etc.)
    if (navigator.vibrate) {
        navigator.vibrate(durationMs);
        return;
    }

    // 2. iOS 17.4+ Safari hack: toggling a native switch checkbox fires haptic
    if (isIOSSafari()) {
        triggerIOSHaptic();
    }
}

/**
 * Trigger a vibration pattern (Android) or multiple iOS haptic taps.
 * 
 * @param pattern - Array of [vibrate, pause, vibrate, pause, ...] in ms
 */
export function triggerHapticPattern(pattern: number[]): void {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
        return;
    }

    // iOS fallback: fire individual taps at approximate intervals
    if (isIOSSafari()) {
        let totalDelay = 0;
        pattern.forEach((ms, i) => {
            if (i % 2 === 0) {
                // Even indices are vibration durations — trigger a tap at that point
                setTimeout(() => triggerIOSHaptic(), totalDelay);
            }
            totalDelay += ms;
        });
    }
}

/**
 * Bump confirmation haptic: strong 2-second vibration (Android)
 * or rapid taps (iOS)
 */
export function triggerBumpHaptic(): void {
    if (navigator.vibrate) {
        navigator.vibrate(2000);
        return;
    }

    if (isIOSSafari()) {
        // Simulate sustained haptic with rapid taps over 2 seconds
        for (let i = 0; i < 10; i++) {
            setTimeout(() => triggerIOSHaptic(), i * 200);
        }
    }
}

/**
 * Heartbeat haptic pattern: vib-vib-pause-vib-vib
 * Used when receiving bumps
 */
export function triggerHeartbeatHaptic(): void {
    triggerHapticPattern([100, 50, 100, 300, 100, 50, 100]);
}

/**
 * Light tap haptic — for UI interactions like toggle switches, button presses
 */
export function triggerLightTap(): void {
    triggerHaptic(30);
}

/**
 * iOS 17.4+ Safari haptic hack.
 * Creates a hidden <input type="checkbox" switch>, toggles it,
 * which triggers the native iOS switch haptic feedback.
 * 
 * MUST be called within a user gesture event handler.
 */
function triggerIOSHaptic(): void {
    try {
        const iosSwitch = document.createElement('input');
        iosSwitch.setAttribute('type', 'checkbox');
        iosSwitch.setAttribute('switch', ''); // Apple's native switch attribute

        // Hide from user and layout
        iosSwitch.style.position = 'absolute';
        iosSwitch.style.opacity = '0';
        iosSwitch.style.pointerEvents = 'none';
        iosSwitch.style.width = '0';
        iosSwitch.style.height = '0';

        document.body.appendChild(iosSwitch);
        iosSwitch.click(); // Force toggle → fires haptic tick
        iosSwitch.remove(); // Clean up DOM
    } catch (e) {
        // Fail silently on older iOS or unsupported browsers
        console.debug('[Haptics] iOS haptic hack not supported on this device.');
    }
}

/**
 * Check if any haptic feedback is available on this device
 */
export function isHapticsSupported(): boolean {
    return !!navigator.vibrate || isIOSSafari();
}
