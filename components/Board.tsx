import React from 'react';
import { TetrominoType, TETROMINOES } from './Tetrominoes';

interface BoardProps {
  board: (string | null)[][];
}

const CELL_SIZE = 24; // pixels per cell
const BOARD_PADDING = 8;

export const Board: React.FC<BoardProps> = ({ board }) => {
  return (
    <div style={{
      display: 'inline-block',
      backgroundColor: '#0a0a10',
      padding: `${BOARD_PADDING}px`,
      borderRadius: '8px',
      border: `2px solid #333`,
      boxShadow: '0 0 20px rgba(0,0,0,0.5)',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${board[0]?.length || 10}, ${CELL_SIZE}px)`,
        gap: '1px',
        backgroundColor: '#222',
        padding: '1px',
        borderRadius: '4px',
      }}>
        {board.map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              style={{
                width: `${CELL_SIZE}px`,
                height: `${CELL_SIZE}px`,
                backgroundColor: cell ? TETROMINOES[cell as TetrominoType].color : '#111',
                border: `1px solid ${cell ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}`,
              }}
            />
          ))
        ))}
      </div>
    </div>
  );
};

export default Board;
