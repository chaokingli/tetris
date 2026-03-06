'use client';

import React from 'react';
import { TetrominoType, getTetromino } from '@/lib/tetrominos';

interface CellProps {
  value: number; // 0 = empty, >0 = piece color index
  isGhost?: boolean;
}

const CELL_SIZE_PX = 30;
const BORDER_RADIUS = '4px';

export function TetrisCell({ value, isGhost }: CellProps) {
  const baseColor = getColorForValue(value);
  
  if (value === 0 && !isGhost) {
    return <div className="bg-gray-800/30" style={{ width: CELL_SIZE_PX, height: CELL_SIZE_PX, borderRadius: BORDER_RADIUS, border: '1px solid rgba(255,255,255,0.05)' }} />;
  }

  return (
    <div
      className={isGhost ? 'border-2 border-dashed' : ''}
      style={{
        backgroundColor: isGhost ? baseColor + '33' : baseColor,
        width: CELL_SIZE_PX,
        height: CELL_SIZE_PX,
        borderRadius: BORDER_RADIUS,
        border: value > 0 && !isGhost ? `2px solid rgba(255,255,255,0.4)` : `1px solid rgba(255,255,255,0.1)`,
        boxShadow: !isGhost && value > 0 ? `0 0 8px ${baseColor}60, inset 0 0 4px rgba(255,255,255,0.2)` : 'none',
        transition: 'all 0.1s ease',
      }}
    />
  );
}

export function getColorForValue(value: number): string {
  const pieceTypes: TetrominoType[] = ['Z', 'J', 'O', 'S', 'I', 'T', 'L'];
  
  if (value <= 0 || value > pieceTypes.length) return '#374151'; // gray-700 for empty
  
  const colors: Record<TetrominoType, string> = {
    Z: '#ef4444',
    J: '#3b82f6',
    O: '#eab308',
    S: '#22c55e',
    I: '#06b6d4',
    T: '#a855f7',
    L: '#f97316',
  };
  
  return colors[pieceTypes[value - 1]] || '#374151';
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
    <div className="inline-block bg-gradient-to-br from-gray-900 to-gray-800 p-3 rounded-xl border-4 border-gray-600 shadow-2xl">
      {renderBoard.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-0.5 mb-0.5 last:mb-0">
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


