'use client';

import React from 'react';
import { TetrominoType } from '@/lib/tetrominos';
import { getTetromino } from '@/lib/tetrominos';

interface CellProps {
  value: number; // 0 = empty, >0 = piece color index
  isGhost?: boolean;
}

const CELL_SIZE_PX = 30;
const BORDER_RADIUS = '4px';

export function TetrisCell({ value, isGhost }: CellProps) {
  const baseColor = getColorForValue(value);
  
  if (value === 0 && !isGhost) {
    return <div className="bg-gray-800" style={{ width: CELL_SIZE_PX, height: CELL_SIZE_PX }} />;
  }

  return (
    <div
      className={isGhost ? 'border-2 border-dashed' : ''}
      style={{
        backgroundColor: isGhost ? baseColor + '33' : baseColor, // Add transparency for ghost
        width: CELL_SIZE_PX,
        height: CELL_SIZE_PX,
        borderRadius: BORDER_RADIUS,
        border: value > 0 && !isGhost ? `2px solid ${baseColor}CC` : undefined,
      }}
    />
  );
}

export function getColorForValue(value: number): string {
  const colors: Record<number, string> = {
    1: '#FF6B6B', // Red-ish (Z piece base)
    2: '#4ECDC4', // Teal (J piece base)
    3: '#FFE66D', // Yellow (O piece base)
    4: '#95E1D3', // Mint green (S piece base)
    5: '#F38181', // Salmon red (I piece base)
    6: '#AA77A3', // Purple (T piece base)
    7: '#6B7C93', // Blue-grey (L piece base)
    8: '#E07D42', // Orange-brown (J piece accent)
    9: '#F5D5C9', // Light pink (accent color)
  };

  if (value === 0) return 'transparent';
  
  const index = ((value - 1) % 9) + 1; // Cycle through colors 1-9
  return colors[index] || '#CCCCCC';
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
}

export function GameBoard({ board, currentPiece, ghostY }: GameBoardProps) {
  // Create a copy of the board for rendering
  const renderBoard = board.map(row => [...row]);
  
  // Add current piece to render board
  if (currentPiece && currentPiece.type) {
    addPieceToRenderBoard(renderBoard, currentPiece);
    
    // Calculate ghost piece position
    if (ghostY !== undefined) {
      const tetromino = getTetromino(currentPiece.type);
      const shape = tetromino.rotations[currentPiece.rotation % 4];
      
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x] !== 0) {
            const boardX = currentPiece.x + x;
            const boardY = ghostY + y;
            if (boardY >= 0 && boardY < renderBoard.length && boardX >= 0 && boardX < renderBoard[0].length) {
              // Mark as ghost by using negative value or special marker
              if (!renderBoard[boardY][boardX]) {
                renderBoard[boardY][boardX] = -1; // Ghost marker
              }
            }
          }
        }
      }
    }
  }

  return (
    <div className="inline-block bg-gray-900 p-2 rounded-lg border-4 border-gray-700">
      {renderBoard.map((row, rowIndex) => (
        <div key={rowIndex} className="flex mb-1 last:mb-0">
          {row.map((cellValue, colIndex) => (
            <TetrisCell 
              key={`${rowIndex}-${colIndex}`}
              value={Math.abs(cellValue)} 
              isGhost={cellValue === -1}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function addPieceToRenderBoard(board: number[][], piece: { type: TetrominoType; x: number; y: number; rotation: number }) {
  const tetromino = getTetromino(piece.type);
  const shape = tetromino.rotations[piece.rotation % 4];
  
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x] !== 0) {
        const boardX = piece.x + x;
        const boardY = piece.y + y;
        
        // Only add if within bounds and not already occupied by a locked piece
        if (boardY >= 0 && boardY < board.length && boardX >= 0 && boardX < board[0].length) {
          if (!board[boardY][boardX]) {
            // Use color index based on piece type for display
            const colorIndex = getPieceColorIndex(piece.type);
            board[boardY][boardX] = colorIndex;
          }
        }
      }
    }
  }
}

function getPieceColorIndex(type: TetrominoType): number {
  const colors: Record<TetrominoType, number> = {
    I: 5, // Cyan-ish - salmon red in our palette
    O: 3, // Yellow
    T: 6, // Purple
    S: 4, // Mint green
    Z: 1, // Red-ish
    J: 2, // Teal
    L: 7, // Blue-grey
  };
  
  return colors[type] || 9;
}
