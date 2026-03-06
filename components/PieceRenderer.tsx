import React from 'react';
import { TetrominoType, TETROMINOES } from './Tetrominoes';

interface PieceRendererProps {
  currentPiece: {
    type: TetrominoType;
    shape: number[][];
    row: number;
    col: number;
  } | null;
}

const CELL_SIZE = 24; // pixels per cell
const BOARD_PADDING = 8;

export const PieceRenderer: React.FC<PieceRendererProps> = ({ currentPiece }) => {
  if (!currentPiece) return null;

  return (
    <div style={{
      display: 'inline-block',
      position: 'absolute',
      left: `${BOARD_PADDING}px`,
      top: `${BOARD_PADDING}px`,
      pointerEvents: 'none',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${currentPiece.shape[0]?.length || 1}, ${CELL_SIZE}px)`,
        gap: '1px',
        backgroundColor: '#222',
        padding: '1px',
      }}>
        {currentPiece.shape.map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <div
              key={`piece-${rowIndex}-${colIndex}`}
              style={{
                width: `${CELL_SIZE}px`,
                height: `${CELL_SIZE}px`,
                backgroundColor: cell ? TETROMINOES[currentPiece.type].color : 'transparent',
                border: `1px solid ${cell ? 'rgba(255,255,255,0.3)' : 'transparent'}`,
              }}
            />
          ))
        ))}
      </div>
    </div>
  );
};

export default PieceRenderer;
