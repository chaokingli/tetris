'use client';

import React, { useRef, useState, useCallback } from 'react';
import { TetrominoType, getTetromino } from '@/lib/tetrominos';

interface CellProps {
  value: number; // 0 = empty, >0 = piece color index
  isGhost?: boolean;
}

// Responsive cell sizes
const CELL_SIZE_PX = 24; // Base size, will be overridden by responsive classes
const BORDER_RADIUS = '4px';

export function TetrisCell({ value, isGhost }: CellProps) {
  const baseColor = getColorForValue(value);

  if (value === 0 && !isGhost) {
    return (
      <div
        className="bg-white/[0.02] w-[20px] h-[20px] sm:w-[24px] sm:h-[24px] md:w-[26px] md:h-[26px] rounded-[2px] border border-white/[0.01]"
      />
    );
  }

  return (
    <div
      className={`${isGhost ? 'border border-dashed border-white/10' : ''} w-[20px] h-[20px] sm:w-[24px] sm:h-[24px] md:w-[26px] md:h-[26px] rounded-[2px] relative overflow-hidden`}
      style={{
        backgroundColor: isGhost ? baseColor + '15' : baseColor,
        boxShadow: !isGhost && value > 0 ? `0 0 12px ${baseColor}60, inset 0 0 4px rgba(255,255,255,0.3)` : 'none',
      }}
    >
      {!isGhost && value > 0 && (
        <div className="absolute inset-x-0 top-0 h-[20%] bg-white/20 pointer-events-none" />
      )}
    </div>
  );
}

export function getColorForValue(value: number): string {
  const pieceTypes: TetrominoType[] = ['Z', 'J', 'O', 'S', 'I', 'T', 'L'];

  if (value <= 0 || value > pieceTypes.length) return 'transparent';

  const colors: Record<TetrominoType, string> = {
    Z: '#ff3b3b', // Red
    J: '#3b82ff', // Blue
    O: '#ff9d3b', // Orange (Matches design images better than yellow)
    S: '#3bff3b', // Green
    I: '#00ddeb', // Cyan
    T: '#9d3bff', // Purple
    L: '#ffeb3b', // Yellow (Swapped O/L colors to match design)
  };

  return colors[pieceTypes[value - 1]] || 'transparent';
}

interface GameBoardProps {
  board: number[][];
  currentPiece?: {
    type: TetrominoType;
    x: number;
    y: number;
    rotation: number;
  };
  ghostY?: number;
  // Touch/gesture callbacks
  onTap?: () => void;        // Single tap - rotate
  onDoubleTap?: () => void;  // Double tap - hard drop
  onSwipeLeft?: () => void;  // Swipe left - move left
  onSwipeRight?: () => void; // Swipe right - move right
  onSwipeDown?: () => void;  // Swipe down - soft drop
  onTwoFingerTap?: () => void; // Two-finger tap - pause/hold
  onLongPress?: () => void;  // Long press - hold piece
}

export function GameBoard({
  board,
  currentPiece,
  ghostY,
  onTap,
  onDoubleTap,
  onSwipeLeft,
  onSwipeRight,
  onSwipeDown,
  onTwoFingerTap,
  onLongPress,
}: GameBoardProps) {
  const renderBoard = React.useMemo(() => {
    const newBoard = board.map(row => [...row]);

    if (currentPiece && currentPiece.type) {
      addPieceToRenderBoard(newBoard, currentPiece);
    }

    if (currentPiece && ghostY !== undefined) {
      const tetromino = getTetromino(currentPiece.type);
      const shape = tetromino.rotations[currentPiece.rotation % 4];

      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x] !== 0) {
            const boardX = currentPiece.x + x;
            const boardY = ghostY + y;
            if (boardY >= 0 && boardY < newBoard.length && boardX >= 0 && boardX < newBoard[0].length) {
              // Only set as ghost if the cell is currently empty
              if (!newBoard[boardY][boardX]) {
                newBoard[boardY][boardX] = -1; // Ghost marker
              }
            }
          }
        }
      }
    }

    return newBoard;
  }, [board, currentPiece, ghostY]);

  // Touch gesture handling
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const isSwiping = useRef(false);
  const lastTapTime = useRef(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [tapPosition, setTapPosition] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();

    // Two-finger detection
    if (e.touches.length === 2) {
      onTwoFingerTap?.();
      vibrate(10);
      return;
    }

    // Single touch
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchStartTime.current = Date.now();
      isSwiping.current = false;

      // Store tap position for visual feedback
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setTapPosition({
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      });

      // Start long press timer
      longPressTimer.current = setTimeout(() => {
        if (!isSwiping.current) {
          onLongPress?.();
          vibrate(20);
        }
      }, 500);
    }
  }, [onTwoFingerTap, onLongPress]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;

    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Detect if this is becoming a swipe
    if (absX > 10 || absY > 10) {
      isSwiping.current = true;

      // Cancel long press if swiping
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      // Clear tap position feedback
      setTapPosition(null);
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Cancel long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Only handle single-touch gestures
    if (e.changedTouches.length !== 1) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const now = Date.now();

    // Determine gesture type
    if (absX < 10 && absY < 10) {
      // Tap gesture (not a swipe)
      if (now - lastTapTime.current < 300) {
        // Double tap detected
        onDoubleTap?.();
        vibrate(15);
        lastTapTime.current = 0;
      } else {
        // Single tap detected
        onTap?.();
        vibrate(10);
        lastTapTime.current = now;
      }
    } else if (absX > absY) {
      // Horizontal swipe
      if (absX > 30) {
        if (deltaX > 0) {
          onSwipeRight?.();
          vibrate(5);
        } else {
          onSwipeLeft?.();
          vibrate(5);
        }
      }
    } else {
      // Vertical swipe
      if (absY > 30 && deltaY > 0) {
        onSwipeDown?.();
        vibrate(5);
      }
    }

    // Clear tap position feedback
    setTapPosition(null);
  }, [onTap, onDoubleTap, onSwipeLeft, onSwipeRight, onSwipeDown]);

  // Vibration helper
  const vibrate = (duration: number) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  };

  return (
    <div
      className="game-board-container touch-none select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex flex-col gap-[2px] relative">
        {renderBoard.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-[2px]">
            {row.map((cellValue, colIndex) => (
              <TetrisCell
                key={`${rowIndex}-${colIndex}`}
                value={Math.abs(cellValue)}
                isGhost={cellValue === -1}
              />
            ))}
          </div>
        ))}
        {/* Tap feedback overlay */}
        {tapPosition && (
          <div
            className="absolute w-8 h-8 rounded-full bg-white/30 animate-ping pointer-events-none"
            style={{
              left: tapPosition.x - 16,
              top: tapPosition.y - 16,
            }}
          />
        )}
      </div>
    </div>
  );
}

function addPieceToRenderBoard(board: number[][], piece: { type: TetrominoType; x: number; y: number; rotation: number }) {
  const tetromino = getTetromino(piece.type);
  const shape = tetromino.rotations[piece.rotation % 4];

  const colorIndexMap: Record<TetrominoType, number> = {
    Z: 1,
    J: 2,
    O: 3,
    S: 4,
    I: 5,
    T: 6,
    L: 7,
  };

  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x] !== 0) {
        const boardX = piece.x + x;
        const boardY = piece.y + y;

        // Only add if within bounds and not already occupied by a locked piece
        if (boardY >= 0 && boardY < board.length && boardX >= 0 && boardX < board[0].length) {
          if (!board[boardY][boardX]) {
            board[boardY][boardX] = colorIndexMap[piece.type];
          }
        }
      }
    }
  }
}


