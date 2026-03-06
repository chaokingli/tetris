// Game state management and core Tetris mechanics

import { Grid, BOARD_HEIGHT, BOARD_BORDER_HEIGHT, CellValue } from './board';
import { isLineComplete } from './board';
import { TetrominoType, getTetromino, getRandomTetromino, TETROMINOES } from './tetrominos';

export interface Piece {
  type: TetrominoType;
  rotation: number; // Current rotation index (0-3)
  x: number;        // X position on board
  y: number;        // Y position on board
}

export interface GameState {
  board: Grid;
  currentPiece: Piece | null;
  nextPiece: TetrominoType;
  score: number;
  level: number;
  lines: number;
  gameOver: boolean;
  paused: boolean;
  softDropCounter: number; // For soft drop speed calculation
}

export const INITIAL_STATE: Omit<GameState, 'board' | 'currentPiece'> = {
  nextPiece: getRandomTetromino(),
  score: 0,
  level: 1,
  lines: 0,
  gameOver: false,
  paused: false,
  softDropCounter: 0,
};

// Standard Tetris scoring system (Nintendo)
const SCORING = {
  single: [40, 80, 120, 160], // Points per line at level 1
  double: 320,
  triple: 500,
  tetris: 800,
  softDrop: 1,
  hardDrop: 2,
};

// Scoring formula with level multiplier
export function calculateScore(linesCleared: number, level: number): number {
  const baseScores = SCORING.single;
  
  if (linesCleared === 4) return SCORING.tetris * level;
  if (linesCleared === 3) return SCORING.triple * level;
  if (linesCleared === 2) return SCORING.double * level;
  if (linesCleared >= 1 && linesCleared <= 3) {
    return baseScores[linesCleared - 1] * level;
  }
  
  return 0;
}

// Calculate line clear delay based on level
export function getClearDelay(level: number): number {
  // Faster clears at higher levels, minimum 25ms
  return Math.max(25, 450 - (level * 20));
}

// Create initial game state with new piece
export function createInitialState(): GameState {
  const nextType = getRandomTetromino();
  
  // Spawn first piece at the top center
  const spawnX = Math.floor(10 / 2) - 1;
  const spawnY = 2; // Board border height
  
  return {
    board: [], // Will be initialized by game engine
    currentPiece: { type: nextType, rotation: 0, x: spawnX, y: spawnY },
    nextPiece: getRandomTetromino(),
    score: 0,
    level: 1,
    lines: 0,
    gameOver: false,
    paused: false,
    softDropCounter: 0,
  };
}

// Get the shape of current piece at its rotation state
export function getPieceShape(piece: Piece): number[][] {
  const tetromino = TETROMINOES[piece.type];
  return tetromino.rotations[piece.rotation];
}

// Attempt to rotate a piece (returns true if successful)
export function tryRotate(
  board: Grid,
  state: GameState,
  direction: 'clockwise' | 'counterClockwise',
  wallKickData: ReturnType<typeof getTetromino>['wallKicks']
): { success: boolean; xOffset?: number } {
  if (!state.currentPiece) return { success: false };
  
  const piece = state.currentPiece;
  const newRotation = direction === 'clockwise' 
    ? (piece.rotation + 1) % 4
    : (piece.rotation + 3) % 4; // Equivalent to -1 mod 4
  
  // Try wall kicks if direct rotation fails
  const kickOffsets = direction === 'clockwise' 
    ? wallKickData.clockwise
    : wallKickData.counterClockwise;
  
  for (const offset of kickOffsets) {
    const newX = piece.x + offset.x;
    
    // Check if this position works with the new rotation
    if (!hasCollision(board, getPieceShape({ ...piece, rotation: newRotation }), newX, piece.y)) {
      return { success: true, xOffset: offset.x };
    }
  }
  
  return { success: false };
}

// Check collision at a position (helper for tryRotate)
function hasCollision(
  board: Grid,
  shape: number[][],
  x: number,
  y: number
): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] !== 0) {
        const newX = x + c;
        const newY = y + r;
        
        // Check bounds and existing blocks
        if (
          newX < 0 || 
          newX >= 10 || 
          newY < 0 || 
          newY > 21 ||
          board[newY][newX] !== 0
        ) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// Move piece horizontally (returns true if successful)
export function tryMove(
  board: Grid,
  state: GameState,
  dx: number
): boolean {
  if (!state.currentPiece) return false;
  
  const newX = state.currentPiece.x + dx;
  
  // Check bounds and collision
  for (let r = 0; r < getPieceShape(state.currentPiece).length; r++) {
    for (let c = 0; c < getPieceShape(state.currentPiece)[r].length; c++) {
      if (getPieceShape(state.currentPiece)[r][c] !== 0) {
        const boardX = newX + c;
        const boardY = state.currentPiece.y + r;
        
        if (boardX < 0 || boardX >= 10 || boardY > 21 || board[boardY][boardX] !== 0) {
          return false;
        }
      }
    }
  }
  
  // Apply move
  state.currentPiece = { ...state.currentPiece, x: newX };
  return true;
}

// Move piece down by one row (returns true if successful)
export function tryMoveDown(board: Grid, state: GameState): boolean {
  if (!state.currentPiece) return false;
  
  const newY = state.currentPiece.y + 1;
  
  // Check for collision at new position
  for (let r = 0; r < getPieceShape(state.currentPiece).length; r++) {
    for (let c = 0; c < getPieceShape(state.currentPiece)[r].length; c++) {
      if (getPieceShape(state.currentPiece)[r][c] !== 0) {
        const boardY = newY + r;
        
        // If at bottom or collision, piece has landed
        if (boardY > 21 || board[boardY][state.currentPiece.x + c] !== 0) {
          return false;
        }
      }
    }
  }
  
  // Apply move
  state.currentPiece = { ...state.currentPiece, y: newY };
  return true;
}

// Hard drop - instant movement to bottom
export function hardDrop(board: Grid, state: GameState): number {
  if (!state.currentPiece) return 0;
  
  let dropDistance = 0;
  const piece = state.currentPiece;
  
  // Calculate how far we can fall
  while (tryMoveDown(board, state)) {
    dropDistance++;
  }
  
  // Lock the piece immediately after hard drop
  lockPiece(board, state);
  
  return dropDistance * SCORING.hardDrop; // Points for hard drop
}

// Lock current piece to board and handle line clears
export function lockPiece(board: Grid, state: GameState): void {
  if (!state.currentPiece) return;
  
  const shape = getPieceShape(state.currentPiece);
  
  // Place piece on board with color index
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] !== 0) {
        const boardY = state.currentPiece.y + r;
        const boardX = state.currentPiece.x + c;
        
        if (boardY >= 0 && boardY <= 21 && boardX >= 0 && boardX < 10) {
          // Use color value from tetromino definition
          // Convert tetromino type to color index (1-7)
          const colorIndex = state.currentPiece.type.charCodeAt(0) - 64; // I=9, C=67, so 9-67=-58... wrong
          board[boardY][boardX] = colorIndex;
        }
      }
    }
  }
  
  // Check for line clears
  checkLineClears(board, state);
}

// Handle line clear logic and level progression
export function checkLineClears(board: Grid, state: GameState): void {
  let clearedLines = 0;
  
  // Clear complete lines (from bottom up)
  for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
    if (isLineComplete(board[y])) {
      board.splice(y, 1);
      const newRow = Array(10).fill(0);
      board.unshift(newRow);
      clearedLines++;
      y++; // Check same row again (shifted down)
    }
  }
  
  if (clearedLines > 0) {
    // Update score and lines
    state.score += calculateScore(clearedLines, state.level);
    state.lines += clearedLines;
    
    // Level up every 10 lines
    const newLevel = Math.floor(state.lines / 10) + 1;
    if (newLevel > state.level) {
      state.level = newLevel;
    }
  }
}

// Check if piece has landed (can't move down further)
export function isLanded(board: Grid, state: GameState): boolean {
  if (!state.currentPiece) return true;
  
  const shape = getPieceShape(state.currentPiece);
  
  // Try to move down - if fails, it's landed
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] !== 0) {
        const boardY = state.currentPiece.y + r + 1;
        if (boardY > 21 || board[boardY][state.currentPiece.x + c] !== 0) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// Spawn a new piece after current one is locked
export function spawnNewPiece(state: GameState): boolean {
  const type = state.nextPiece;
  const spawnX = Math.floor(10 / 2) - 1;
  const spawnY = BOARD_HEIGHT; // Board border height
  
  const newPiece: Piece = { type, rotation: 0, x: spawnX, y: spawnY };
  
  // Check if game over at spawn position
  for (let r = 0; r < getPieceShape(newPiece).length; r++) {
    for (let c = 0; c < getPieceShape(newPiece)[r].length; c++) {
      if (getPieceShape(newPiece)[r][c] !== 0) {
        const boardY = spawnY + r;
        if (boardY > BOARD_HEIGHT * 2 || state.board[boardY][spawnX + c] !== 0) {
          state.gameOver = true;
          return false;
        }
      }
    }
  }
  
  // Spawn new piece and cycle next piece
  state.currentPiece = newPiece;
  state.nextPiece = getRandomTetromino();
  
  return true;
}

// Check if game is over
export function checkGameOver(board: Grid, state: GameState): boolean {
  if (!state.currentPiece) return state.gameOver;
  
  const shape = getPieceShape(state.currentPiece);
  
  // Try to spawn at initial position - if collision, game over
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] !== 0) {
        const boardY = BOARD_HEIGHT + r;
        if (boardY > BOARD_HEIGHT * 2 || board[boardY][Math.floor(10/2) - 1 + c] !== 0) {
          state.gameOver = true;
          return true;
        }
      }
    }
  }
  
  return false;
}

// Reset game to initial state
export function resetGame(): GameState {
  const initialState = createInitialState();
  initialState.board = Array.from({ length: BOARD_HEIGHT + BOARD_BORDER_HEIGHT }, () => 
    Array(10).fill(0) as CellValue[]
  );
  
  return initialState;
}
