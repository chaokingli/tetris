// Tetromino definitions with shapes and colors
export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export interface Tetromino {
  shape: number[][];
  color: string;
}

export const TETROMINOES: Record<TetrominoType, Tetromino> = {
  I: {
    shape: [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
    color: '#00f0f0', // Cyan
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#f0f000', // Yellow
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#a000f0', // Purple
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: '#00f000', // Green
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: '#f00000', // Red
  },
  J: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#0000f0', // Blue
  },
  L: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#f0a000', // Orange
  },
};

export const TETROMINO_KEYS: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

// Get a random tetromino type
export function getRandomTetromino(): TetrominoType {
  return TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
}

// Rotate a matrix 90 degrees clockwise
export function rotateMatrix(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  
  const rotated: number[][] = [];
  for (let c = 0; c < cols; c++) {
    rotated[c] = [];
    for (let r = rows - 1; r >= 0; r--) {
      rotated[c].push(matrix[r][c]);
    }
  }
  
  return rotated;
}

// Check if position is valid within board boundaries
export function isValidPosition(
  shape: number[][],
  row: number,
  col: number,
  width: number,
  height: number
): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] !== 0) {
        const newRow = row + r;
        const newCol = col + c;
        
        // Check boundaries
        if (newRow < 0 || newRow >= height || newCol < 0 || newCol >= width) {
          return false;
        }
      }
    }
  }
  return true;
}

// Check collision with locked pieces on board
export function hasCollision(
  shape: number[][],
  row: number,
  col: number,
  board: (string | null)[][]
): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] !== 0) {
        const boardRow = row + r;
        const boardCol = col + c;
        
        // Check if below bottom of screen
        if (boardRow >= board.length) {
          return true;
        }
        
        // Check collision with locked pieces
        if (board[boardRow][boardCol] !== null) {
          return true;
        }
      }
    }
  }
  return false;
}
