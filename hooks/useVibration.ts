// Vibration feedback hook for touch interactions
// Uses the Vibration API when available
'use client';

export interface VibrationOptions {
  enabled?: boolean;
  duration?: number;
}

export function useVibration(options?: VibrationOptions) {
  const enabled = options?.enabled ?? true;
  const duration = options?.duration ?? 10; // Default 10ms

  const vibrate = (pattern?: number | number[]) => {
    if (!enabled) return;

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern ?? duration);
    }
  };

  // Preset vibration patterns for different actions
  const vibrateLight = () => vibrate(5);      // Light tap
  const vibrateMedium = () => vibrate(10);    // Normal action
  const vibrateHeavy = () => vibrate(20);     // Important action
  const vibrateSuccess = () => vibrate([10, 5, 10]); // Double pulse
  const vibrateError = () => vibrate([20, 10, 20]);  // Error pattern
  const vibrateWarning = () => vibrate([15, 10, 15]); // Warning pattern

  return {
    vibrate,
    vibrateLight,
    vibrateMedium,
    vibrateHeavy,
    vibrateSuccess,
    vibrateError,
    vibrateWarning,
    isSupported: typeof navigator !== 'undefined' && 'vibrate' in navigator,
  };
}
