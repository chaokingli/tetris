import React from 'react';

interface PreviewPieceProps {
  type: 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
}

const CELL_SIZE = 15; // pixels per cell for preview

export const PreviewPiece: React.FC<PreviewPieceProps> = ({ type }) => {
  const shapes: Record<'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L', number[][]> = {
    I: [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
    O: [[1,1],[1,1]],
    T: [[0,1,0],[1,1,1],[0,0,0]],
    S: [[0,1,1],[1,1,0],[0,0,0]],
    Z: [[1,1,0],[0,1,1],[0,0,0]],
    J: [[0,0,1],[1,1,1],[0,0,0]],
    L: [[1,0,0],[1,1,1],[0,0,0]],
  };

  const colors: Record<'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L', string> = {
    I: '#0ff', O: '#ff0', T: '#a0f', S: '#0f0', Z: '#f00', J: '#00f', L: '#fa0',
  };

  const shape = shapes[type];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${shape[0].length}, ${CELL_SIZE}px)`,
      gap: '1px',
      backgroundColor: '#333',
      padding: '2px',
    }}>
      {shape.map((row, r) =>
        row.map((cell, c) => (
          <div key={`${r}-${c}`} style={{
            width: `${CELL_SIZE}px`,
            height: `${CELL_SIZE}px`,
            backgroundColor: cell ? colors[type] : 'transparent',
            border: cell ? '1px solid rgba(255,255,255,0.3)' : 'none',
          }} />
        ))
      )}
    </div>
  );
};

export default PreviewPiece;
