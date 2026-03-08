'use client';

import React from 'react';

export interface TouchControlsProps {
  onLeft: () => void;
  onRight: () => void;
  onDown: () => void;
  onRotate: () => void;
  onHardDrop: () => void;
  onHold: () => void;
  onPause: () => void;
  visible?: boolean;
  vibrationEnabled?: boolean;
}

export function TouchControls({
  onLeft,
  onRight,
  onDown,
  onRotate,
  onHardDrop,
  onHold,
  onPause,
  visible = true,
  vibrationEnabled = true,
}: TouchControlsProps) {
  const vibrate = (duration: number) => {
    if (vibrationEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  };

  const handleLeft = () => {
    vibrate(5);
    onLeft();
  };

  const handleRight = () => {
    vibrate(5);
    onRight();
  };

  const handleDown = () => {
    vibrate(5);
    onDown();
  };

  const handleRotate = () => {
    vibrate(10);
    onRotate();
  };

  const handleHardDrop = () => {
    vibrate(15);
    onHardDrop();
  };

  const handleHold = () => {
    vibrate(10);
    onHold();
  };

  const handlePause = () => {
    vibrate(10);
    onPause();
  };

  if (!visible) return null;

  return (
    <div className="touch-controls fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent pointer-events-none">
      <div className="max-w-md mx-auto flex flex-col gap-3 pointer-events-auto">
        {/* Top row: Hold, Pause */}
        <div className="flex justify-between items-center px-4">
          <button
            onTouchStart={handleHold}
            onClick={handleHold}
            className="w-14 h-14 rounded-full bg-purple-600/80 active:bg-purple-500 text-white font-bold text-sm flex items-center justify-center shadow-lg touch-none select-none border-2 border-purple-400/50"
          >
            Hold
          </button>

          <button
            onTouchStart={handlePause}
            onClick={handlePause}
            className="w-14 h-14 rounded-full bg-gray-600/80 active:bg-gray-500 text-white font-bold text-sm flex items-center justify-center shadow-lg touch-none select-none border-2 border-gray-400/50"
          >
            II
          </button>
        </div>

        {/* Direction buttons */}
        <div className="flex justify-center items-center gap-3">
          {/* Left */}
          <button
            onTouchStart={handleLeft}
            onClick={handleLeft}
            className="w-16 h-16 rounded-2xl bg-blue-600/80 active:bg-blue-500 text-white font-bold text-2xl flex items-center justify-center shadow-lg touch-none select-none border-2 border-blue-400/50"
          >
            ◄
          </button>

          {/* Down */}
          <button
            onTouchStart={handleDown}
            onClick={handleDown}
            className="w-16 h-16 rounded-2xl bg-blue-600/80 active:bg-blue-500 text-white font-bold text-2xl flex items-center justify-center shadow-lg touch-none select-none border-2 border-blue-400/50"
          >
            ▼
          </button>

          {/* Right */}
          <button
            onTouchStart={handleRight}
            onClick={handleRight}
            className="w-16 h-16 rounded-2xl bg-blue-600/80 active:bg-blue-500 text-white font-bold text-2xl flex items-center justify-center shadow-lg touch-none select-none border-2 border-blue-400/50"
          >
            ►
          </button>

          {/* Rotate */}
          <button
            onTouchStart={handleRotate}
            onClick={handleRotate}
            className="w-16 h-16 rounded-2xl bg-green-600/80 active:bg-green-500 text-white font-bold text-2xl flex items-center justify-center shadow-lg touch-none select-none border-2 border-green-400/50"
          >
            ↻
          </button>
        </div>

        {/* Hard Drop button */}
        <div className="flex justify-center">
          <button
            onTouchStart={handleHardDrop}
            onClick={handleHardDrop}
            className="w-full max-w-xs h-14 rounded-xl bg-red-600/80 active:bg-red-500 text-white font-bold text-lg flex items-center justify-center shadow-lg touch-none select-none border-2 border-red-400/50"
          >
            HARD DROP
          </button>
        </div>
      </div>
    </div>
  );
}
