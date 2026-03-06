// Tetromino types
export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

// GameState interface for the tetris game
export interface GameState {
  board: string[][];
  currentPiece: { type: TetrominoType; shape: number[][]; row: number; col: number } | null;
  nextPiece: TetrominoType;
  score: number;
  level: number;
  linesCleared: number;
  piecesCleared: number;
  gameOver: boolean;
  isPaused: boolean;
  playerName: string;
}

// GameStats for saving game information
export interface GameStats {
  playerName: string;
  finalScore: number;
  finalLevel: number;
  totalPieces: number;
  totalLines: number;
}
