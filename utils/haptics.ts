/**
 * Mobile Haptic Feedback Engine for Omoji Sticker Studio
 * Gracefully provides subtle tactile feedback during interactions on supported mobile devices.
 */

export type HapticType =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error"
  | "selection"
  | "snap";

/**
 * Trigger subtle haptic vibration on supporting mobile devices (Android / iOS with WebKit haptics)
 */
export function triggerHaptic(type: HapticType = "light"): void {
  if (typeof window === "undefined" || !("navigator" in window) || !navigator.vibrate) {
    return;
  }

  try {
    switch (type) {
      case "selection":
        navigator.vibrate(10);
        break;
      case "light":
        navigator.vibrate(15);
        break;
      case "medium":
        navigator.vibrate(25);
        break;
      case "heavy":
        navigator.vibrate(45);
        break;
      case "snap":
        navigator.vibrate([10, 30, 15]);
        break;
      case "success":
        navigator.vibrate([20, 40, 30]);
        break;
      case "warning":
        navigator.vibrate([30, 50, 30, 50]);
        break;
      case "error":
        navigator.vibrate([50, 70, 50, 70, 50]);
        break;
      default:
        navigator.vibrate(15);
        break;
    }
  } catch {
    // Ignore unsupported vibration context errors
  }
}
