import { GameState, TetrominoType } from './types';
import { getRandomTetromino } from '@/lib/tetrominos';
const SHAPES: Record<TetrominoType, number[][]> = {
  I: [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
  O: [[1,1],[1,1]],
  T: [[0,1,0],[1,1,1],[0,0,0]],
  S: [[0,1,1],[1,1,0],[0,0,0]],
  Z: [[1,1,0],[0,1,1],[0,0,0]],
  J: [[0,0,1],[1,1,1],[0,0,0]],
  L: [[1,0,0],[1,1,1],[0,0,0]],
};

const COLORS: Record<TetrominoType, string> = {
  I: '#0ff', O: '#ff0', T: '#a0f', S: '#0f0', Z: '#f00', J: '#00f', L: '#fa0',
};

export function getInitialGameState(playerName: string): GameState {
  const tetrominoTypes: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  const firstPiece = tetrominoTypes[Math.floor(Math.random() * 7)] as TetrominoType;
  const nextPiece = tetrominoTypes[Math.floor(Math.random() * 7)] as TetrominoType;

  return {
    board: Array(20).fill(null).map(() => Array(10).fill(null)),
    currentPiece: null,
    nextPiece,
    holdPiece: null,
    canHold: true,
    score: 0,
    level: 1,
    linesCleared: 0,
    piecesCleared: 0,
    gameOver: false,
    isPaused: false,
    playerName,
  };
}

export function rotatePiece(piece: number[][]): number[][] {
  const N = piece.length;
  const rotated = Array(N).fill(null).map(() => Array(N).fill(0));
  
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      rotated[c][N - 1 - r] = piece[r][c];
    }
  }
  
  return rotated;
}

export function isValidMove(board: string[][], piece: number[][], row: number, col: number): boolean {
  for (let r = 0; r < piece.length; r++) {
    for (let c = 0; c < piece[r].length; c++) {
      if (piece[r][c]) {
        const newRow = row + r;
        const newCol = col + c;

        // Check boundaries
        if (newRow >= board.length || newCol < 0 || newCol >= board[0].length) return false;
        
        // Check collision with settled pieces
        if (board[newRow][newCol] !== null) return false;
      }
    }
  }
  
  return true;
}

export function mergePieceToBoard(board: string[][], piece: number[][], row: number, col: number, color: string): string[][] {
  const newBoard = board.map(r => [...r]);
  
  for (let r = 0; r < piece.length; r++) {
    for (let c = 0; c < piece[r].length; c++) {
      if (piece[r][c]) {
        newBoard[row + r][col + c] = color;
      }
    }
  }
  
  return newBoard;
}

export function clearLines(board: string[][]): { board: string[][], linesCleared: number, points: number } {
  let linesCleared = 0;
  const newBoard = board.filter(row => row.some(cell => cell === null));
  
  while (newBoard.length < 20) {
    newBoard.unshift(Array(10).fill(null));
  }
  
  // Calculate points based on lines cleared
  let points = 0;
  switch(linesCleared) {
    case 4: points = 800 * board.length; break; // Tetris!
    case 3: points = 500; break;
    case 2: points = 300; break;
    case 1: points = 100; break;
  }
  
  return { board: newBoard, linesCleared, points };
}

export function getPiecePosition(piece: number[][], row: number, col: number): Array<{row: number, col: number}> {
  const positions: Array<{row: number, col: number}> = [];
  
  for (let r = 0; r < piece.length; r++) {
    for (let c = 0; c < piece[r].length; c++) {
      if (piece[r][c]) {
        positions.push({ row: row + r, col: col + c });
      }
    }
  }
  
  return positions;
}

// Movement functions that mutate state directly (for use in component)
export function moveLeft(board: string[][], piece: number[][], row: number, col: number): boolean {
  return isValidMove(board, piece, row, col - 1);
}

export function moveRight(board: string[][], piece: number[][], row: number, col: number): boolean {
  return isValidMove(board, piece, row, col + 1);
}

export function moveDown(board: string[][], piece: number[][], row: number, col: number): boolean {
  return isValidMove(board, piece, row + 1, col);
}

export function tryRotate(board: string[][], piece: number[][]): { valid: boolean; rotated?: number[][] } {
  const rotated = rotatePiece(piece);
  
  // Try basic rotation
  if (isValidMove(board, rotated, Math.floor(piece.length / 2), Math.floor((piece[0].length - 1) / 2))) {
    return { valid: true, rotated };
  }
  
  // Wall kick attempts
  const kicks = [-1, 1, -2, 2];
  for (const offset of kicks) {
    if (isValidMove(board, rotated, Math.floor(piece.length / 2), Math.floor((piece[0].length - 1) / 2) + offset)) {
      return { valid: true, rotated };
    }
  }
  
  return { valid: false };
}

export function hardDropPosition(board: string[][], piece: number[][], row: number, col: number): number {
  while (isValidMove(board, piece, row + 1, col)) {
    row++;
  }
  return row;
}

export function calculateDropSpeed(level: number): number {
  const baseSpeed = 1000;
  const speedDecrement = 50 * (level - 1);
  return Math.max(baseSpeed - speedDecrement, 100);
}

export async function saveGameStats(
  playerName: string,
  score: number,
  level: number,
  linesCleared: number
): Promise<void> {
  try {
    const dbModule = await import('@/src/lib/db');
    if (dbModule.saveScoreToDb) {
      await dbModule.saveScoreToDb(playerName, score)
    }
  } catch (error) {
    console.error('Failed to save game stats:', error);
  }
}

// Movement functions for GameLogic exports
export function movePiece(gameState: GameState, direction: 'left' | 'right' | 'down'): GameState {
  if (!gameState.currentPiece) return gameState;

  const { board, currentPiece } = gameState;
  const { shape, row, col, type } = currentPiece;

  let newCol = col;
  if (direction === 'left') newCol = col - 1;
  else if (direction === 'right') newCol = col + 1;
  else if (direction === 'down') {
    // Try moving down
    if (!isValidMove(board, shape, row + 1, col)) {
      // Cannot move down - lock piece and spawn new one
      const lockedBoard = mergePieceToBoard(board, shape, row, col, type);
      const { board: clearedBoard, linesCleared, points } = clearLines(lockedBoard);
      
      return {
        ...gameState,
        board: clearedBoard,
        score: gameState.score + points,
        linesCleared: gameState.linesCleared + linesCleared,
        level: Math.floor((gameState.linesCleared + linesCleared) / 10) + 1,
        piecesCleared: gameState.piecesCleared + 1,
        currentPiece: spawnNextPiece(gameState.nextPiece),
        nextPiece: getRandomTetromino(),
      };
    }
    return { ...gameState, currentPiece: { ...currentPiece, row: row + 1 } };
  }

  // Check if move is valid for left/right
  if (!isValidMove(board, shape, row, newCol)) {
    return gameState; // Invalid move, return unchanged
  }

  return { ...gameState, currentPiece: { ...currentPiece, col: newCol } };
}

export function rotateCurrentPiece(gameState: GameState): GameState {
  if (!gameState.currentPiece) return gameState;

  const { board, currentPiece } = gameState;
  const rotatedShape = rotatePiece(currentPiece.shape);

  // Try basic rotation first
  if (isValidMove(board, rotatedShape, currentPiece.row, currentPiece.col)) {
    return { ...gameState, currentPiece: { ...currentPiece, shape: rotatedShape } };
  }

  // Wall kick attempts - try offsets
  const kicks = [-1, 1, -2, 2];
  for (const offset of kicks) {
    if (isValidMove(board, rotatedShape, currentPiece.row, currentPiece.col + offset)) {
      return { ...gameState, currentPiece: { ...currentPiece, shape: rotatedShape, col: currentPiece.col + offset } };
    }
  }

  // Rotation not possible, return unchanged
  return gameState;
}

export function hardDrop(gameState: GameState): GameState {
  if (!gameState.currentPiece) return gameState;

  const { board, currentPiece } = gameState;
  let newRow = currentPiece.row;

  // Find the lowest valid position
  while (isValidMove(board, currentPiece.shape, newRow + 1, currentPiece.col)) {
    newRow++;
  }

  // Lock piece at final position
  const lockedBoard = mergePieceToBoard(board, currentPiece.shape, newRow, currentPiece.col, currentPiece.type);
  const { board: clearedBoard, linesCleared, points } = clearLines(lockedBoard);

  return {
    ...gameState,
    board: clearedBoard,
    score: gameState.score + points * 2, // Bonus for hard drop
    linesCleared: gameState.linesCleared + linesCleared,
    level: Math.floor((gameState.linesCleared + linesCleared) / 10) + 1,
    piecesCleared: gameState.piecesCleared + 1,
    currentPiece: spawnNextPiece(gameState.nextPiece),
    nextPiece: (['I', 'O', 'T', 'S', 'Z', 'J', 'L'] as TetrominoType[])[Math.floor(Math.random() * 7)],
  };
}

export function checkGameOver(board: string[][]): boolean {
  // Check if any piece at the top would immediately collide
  const testShapes = [
    [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]], // I
    [[1,1],[1,1]], // O
    [[0,1,0],[1,1,1],[0,0,0]], // T
    [[0,1,1],[1,1,0],[0,0,0]], // S
    [[1,1,0],[0,1,1],[0,0,0]], // Z
    [[0,0,1],[1,1,1],[0,0,0]], // J
    [[1,0,0],[1,1,1],[0,0,0]]  // L
  ];

  for (const shape of testShapes) {
    // Check if piece can spawn at top
    const col = 3;
    let canSpawn = true;
    
    for (let r = 0; r < shape.length && canSpawn; r++) {
      for (let c = 0; c < shape[r].length && canSpawn; c++) {
        if (shape[r][c]) {
          const boardRow = r;
          const boardCol = col + c;
          
          if (boardRow >= 20) return true; // Below board
          if (board[boardRow]?.[boardCol] !== null) canSpawn = false; // Collision
        }
      }
    }
    
    if (!canSpawn) continue;
    // If any piece can spawn, game is not over
    return false;
  }

  // All pieces collide at spawn position
  return true;
}

function spawnNextPiece(nextType: TetrominoType): { type: TetrominoType; shape: number[][]; row: number; col: number } {
  return { type: nextType, shape: SHAPES[nextType], row: 0, col: Math.floor((10 - SHAPES[nextType][0].length) / 2) };
}

// Hold piece function - swap current piece with held piece
export function holdPiece(gameState: GameState): GameState {
  if (!gameState.currentPiece || !gameState.canHold) {
    return gameState;
  }

  const currentType = gameState.currentPiece.type;
  const newHoldPiece = gameState.holdPiece;

  if (newHoldPiece === null) {
    // First hold - just store current piece and spawn new one
    return {
      ...gameState,
      holdPiece: currentType,
      canHold: false,
      currentPiece: spawnNextPiece(gameState.nextPiece),
      nextPiece: (['I', 'O', 'T', 'S', 'Z', 'J', 'L'] as TetrominoType[])[Math.floor(Math.random() * 7)],
    };
  }

  // Swap with held piece
  return {
    ...gameState,
    holdPiece: currentType,
    canHold: false,
    currentPiece: { type: newHoldPiece, shape: SHAPES[newHoldPiece], row: 0, col: Math.floor((10 - SHAPES[newHoldPiece][0].length) / 2) },
  };
}

// Re-export types and interfaces for external use
export type { GameState, TetrominoType } from './types';
export interface GameStats {
  playerName: string;
  score: number;
  level: number;
  linesCleared: number;
}


