// Touch gesture recognition hook for Tetris game
// Supports: swipe, tap, double tap, two-finger tap, long press
'use client';

import { useRef, useCallback } from 'react';

export interface GestureCallbacks {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeDown: () => void;
  onTap: () => void;        // Single tap - rotate piece
  onDoubleTap: () => void;  // Double tap - hard drop
  onTwoFingerTap: () => void; // Two-finger tap - pause/hold
  onLongPress: () => void;  // Long press - hold piece
}

export interface GestureOptions {
  swipeThreshold?: number;  // Minimum distance for swipe (default: 30px)
  tapDelay?: number;        // Maximum time for tap (default: 200ms)
  doubleTapDelay?: number;  // Time window for double tap (default: 300ms)
  longPressDelay?: number;  // Time to trigger long press (default: 500ms)
  onVibrate?: () => void;   // Optional vibration callback
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  isSwiping: boolean;
  longPressTimer: ReturnType<typeof setTimeout> | null;
  lastTapTime: number;
}

export function useTouchGestures(
  callbacks: GestureCallbacks,
  options?: GestureOptions
) {
  const stateRef = useRef<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isSwiping: false,
    longPressTimer: null,
    lastTapTime: 0,
  });

  const swipeThreshold = options?.swipeThreshold || 30;
  const doubleTapDelay = options?.doubleTapDelay || 300;
  const longPressDelay = options?.longPressDelay || 500;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault();

    // Two-finger detection
    if (e.touches.length === 2) {
      callbacks.onTwoFingerTap();
      options?.onVibrate?.();
      return;
    }

    // Single touch
    if (e.touches.length === 1) {
      stateRef.current.startX = e.touches[0].clientX;
      stateRef.current.startY = e.touches[0].clientY;
      stateRef.current.startTime = Date.now();
      stateRef.current.isSwiping = false;

      // Start long press timer
      stateRef.current.longPressTimer = setTimeout(() => {
        if (!stateRef.current.isSwiping) {
          callbacks.onLongPress();
          options?.onVibrate?.();
        }
      }, longPressDelay);
    }
  }, [callbacks, options, longPressDelay]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length !== 1) return;

    const deltaX = e.touches[0].clientX - stateRef.current.startX;
    const deltaY = e.touches[0].clientY - stateRef.current.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Detect if this is becoming a swipe
    if (absX > 10 || absY > 10) {
      stateRef.current.isSwiping = true;

      // Cancel long press if swiping
      if (stateRef.current.longPressTimer) {
        clearTimeout(stateRef.current.longPressTimer);
        stateRef.current.longPressTimer = null;
      }
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    // Cancel long press timer
    if (stateRef.current.longPressTimer) {
      clearTimeout(stateRef.current.longPressTimer);
      stateRef.current.longPressTimer = null;
    }

    // Only handle single-touch gestures
    if (e.changedTouches.length !== 1) return;

    const deltaX = e.changedTouches[0].clientX - stateRef.current.startX;
    const deltaY = e.changedTouches[0].clientY - stateRef.current.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const now = Date.now();

    // Determine gesture type
    if (absX < 10 && absY < 10) {
      // Tap gesture (not a swipe)
      if (now - stateRef.current.lastTapTime < doubleTapDelay) {
        // Double tap detected
        callbacks.onDoubleTap();
        options?.onVibrate?.();
        stateRef.current.lastTapTime = 0;
      } else {
        // Single tap detected
        callbacks.onTap();
        options?.onVibrate?.();
        stateRef.current.lastTapTime = now;
      }
    } else if (absX > absY) {
      // Horizontal swipe
      if (absX > swipeThreshold) {
        if (deltaX > 0) {
          callbacks.onSwipeRight();
          options?.onVibrate?.();
        } else {
          callbacks.onSwipeLeft();
          options?.onVibrate?.();
        }
      }
    } else {
      // Vertical swipe
      if (absY > swipeThreshold && deltaY > 0) {
        callbacks.onSwipeDown();
        options?.onVibrate?.();
      }
      // Note: Up swipe is not used (rotation is handled by tap)
    }
  }, [callbacks, options, swipeThreshold, doubleTapDelay]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}
