// Complete Tetris Game Engine with SRS (Super Rotation System)
// Implements: Board management, collision detection, SRS wall kicks, line clears, scoring, hold piece, next queue

import { BOARD_WIDTH, BOARD_HEIGHT, CellValue, Grid, createEmptyBoard, hasBlock, isInBounds } from './board';
import { TETROMINOES, TetrominoType, getTetromino, getRandomTetromino } from './tetrominos';

// ============================================================================
// Type Definitions
// ============================================================================

export interface Piece {
  type: TetrominoType;
  rotation: number;        // 0-3 (SRS rotation state)
  x: number;               // Board column (0-9)
  y: number;               // Board row (0-19, negative = spawn area)
}

export interface GameState {
  board: Grid;
  currentPiece: Piece | null;
  nextPieces: TetrominoType[];  // Next 3 pieces queue
  holdPiece: TetrominoType | null;
  canHold: boolean;               // Can only hold once per turn
  score: number;
  level: number;
  linesCleared: number;
  totalDrops: number;            // For drop speed calculation
  gameOver: boolean;
  paused: boolean;
  softDropActive: boolean;
  softDropCells: number;         // Cells dropped during soft drop
  hardDropCells: number;         // Cells dropped during hard drop
  lastDropTime: number;          // Timestamp of last gravity drop
  dropInterval: number;          // Current drop interval in ms
}

export interface GameStateWithStats extends GameState {
  linesThisLevel: number;
  combos: number;
  backToBack: boolean;
}

// ============================================================================
// SRS Wall Kick Data (Standard Nintendo Rotation System)
// ============================================================================

// Standard kick offsets for J, L, S, T, Z pieces
// Format: [fromRotation][kickIndex] = {x, y}
// 5 kicks per rotation state (test in order, use first that works)
const JLSTZ_KICKS: Array<Array<{ x: number; y: number }>> = [
  // Rotation 0 -> 1 (clockwise)
  [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -1 }, { x: -1, y: -1 }],
  // Rotation 1 -> 2 (clockwise)
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
  // Rotation 2 -> 3 (clockwise)
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -1 }, { x: 1, y: -1 }],
  // Rotation 3 -> 0 (clockwise)
  [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 1 }],
];

// Counter-clockwise kicks (reverse direction)
const JLSTZ_KICKS_CCW: Array<Array<{ x: number; y: number }>> = [
  // Rotation 0 -> 3 (counter-clockwise)
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -1 }, { x: 1, y: -1 }],
  // Rotation 1 -> 0 (counter-clockwise)
  [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 1 }],
  // Rotation 2 -> 1 (counter-clockwise)
  [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -1 }, { x: -1, y: -1 }],
  // Rotation 3 -> 2 (counter-clockwise)
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
];

// Special kick offsets for I piece (different due to 4x4 grid)
const I_KICKS: Array<Array<{ x: number; y: number }>> = [
  // Rotation 0 -> 1 (clockwise)
  [{ x: 0, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 2, y: 0 }],
  // Rotation 1 -> 2 (clockwise)
  [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: 2, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 0 }],
  // Rotation 2 -> 3 (clockwise)
  [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: -1, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 0 }],
  // Rotation 3 -> 0 (clockwise)
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 0 }, { x: 2, y: 0 }, { x: -1, y: 0 }],
];

// I piece counter-clockwise kicks
const I_KICKS_CCW: Array<Array<{ x: number; y: number }>> = [
  // Rotation 0 -> 3 (counter-clockwise)
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 0 }, { x: 2, y: 0 }, { x: -1, y: 0 }],
  // Rotation 1 -> 0 (counter-clockwise)
  [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: -1, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 0 }],
  // Rotation 2 -> 1 (counter-clockwise)
  [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: 2, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 0 }],
  // Rotation 3 -> 2 (counter-clockwise)
  [{ x: 0, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 2, y: 0 }],
];

// O piece has no wall kicks (symmetrical, doesn't need kicks)
const O_KICKS: Array<Array<{ x: number; y: number }>> = [
  [{ x: 0, y: 0 }],
  [{ x: 0, y: 0 }],
  [{ x: 0, y: 0 }],
  [{ x: 0, y: 0 }],
];

// Get wall kick data for a specific piece type
export function getWallKicks(
  type: TetrominoType,
  fromRotation: number,
  clockwise: boolean
): Array<{ x: number; y: number }> {
  if (type === 'I') {
    return clockwise ? I_KICKS[fromRotation] : I_KICKS_CCW[fromRotation];
  } else if (type === 'O') {
    return O_KICKS[fromRotation];
  } else {
    // J, L, S, T, Z
    return clockwise ? JLSTZ_KICKS[fromRotation] : JLSTZ_KICKS_CCW[fromRotation];
  }
}

// ============================================================================
// Scoring System (Nintendo Formula)
// ============================================================================

export const SCORING = {
  single: 100,      // 1 line cleared
  double: 300,      // 2 lines cleared
  triple: 500,      // 3 lines cleared
  tetris: 800,      // 4 lines cleared
  softDrop: 1,      // Per cell soft dropped
  hardDrop: 2,      // Per cell hard dropped
};

/**
 * Calculate score for clearing lines
 * @param linesCleared Number of lines cleared (1-4)
 * @param level Current game level
 * @returns Score points
 */
export function calculateLineClearScore(linesCleared: number, level: number): number {
  switch (linesCleared) {
    case 1: return SCORING.single * level;
    case 2: return SCORING.double * level;
    case 3: return SCORING.triple * level;
    case 4: return SCORING.tetris * level;
    default: return 0;
  }
}

/**
 * Calculate soft drop score
 * @param cells Number of cells soft dropped
 * @returns Score points
 */
export function calculateSoftDropScore(cells: number): number {
  return cells * SCORING.softDrop;
}

/**
 * Calculate hard drop score
 * @param cells Number of cells hard dropped
 * @returns Score points
 */
export function calculateHardDropScore(cells: number): number {
  return cells * SCORING.hardDrop;
}

// ============================================================================
// Drop Speed Calculation
// ============================================================================

/**
 * Calculate drop interval (gravity speed) based on level
 * Uses standard Tetris guideline speeds
 * @param level Current level (1-15+)
 * @returns Drop interval in milliseconds
 */
export function calculateDropInterval(level: number): number {
  // Standard Tetris guideline gravity curve
  const speeds = [
    1000,  // Level 1: 1000ms (1 second per row)
    793,   // Level 2
    608,   // Level 3
    459,   // Level 4
    338,   // Level 5
    241,   // Level 6
    166,   // Level 7
    109,   // Level 8
    68,    // Level 9
    41,    // Level 10
    27,    // Level 11
    17,    // Level 12
    11,    // Level 13
    7,     // Level 14
    5,     // Level 15+ (cap at 5ms)
  ];
  
  const index = Math.min(level - 1, speeds.length - 1);
  return speeds[index];
}

// ============================================================================
// Game State Creation
// ============================================================================

/**
 * Create a 7-bag randomizer for fair piece distribution
 * @returns Array of 7 tetromino types
 */
export function create7Bag(): TetrominoType[] {
  const bag: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  // Fisher-Yates shuffle
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

/**
 * Generate initial piece queue (7-bag + next 3)
 * @returns Array of at least 10 pieces
 */
export function generateInitialQueue(): TetrominoType[] {
  return [...create7Bag(), ...create7Bag()];
}

/**
 * Create initial game state
 * @returns Fresh game state ready to play
 */
export function createInitialState(): GameState {
  const queue = generateInitialQueue();
  const spawnPosition = getSpawnPosition();
  
  return {
    board: createEmptyBoard(),
    currentPiece: {
      type: queue[0],
      rotation: 0,
      x: spawnPosition.x,
      y: spawnPosition.y,
    },
    nextPieces: queue.slice(1, 4), // Next 3 pieces
    holdPiece: null,
    canHold: true,
    score: 0,
    level: 1,
    linesCleared: 0,
    totalDrops: 0,
    gameOver: false,
    paused: false,
    softDropActive: false,
    softDropCells: 0,
    hardDropCells: 0,
    lastDropTime: performance.now(),
    dropInterval: calculateDropInterval(1),
  };
}

/**
 * Get spawn position for new piece
 * @returns Spawn x, y coordinates
 */
export function getSpawnPosition(): { x: number; y: number } {
  return {
    x: Math.floor(BOARD_WIDTH / 2) - 2, // Center piece (pieces are up to 4 wide)
    y: -2, // Start above visible board
  };
}

// ============================================================================
// Piece Shape Helpers
// ============================================================================

/**
 * Get the shape matrix for a piece at given rotation
 * @param piece The piece
 * @returns 2D array representing piece shape
 */
export function getPieceShape(piece: Piece): number[][] {
  const tetromino = TETROMINOES[piece.type];
  return tetromino.rotations[piece.rotation];
}

/**
 * Get all occupied cells of a piece
 * @param piece The piece
 * @returns Array of {x, y} board coordinates
 */
export function getPieceCells(piece: Piece): Array<{ x: number; y: number }> {
  const shape = getPieceShape(piece);
  const cells: Array<{ x: number; y: number }> = [];
  
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] !== 0) {
        cells.push({ x: piece.x + c, y: piece.y + r });
      }
    }
  }
  
  return cells;
}

// ============================================================================
// Collision Detection
// ============================================================================

/**
 * Check if piece at given position collides with board boundaries or blocks
 * @param board The game board
 * @param piece Piece to check
 * @param offsetX Optional X offset
 * @param offsetY Optional Y offset
 * @returns True if collision detected
 */
export function checkCollision(
  board: Grid,
  piece: Piece,
  offsetX: number = 0,
  offsetY: number = 0
): boolean {
  const shape = getPieceShape(piece);
  
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] !== 0) {
        const boardX = piece.x + c + offsetX;
        const boardY = piece.y + r + offsetY;
        
        // Check board boundaries
        if (boardX < 0 || boardX >= BOARD_WIDTH) {
          return true;
        }
        
        if (boardY >= BOARD_HEIGHT) {
          return true; // Below visible board
        }
        
        // Check collision with placed blocks (only if on board)
        if (boardY >= 0 && hasBlock(board, boardX, boardY)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Check if piece has landed (can't move down further)
 * @param board The game board
 * @param piece The piece
 * @returns True if piece has landed
 */
export function isLanded(board: Grid, piece: Piece): boolean {
  return checkCollision(board, piece, 0, 1);
}

/**
 * Get the landing position for a piece (ghost piece position)
 * @param board The game board
 * @param piece The piece
 * @returns Y coordinate where piece would land
 */
export function getLandingY(board: Grid, piece: Piece): number {
  let testY = piece.y;
  
  while (!checkCollision(board, { ...piece, y: testY + 1 })) {
    testY++;
    if (testY > BOARD_HEIGHT) break;
  }
  
  return testY;
}

// ============================================================================
// Piece Movement
// ============================================================================

/**
 * Move piece left with wall kick
 * @param board The game board
 * @param state Game state
 * @returns True if move successful
 */
export function moveLeft(board: Grid, state: GameState): boolean {
  if (!state.currentPiece) return false;
  
  // Try direct move first
  if (!checkCollision(board, state.currentPiece, -1, 0)) {
    state.currentPiece.x -= 1;
    return true;
  }
  
  return false;
}

/**
 * Move piece right with wall kick
 * @param board The game board
 * @param state Game state
 * @returns True if move successful
 */
export function moveRight(board: Grid, state: GameState): boolean {
  if (!state.currentPiece) return false;
  
  // Try direct move first
  if (!checkCollision(board, state.currentPiece, 1, 0)) {
    state.currentPiece.x += 1;
    return true;
  }
  
  return false;
}

/**
 * Move piece down (soft drop)
 * @param board The game board
 * @param state Game state
 * @returns True if move successful
 */
export function moveDown(board: Grid, state: GameState): boolean {
  if (!state.currentPiece) return false;
  
  if (!checkCollision(board, state.currentPiece, 0, 1)) {
    state.currentPiece.y += 1;
    state.softDropCells++;
    return true;
  }
  
  return false;
}

/**
 * Hard drop - instant movement to landing position
 * @param board The game board
 * @param state Game state
 * @returns Number of cells dropped (for scoring)
 */
export function hardDrop(board: Grid, state: GameState): number {
  if (!state.currentPiece) return 0;
  
  const startY = state.currentPiece.y;
  const landingY = getLandingY(board, state.currentPiece);
  const dropDistance = landingY - startY;
  
  state.currentPiece.y = landingY;
  state.hardDropCells = dropDistance;
  
  return dropDistance;
}

/**
 * Rotate piece with SRS wall kicks
 * @param board The game board
 * @param state Game state
 * @param clockwise True for clockwise, false for counter-clockwise
 * @returns True if rotation successful
 */
export function rotatePiece(board: Grid, state: GameState, clockwise: boolean = true): boolean {
  if (!state.currentPiece) return false;
  
  const piece = state.currentPiece;
  const tetromino = TETROMINOES[piece.type];
  
  // O piece doesn't rotate
  if (piece.type === 'O') {
    return false;
  }
  
  // Calculate new rotation state
  const newRotation = clockwise
    ? (piece.rotation + 1) % 4
    : (piece.rotation + 3) % 4; // Equivalent to -1 mod 4
  
  // Get appropriate wall kick data
  const kicks = getWallKicks(piece.type, piece.rotation, clockwise);
  
  // Try each kick offset
  for (const kick of kicks) {
    const testPiece: Piece = {
      ...piece,
      rotation: newRotation,
      x: piece.x + kick.x,
      y: piece.y - kick.y, // SRS uses negative Y for upward kicks
    };
    
    if (!checkCollision(board, testPiece)) {
      state.currentPiece = testPiece;
      return true;
    }
  }
  
  return false;
}

// ============================================================================
// Hold Piece System
// ============================================================================

/**
 * Hold current piece (swap with held piece)
 * @param state Game state
 * @returns True if hold successful
 */
export function holdCurrentPiece(state: GameState): boolean {
  if (!state.currentPiece || !state.canHold) {
    return false;
  }
  
  const currentType = state.currentPiece.type;
  
  if (state.holdPiece === null) {
    // First hold - just store current piece
    state.holdPiece = currentType;
    spawnNewPiece(state);
  } else {
    // Swap with held piece
    const heldType = state.holdPiece;
    state.holdPiece = currentType;
    
    // Spawn the held piece
    const spawnPos = getSpawnPosition();
    state.currentPiece = {
      type: heldType,
      rotation: 0,
      x: spawnPos.x,
      y: spawnPos.y,
    };
  }
  
  state.canHold = false; // Can only hold once per turn
  return true;
}

// ============================================================================
// Piece Spawning
// ============================================================================

/**
 * Spawn new piece from queue
 * @param state Game state
 * @returns True if spawn successful, false if game over
 */
export function spawnNewPiece(state: GameState): boolean {
  // Refill queue if needed
  if (state.nextPieces.length < 4) {
    state.nextPieces.push(...create7Bag());
  }
  
  const type = state.nextPieces.shift()!;
  const spawnPos = getSpawnPosition();
  
  state.currentPiece = {
    type,
    rotation: 0,
    x: spawnPos.x,
    y: spawnPos.y,
  };
  
  // Reset per-turn flags
  state.canHold = true;
  state.softDropCells = 0;
  state.hardDropCells = 0;
  
  // Check for game over (collision at spawn)
  if (checkCollision(state.board, state.currentPiece)) {
    state.gameOver = true;
    return false;
  }
  
  return true;
}

// ============================================================================
// Line Clear System
// ============================================================================

/**
 * Clear completed lines and update game state
 * @param board The game board
 * @param state Game state
 * @returns Number of lines cleared
 */
export function clearLines(board: Grid, state: GameState): number {
  let clearedLines = 0;
  
  // Check from bottom to top
  for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
    if (isLineComplete(board[y])) {
      // Remove complete line
      board.splice(y, 1);
      // Add new empty line at top
      const newRow = Array(BOARD_WIDTH).fill(0) as CellValue[];
      board.unshift(newRow);
      clearedLines++;
      y++; // Check same row again (shifted down)
    }
  }
  
  if (clearedLines > 0) {
    // Update score
    state.score += calculateLineClearScore(clearedLines, state.level);
    state.linesCleared += clearedLines;
    
    // Level up every 10 lines
    const newLevel = Math.floor(state.linesCleared / 10) + 1;
    if (newLevel > state.level) {
      state.level = newLevel;
      state.dropInterval = calculateDropInterval(newLevel);
    }
  }
  
  return clearedLines;
}

/**
 * Check if a line is complete (all cells filled)
 * @param row Board row
 * @returns True if line complete
 */
export function isLineComplete(row: CellValue[]): boolean {
  return row.every(cell => cell !== 0);
}

// ============================================================================
// Board Locking
// ============================================================================

/**
 * Lock current piece to board
 * @param board The game board
 * @param state Game state
 */
export function lockPieceToBoard(board: Grid, state: GameState): void {
  if (!state.currentPiece) return;
  
  const piece = state.currentPiece;
  const shape = getPieceShape(piece);
  const colorValue = TETROMINOES[piece.type].color;
  
  // Map color to numeric value for board storage
  const colorMap: Record<string, number> = {
    '#00FFFF': 1, // I - Cyan
    '#FFFF00': 2, // O - Yellow
    '#0000FF': 3, // J - Blue
    '#FFA500': 4, // L - Orange
    '#00FF00': 5, // S - Green
    '#800080': 6, // T - Purple
    '#FF0000': 7, // Z - Red
  };
  
  const cellValue = colorMap[colorValue] || 1;
  
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] !== 0) {
        const boardY = piece.y + r;
        const boardX = piece.x + c;
        
        // Only lock if within visible board
        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
          board[boardY][boardX] = cellValue;
        }
      }
    }
  }
}

// ============================================================================
// Game Loop Integration
// ============================================================================

/**
 * Process one gravity tick (called by game loop)
 * @param board The game board
 * @param state Game state
 * @param currentTime Current timestamp
 * @returns True if piece was locked
 */
export function processGravityTick(
  board: Grid,
  state: GameState,
  currentTime: number
): boolean {
  if (!state.currentPiece || state.paused || state.gameOver) {
    return false;
  }
  
  // Check if it's time to drop
  const timeSinceLastDrop = currentTime - state.lastDropTime;
  const dropInterval = state.softDropActive
    ? Math.max(50, state.dropInterval / 10) // Faster during soft drop
    : state.dropInterval;
  
  if (timeSinceLastDrop >= dropInterval) {
    // Try to move down
    if (!moveDown(board, state)) {
      // Piece has landed
      lockPieceToBoard(board, state);
      
      // Add drop scores
      if (state.softDropCells > 0) {
        state.score += calculateSoftDropScore(state.softDropCells);
      }
      if (state.hardDropCells > 0) {
        state.score += calculateHardDropScore(state.hardDropCells);
      }
      
      // Clear lines
      clearLines(board, state);
      
      // Spawn new piece
      spawnNewPiece(state);
      
      return true; // Piece was locked
    }
    
    state.lastDropTime = currentTime;
  }
  
  return false;
}

/**
 * Start soft drop
 * @param state Game state
 */
export function startSoftDrop(state: GameState): void {
  state.softDropActive = true;
  state.softDropCells = 0;
}

/**
 * Stop soft drop
 * @param state Game state
 */
export function stopSoftDrop(state: GameState): void {
  state.softDropActive = false;
}

// ============================================================================
// Game Control Functions
// ============================================================================

/**
 * Toggle pause state
 * @param state Game state
 */
export function togglePause(state: GameState): void {
  if (!state.gameOver) {
    state.paused = !state.paused;
  }
}

/**
 * Reset game to initial state
 * @returns Fresh game state
 */
export function resetGame(): GameState {
  return createInitialState();
}

// ============================================================================
// Serialization for Save/Load
// ============================================================================

/**
 * Serialize game state for storage
 * @param state Game state
 * @returns JSON string
 */
export function serializeGameState(state: GameState): string {
  return JSON.stringify(state);
}

/**
 * Deserialize game state from storage
 * @param data JSON string
 * @returns Game state
 */
export function deserializeGameState(data: string): GameState {
  return JSON.parse(data);
}

/**
 * Save game state to localStorage
 * @param state Game state
 */
export function saveGameToStorage(state: GameState): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('tetris_save', serializeGameState(state));
  }
}

/**
 * Load game state from localStorage
 * @returns Game state or null if no save exists
 */
export function loadGameFromStorage(): GameState | null {
  if (typeof localStorage !== 'undefined') {
    const data = localStorage.getItem('tetris_save');
    if (data) {
      return deserializeGameState(data);
    }
  }
  return null;
}

/**
 * Delete saved game from localStorage
 */
export function deleteSaveFromStorage(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('tetris_save');
  }
}

// ============================================================================
// High Score Management
// ============================================================================

export interface HighScoreEntry {
  name: string;
  score: number;
  level: number;
  linesCleared: number;
  date: string;
}

const HIGH_SCORE_KEY = 'tetris_high_scores';
const MAX_HIGH_SCORES = 10;

/**
 * Save high score to localStorage
 * @param name Player name
 * @param score Final score
 * @param level Final level
 * @param linesCleared Total lines cleared
 */
export function saveHighScore(
  name: string,
  score: number,
  level: number,
  linesCleared: number
): void {
  if (typeof localStorage === 'undefined') return;
  
  const entry: HighScoreEntry = {
    name,
    score,
    level,
    linesCleared,
    date: new Date().toISOString(),
  };
  
  const scores = getHighScores();
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  scores.splice(MAX_HIGH_SCORES); // Keep only top 10
  
  localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(scores));
}

/**
 * Get high scores from localStorage
 * @returns Array of high score entries
 */
export function getHighScores(): HighScoreEntry[] {
  if (typeof localStorage === 'undefined') {
    return [];
  }
  
  const data = localStorage.getItem(HIGH_SCORE_KEY);
  if (!data) return [];
  
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Check if score qualifies for high score board
 * @param score Score to check
 * @returns True if score is high enough
 */
export function isHighScore(score: number): boolean {
  const scores = getHighScores();
  if (scores.length < MAX_HIGH_SCORES) return true;
  return score > scores[scores.length - 1].score;
}
