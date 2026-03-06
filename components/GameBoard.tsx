'use client';

import React from 'react';
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
}

export function GameBoard({ board, currentPiece, ghostY }: GameBoardProps) {
  const renderBoard = React.useMemo(() => {
    const newBoard = board.map(row => [...row]);
    
    if (currentPiece && ghostY !== undefined) {
      const tetromino = getTetromino(currentPiece.type);
      const shape = tetromino.rotations[currentPiece.rotation % 4];
      
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x] !== 0) {
            const boardX = currentPiece.x + x;
            const boardY = ghostY + y;
            if (boardY >= 0 && boardY < newBoard.length && boardX >= 0 && boardX < newBoard[0].length) {
              if (!newBoard[boardY][boardX]) {
                newBoard[boardY][boardX] = -1; // Ghost marker
              }
            }
          }
        }
      }
    }

    if (currentPiece && currentPiece.type) {
      addPieceToRenderBoard(newBoard, currentPiece);
    }
    
    return newBoard;
  }, [board, currentPiece, ghostY]);

  return (
    <div className="game-board-container">
      <div className="flex flex-col gap-[2px]">
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


