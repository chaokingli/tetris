import { describe, expect, test } from '@jest/globals';
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  BOARD_BORDER_HEIGHT,
  createEmptyBoard,
  cloneBoard,
  isInBounds,
  hasBlock,
  hasCollision,
  isLineComplete,
  clearLines,
} from '../src/lib/board';

describe('Board Operations', () => {
  describe('BOARD_WIDTH, BOARD_HEIGHT, BOARD_BORDER_HEIGHT constants', () => {
    test('BOARD_WIDTH should be 10', () => {
      expect(BOARD_WIDTH).toBe(10);
    });

    test('BOARD_HEIGHT should be 20', () => {
      expect(BOARD_HEIGHT).toBe(20);
    });

    test('BOARD_BORDER_HEIGHT should be 2', () => {
      expect(BOARD_BORDER_HEIGHT).toBe(2);
    });
  });

  describe('createEmptyBoard', () => {
    test('should create a 22x10 grid (20 + 2 border rows)', () => {
      const board = createEmptyBoard();
      expect(board.length).toBe(BOARD_HEIGHT + BOARD_BORDER_HEIGHT); // 22 rows
      expect(board[0].length).toBe(BOARD_WIDTH); // 10 columns
    });

    test('should fill all cells with 0 (empty)', () => {
      const board = createEmptyBoard();
      for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
          expect(board[y][x]).toBe(0);
        }
      }
    });

    test('should create independent rows (not shared references)', () => {
      const board = createEmptyBoard();
      board[0][0] = 1;
      expect(board[1][0]).toBe(0);
      expect(board[10][0]).toBe(0);
    });
  });

  describe('cloneBoard', () => {
    test('should create a deep copy of the board', () => {
      const original = createEmptyBoard();
      original[5][3] = 1;
      const cloned = cloneBoard(original);
      
      expect(cloned[5][3]).toBe(1);
      original[5][3] = 2;
      expect(cloned[5][3]).toBe(1); // Should not change
    });

    test('should preserve all board dimensions', () => {
      const original = createEmptyBoard();
      const cloned = cloneBoard(original);
      
      expect(cloned.length).toBe(original.length);
      expect(cloned[0].length).toBe(original[0].length);
    });
  });

  describe('isInBounds', () => {
    test('should return true for valid positions within playable area', () => {
      expect(isInBounds(0, 0)).toBe(true);
      expect(isInBounds(9, 0)).toBe(true);
      expect(isInBounds(0, 21)).toBe(true);
      expect(isInBounds(9, 21)).toBe(true);
    });

    test('should return false for x < 0', () => {
      expect(isInBounds(-1, 10)).toBe(false);
      expect(isInBounds(-5, 10)).toBe(false);
    });

    test('should return false for x >= BOARD_WIDTH', () => {
      expect(isInBounds(10, 10)).toBe(false);
      expect(isInBounds(15, 10)).toBe(false);
    });

    test('should return false for y < 0', () => {
      expect(isInBounds(5, -1)).toBe(false);
      expect(isInBounds(5, -10)).toBe(false);
    });

    test('should return false for y >= BOARD_HEIGHT + BOARD_BORDER_HEIGHT', () => {
      expect(isInBounds(5, 22)).toBe(false);
      expect(isInBounds(5, 30)).toBe(false);
    });

    test('should handle corner cases', () => {
      // Top-left corner
      expect(isInBounds(0, 0)).toBe(true);
      // Top-right corner
      expect(isInBounds(9, 0)).toBe(true);
      // Bottom-left corner
      expect(isInBounds(0, 21)).toBe(true);
      // Bottom-right corner
      expect(isInBounds(9, 21)).toBe(true);
    });
  });

  describe('hasBlock', () => {
    test('should return false for empty board', () => {
      const board = createEmptyBoard();
      expect(hasBlock(board, 5, 10)).toBe(false);
      expect(hasBlock(board, 0, 0)).toBe(false);
      expect(hasBlock(board, 9, 21)).toBe(false);
    });

    test('should return true for cells with blocks', () => {
      const board = createEmptyBoard();
      board[10][5] = 1;
      board[15][3] = 2;
      board[20][9] = 3;
      
      expect(hasBlock(board, 5, 10)).toBe(true);
      expect(hasBlock(board, 3, 15)).toBe(true);
      expect(hasBlock(board, 9, 20)).toBe(true);
    });

    test('should return false for out of bounds positions', () => {
      const board = createEmptyBoard();
      board[10][5] = 1;
      
      expect(hasBlock(board, -1, 10)).toBe(false);
      expect(hasBlock(board, 10, 10)).toBe(false);
      expect(hasBlock(board, 5, -1)).toBe(false);
      expect(hasBlock(board, 5, 22)).toBe(false);
    });
  });

  describe('hasCollision', () => {
    const shape2x2 = [[1, 1], [1, 1]];
    const shape1x4 = [[1, 1, 1, 1]];
    const shape4x1 = [[1], [1], [1], [1]];

    test('should return false for piece completely in empty space', () => {
      const board = createEmptyBoard();
      expect(hasCollision(board, shape2x2, 4, 10)).toBe(false);
    });

    test('should return true when piece goes out of bounds (left)', () => {
      const board = createEmptyBoard();
      expect(hasCollision(board, shape2x2, -1, 10)).toBe(true);
      expect(hasCollision(board, shape2x2, -2, 10)).toBe(true);
    });

    test('should return true when piece goes out of bounds (right)', () => {
      const board = createEmptyBoard();
      expect(hasCollision(board, shape2x2, 9, 10)).toBe(true); // Right edge at x=10
      expect(hasCollision(board, shape2x2, 10, 10)).toBe(true);
    });

    test('should return true when piece goes below board', () => {
      const board = createEmptyBoard();
      expect(hasCollision(board, shape2x2, 4, 21)).toBe(true); // Bottom at y=22
    });

    test('should return true when colliding with existing blocks', () => {
      const board = createEmptyBoard();
      board[10][5] = 1; // Place a block
      
      // Piece would overlap with the block
      expect(hasCollision(board, shape2x2, 4, 9)).toBe(true);
    });

    test('should return false when piece is adjacent to block but not overlapping', () => {
      const board = createEmptyBoard();
      board[10][5] = 1;
      
      expect(hasCollision(board, shape2x2, 2, 9)).toBe(false);
      expect(hasCollision(board, shape2x2, 6, 9)).toBe(false);
    });

    test('should handle I piece (1x4) correctly', () => {
      const board = createEmptyBoard();
      
      // Horizontal I piece (1x4 spans columns x, x+1, x+2, x+3)
      expect(hasCollision(board, shape1x4, 0, 10)).toBe(false); // At left edge: cols 0-3
      expect(hasCollision(board, shape1x4, 7, 10)).toBe(true); // Would span cols 7-10 (col 10 out of bounds)
      
      // Vertical I piece
      expect(hasCollision(board, shape4x1, 4, 10)).toBe(false);
      expect(hasCollision(board, shape4x1, 4, 19)).toBe(true); // Would go to y=22
    });

    test('should handle pieces with holes (zeros in shape)', () => {
      const shapeWithHole = [
        [1, 0, 1],
        [1, 1, 1],
      ];
      const board = createEmptyBoard();
      board[10][5] = 1; // Block at (x=5, y=10)
      
      // Piece at x=4, y=9 occupies: (4,9), (6,9), (4,10), (5,10), (6,10)
      // Hole at (5,9) won't collide, but pieces at row 10 will
      expect(hasCollision(board, shapeWithHole, 4, 9)).toBe(true);
      
      // Test where hole avoids the block completely
      const board2 = createEmptyBoard();
      board2[9][5] = 1; // Block at hole position (5,9)
      // shapeWithHole at x=4, y=8: hole at (5,8) avoids block at (5,9)
      expect(hasCollision(board2, shapeWithHole, 4, 8)).toBe(true); // Still collides at (4,9), (6,9)
    });
  });

  describe('isLineComplete', () => {
    test('should return true for a row with all non-zero values', () => {
      const fullRow = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      expect(isLineComplete(fullRow)).toBe(true);
    });

    test('should return true for a row with all same non-zero values', () => {
      const fullRow = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
      expect(isLineComplete(fullRow)).toBe(true);
    });

    test('should return false for a row with any zeros', () => {
      const rowWithGap = [1, 1, 1, 0, 1, 1, 1, 1, 1, 1];
      expect(isLineComplete(rowWithGap)).toBe(false);
    });

    test('should return false for empty row', () => {
      const emptyRow = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      expect(isLineComplete(emptyRow)).toBe(false);
    });

    test('should return false for completely empty row', () => {
      const emptyRow = Array(10).fill(0);
      expect(isLineComplete(emptyRow)).toBe(false);
    });
  });

  describe('clearLines', () => {
    test('should return 0 cleared lines for empty board', () => {
      const board = createEmptyBoard();
      const result = clearLines(board);
      
      expect(result.clearedLines).toBe(0);
      expect(result.board.length).toBe(BOARD_HEIGHT + BOARD_BORDER_HEIGHT);
    });

    test('should clear a single complete line', () => {
      const board = createEmptyBoard();
      // Fill row 19 (second from bottom of playable area)
      for (let x = 0; x < BOARD_WIDTH; x++) {
        board[19][x] = 1;
      }
      
      const result = clearLines(board);
      
      expect(result.clearedLines).toBe(1);
      expect(result.board[19].every(cell => cell === 0)).toBe(true); // Row 19 should now be empty
    });

    test('should clear multiple complete lines', () => {
      const board = createEmptyBoard();
      // Fill rows 18, 19, 20
      for (let y = 18; y <= 20; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          board[y][x] = 1;
        }
      }
      
      const result = clearLines(board);
      
      expect(result.clearedLines).toBe(2); // Only rows 18,19 clear (row 20 is border)
    });

    test('should clear a Tetris (4 lines)', () => {
      const board = createEmptyBoard();
      // Fill rows 16, 17, 18, 19 (all within playable area 0-19)
      for (let y = 16; y <= 19; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          board[y][x] = 1;
        }
      }
      
      const result = clearLines(board);
      
      expect(result.clearedLines).toBe(4);
    });

    test('should only clear complete lines, leaving incomplete lines', () => {
      const board = createEmptyBoard();
      // Fill row 19 completely
      for (let x = 0; x < BOARD_WIDTH; x++) {
        board[19][x] = 1;
      }
      // Row 18 has a gap
      board[18][5] = 0;
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (x !== 5) board[18][x] = 1;
      }
      
      const result = clearLines(board);
      
      expect(result.clearedLines).toBe(1);
    });

    test('should preserve board dimensions after clearing lines', () => {
      const board = createEmptyBoard();
      for (let x = 0; x < BOARD_WIDTH; x++) {
        board[20][x] = 1;
      }
      
      const result = clearLines(board);
      
      expect(result.board.length).toBe(BOARD_HEIGHT + BOARD_BORDER_HEIGHT);
      expect(result.board[0].length).toBe(BOARD_WIDTH);
    });

    test('should add new empty rows at top when clearing', () => {
      const board = createEmptyBoard();
      // Fill bottom row
      for (let x = 0; x < BOARD_WIDTH; x++) {
        board[21][x] = 1;
      }
      
      const result = clearLines(board);
      
      // Top row should be empty (newly added)
      expect(result.board[0].every(cell => cell === 0)).toBe(true);
    });
  });
});
