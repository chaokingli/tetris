// Tetromino shapes with SRS (Super Rotation System) rotation data
// Standard 7 tetrominoes: I, O, T, S, Z, J, L

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export interface Tetromino {
  id: TetrominoType;
  color: string;
  rotations: number[][][]; // Array of rotation states (4 for most, fewer for O)
  wallKicks: WallKickData; // SRS wall kick data per rotation
}

interface WallKickData {
  // Format: { [rotationDelta: number]: { x: number, y: number }[] }
  // Key is rotation direction (clockwise or counter-clockwise)
  // Value is array of possible kick offsets to try
  clockwise: Array<{ x: number; y: number }>;
  counterClockwise: Array<{ x: number; y: number }>;
}

// SRS Wall Kick Data (Standard Super Rotation System)
// For each rotation state, define possible wall kicks when blocked
const WALL_KICK_DATA: Record<TetrominoType, WallKickData> = {
  I: {
    clockwise: [
      { x: -1, y: 0 }, // Kick left from 2→3 or 3→0
      { x: -1, y: -1 },
      { x: -1, y: 2 },
      { x: 0, y: -2 },
      { x: 0, y: 1 },
      { x: 1, y: -1 },
      { x: 1, y: 0 },
    ],
    counterClockwise: [
      { x: 1, y: 0 }, // Kick right from 3→2 or 0→1
      { x: 1, y: 1 },
      { x: 1, y: -2 },
      { x: 0, y: 2 },
      { x: 0, y: -1 },
      { x: -1, y: 1 },
      { x: -1, y: 0 },
    ],
  },
  J: {
    clockwise: [
      { x: -1, y: 0 }, // Kick left for most rotations
      { x: -1, y: 1 },
      { x: 0, y: -2 },
      { x: 0, y: 1 },
      { x: 1, y: -1 },
    ],
    counterClockwise: [
      { x: 1, y: 0 }, // Kick right for most rotations
      { x: 1, y: 1 },
      { x: 0, y: -2 },
      { x: 0, y: 1 },
      { x: -1, y: -1 },
    ],
  },
  L: {
    clockwise: [
      { x: 1, y: 0 }, // Kick right for most rotations
      { x: 1, y: 1 },
      { x: 0, y: -2 },
      { x: 0, y: 1 },
      { x: -1, y: -1 },
    ],
    counterClockwise: [
      { x: -1, y: 0 }, // Kick left for most rotations
      { x: -1, y: 1 },
      { x: 0, y: -2 },
      { x: 0, y: 1 },
      { x: 1, y: -1 },
    ],
  },
  O: {
    // No wall kicks needed for O block (doesn't rotate meaningfully)
    clockwise: [],
    counterClockwise: [],
  },
  S: {
    clockwise: [
      { x: -1, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: -2 },
      { x: 0, y: 1 },
      { x: 1, y: -1 },
    ],
    counterClockwise: [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: -2 },
      { x: 0, y: 1 },
      { x: -1, y: -1 },
    ],
  },
  T: {
    clockwise: [
      { x: -1, y: 0 }, // Kick left for most rotations
      { x: -1, y: 1 },
      { x: 0, y: -2 },
      { x: 0, y: 1 },
      { x: 1, y: -1 },
    ],
    counterClockwise: [
      { x: 1, y: 0 }, // Kick right for most rotations
      { x: 1, y: 1 },
      { x: 0, y: -2 },
      { x: 0, y: 1 },
      { x: -1, y: -1 },
    ],
  },
  Z: {
    clockwise: [
      { x: 1, y: 0 }, // Kick right for most rotations
      { x: 1, y: 1 },
      { x: 0, y: -2 },
      { x: 0, y: 1 },
      { x: -1, y: -1 },
    ],
    counterClockwise: [
      { x: -1, y: 0 }, // Kick left for most rotations
      { x: -1, y: 1 },
      { x: 0, y: -2 },
      { x: 0, y: 1 },
      { x: 1, y: -1 },
    ],
  },
};

// Tetromino shapes in their base rotation (rotation 0)
const BASE_SHAPES: Record<TetrominoType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

// Generate all rotation states for each tetromino
function generateRotations(baseShape: number[][]): number[][][] {
  const rotations: number[][][] = [];
  
  // Rotation 0 is the base shape (normalized to top-left)
  rotations.push(normalizeShape(baseShape));
  
  // Generate rotations 1, 2, 3 by rotating 90° clockwise each time
  let current = baseShape;
  for (let i = 1; i < 4; i++) {
    current = rotateMatrix(current);
    rotations.push(normalizeShape(current));
  }
  
  return rotations;
}

// Rotate a matrix 90° clockwise
function rotateMatrix(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  
  // Create new matrix with swapped dimensions
  const result: number[][] = Array.from({ length: cols }, () => 
    Array(rows).fill(0)
  );
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      result[c][rows - 1 - r] = matrix[r][c];
    }
  }
  
  return result;
}

// Normalize shape to top-left corner
function normalizeShape(shape: number[][]): number[][] {
  // Find bounding box
  let minRow = Infinity, maxRow = -Infinity;
  let minCol = Infinity, maxCol = -Infinity;
  
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] !== 0) {
        minRow = Math.min(minRow, r);
        maxRow = Math.max(maxRow, r);
        minCol = Math.min(minCol, c);
        maxCol = Math.max(maxCol, c);
      }
    }
  }
  
  // Crop to bounding box
  const height = maxRow - minRow + 1;
  const width = maxCol - minCol + 1;
  
  return shape.slice(minRow, minRow + height).map(row => 
    row.slice(minCol, minCol + width)
  );
}

// Export all tetrominoes with their rotation data and colors (SRS standard)
export const TETROMINOES: Record<TetrominoType, Tetromino> = {
  I: {
    id: 'I',
    color: '#00FFFF', // Cyan
    rotations: generateRotations(BASE_SHAPES.I),
    wallKicks: WALL_KICK_DATA.I,
  },
  O: {
    id: 'O',
    color: '#FFFF00', // Yellow
    rotations: generateRotations(BASE_SHAPES.O),
    wallKicks: WALL_KICK_DATA.O,
  },
  T: {
    id: 'T',
    color: '#800080', // Purple
    rotations: generateRotations(BASE_SHAPES.T),
    wallKicks: WALL_KICK_DATA.T,
  },
  S: {
    id: 'S',
    color: '#00FF00', // Green
    rotations: generateRotations(BASE_SHAPES.S),
    wallKicks: WALL_KICK_DATA.S,
  },
  Z: {
    id: 'Z',
    color: '#FF0000', // Red
    rotations: generateRotations(BASE_SHAPES.Z),
    wallKicks: WALL_KICK_DATA.Z,
  },
  J: {
    id: 'J',
    color: '#0000FF', // Blue
    rotations: generateRotations(BASE_SHAPES.J),
    wallKicks: WALL_KICK_DATA.J,
  },
  L: {
    id: 'L',
    color: '#FFA500', // Orange
    rotations: generateRotations(BASE_SHAPES.L),
    wallKicks: WALL_KICK_DATA.L,
  },
};

// Helper function to get a random tetromino (bag system could be added later)
export function getRandomTetromino(): TetrominoType {
  const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  const randomIndex = Math.floor(Math.random() * types.length);
  return types[randomIndex];
}

export function getTetromino(type: TetrominoType): Tetromino {
  return TETROMINOES[type];
}
