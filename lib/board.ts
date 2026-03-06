// Board management and collision detection for Tetris
// 10x20 grid (row-major 2D array)

export type CellValue = number; // Color index, or 0 for empty
export type Grid = CellValue[][];

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const BOARD_BORDER_HEIGHT = 2; // Extra rows at top (hidden area)

// Initial board state - all zeros (empty cells)
export function createEmptyBoard(): Grid {
  return Array.from({ length: BOARD_HEIGHT + BOARD_BORDER_HEIGHT }, () => 
    Array(BOARD_WIDTH).fill(0) as CellValue[]
  );
}

// Create a deep copy of the board
export function cloneBoard(board: Grid): Grid {
  return board.map(row => [...row]);
}

// Check if a position on the board is within bounds
export function isInBounds(x: number, y: number): boolean {
  return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT + BOARD_BORDER_HEIGHT;
}

// Check if a cell contains a block (non-zero value)
export function hasBlock(board: Grid, x: number, y: number): boolean {
  return isInBounds(x, y) && board[y][x] !== 0;
}

// Check collision between piece and board (static obstacles)
// Returns true if there's a collision at the given position
export function hasCollision(
  board: Grid,
  shape: number[][],
  posX: number,
  posY: number
): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] !== 0) {
        const newX = posX + c;
        const newY = posY + r;
        
        // Check if out of bounds or colliding with existing blocks
        if (!isInBounds(newX, newY)) {
          return true;
        }
        
        if (board[newY][newX] !== 0) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// Calculate the lowest Y position where the piece can land
export function getDropPosition(
  board: Grid,
  shape: number[][],
  posX: number,
  posY: number
): { y: number; collisionRow?: number } {
  let currentY = posY;
  
  while (!hasCollision(board, shape, posX, currentY + 1)) {
    currentY++;
    
    // Safety limit to prevent infinite loop
    if (currentY > BOARD_HEIGHT * 2) {
      return { y: currentY, collisionRow: -1 };
    }
  }
  
  return { y: currentY };
}

// Check if a piece has landed at the given position
export function isLanded(
  board: Grid,
  shape: number[][],
  posX: number,
  posY: number
): boolean {
  // Check if moving down by one would cause collision
  return hasCollision(board, shape, posX, posY + 1);
}

// Clear completed lines and return cleared line count
export function clearLines(board: Grid): { board: Grid; clearedLines: number } {
  const newBoard = cloneBoard(board);
  let clearedLines = 0;
  
  // Remove complete lines (all non-zero cells)
  for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
    if (isLineComplete(newBoard[y])) {
      // Remove the line and add new empty one at top
      newBoard.splice(y, 1);
      const newRow = Array(BOARD_WIDTH).fill(0) as CellValue[];
      newBoard.unshift(newRow);
      clearedLines++;
      
      // Check same row again (lines above will shift down)
      y++;
    }
  }
  
  return { board: newBoard, clearedLines };
}

// Check if a line is complete (all cells non-zero)
export function isLineComplete(row: CellValue[]): boolean {
  return row.every(cell => cell !== 0);
}

// Calculate ghost piece position (where piece will land)
export function getGhostPosition(
  board: Grid,
  shape: number[][],
  posX: number,
  initialY: number
): number {
  let currentY = initialY;
  
  while (!hasCollision(board, shape, posX, currentY + 1)) {
    currentY++;
    
    // Safety limit
    if (currentY > BOARD_HEIGHT * 2) {
      return currentY;
    }
  }
  
  return currentY;
}

// Get the bottom-most occupied cell in a column (for stacking visualization)
export function getBottomCell(board: Grid, x: number): number {
  for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
    if (board[y][x] !== 0) {
      return y;
    }
  }
  return -1; // No blocks in this column
}

// Check if the game is over (piece collides at spawn position)
export function isGameOver(board: Grid): boolean {
  const shape = [[1, 1], [1, 1]]; // Simplified check using O piece
  const spawnX = Math.floor(BOARD_WIDTH / 2) - 1;
  const spawnY = BOARD_BORDER_HEIGHT;
  
  return hasCollision(board, shape, spawnX, spawnY);
}

// Get valid positions for hard drop (all possible landing positions in one column)
export function getHardDropPositions(
  board: Grid,
  shape: number[][],
  posX: number
): number[] {
  const positions: number[] = [];
  
  // Check each row from top to bottom
  for (let y = BOARD_BORDER_HEIGHT; y < BOARD_HEIGHT + BOARD_BORDER_HEIGHT; y++) {
    if (!hasCollision(board, shape, posX, y)) {
      // This position is valid, check if it's the lowest
      const nextY = y + 1;
      if (nextY >= BOARD_HEIGHT + BOARD_BORDER_HEIGHT || hasCollision(board, shape, posX, nextY)) {
        positions.push(y);
        break;
      } else {
        // Continue checking lower rows
      }
    }
  }
  
  return positions;
}
