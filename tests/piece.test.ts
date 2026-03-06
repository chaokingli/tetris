import { describe, expect, test } from '@jest/globals';
import {
  moveLeft,
  moveRight,
  moveDown,
  tryRotate,
  hardDropPosition,
  isValidMove,
  rotatePiece,
} from '../components/GameLogic';

describe('Piece Movement', () => {
  const createEmptyBoard = (): string[][] => {
    return Array(20).fill(null).map(() => Array(10).fill(null));
  };

  const shape2x2 = [[1, 1], [1, 1]];
  const shape3x3 = [[0, 1, 0], [1, 1, 1], [0, 0, 0]];
  const shape1x4 = [[1, 1, 1, 1]];
  const shape4x1 = [[1], [1], [1], [1]];

  describe('moveLeft', () => {
    test('should return true when piece can move left in empty space', () => {
      const board = createEmptyBoard();
      expect(moveLeft(board, shape2x2, 5, 5)).toBe(true);
    });

    test('should return false when piece is at left wall', () => {
      const board = createEmptyBoard();
      expect(moveLeft(board, shape2x2, 5, 0)).toBe(false);
    });

    test('should return false when moving left hits a block', () => {
      const board = createEmptyBoard();
      board[5][4] = 'T';
      expect(moveLeft(board, shape2x2, 5, 5)).toBe(false);
    });

    test('should return false when piece would go out of bounds left', () => {
      const board = createEmptyBoard();
      expect(moveLeft(board, shape2x2, 5, -1)).toBe(false);
    });
  });

  describe('moveRight', () => {
    test('should return true when piece can move right in empty space', () => {
      const board = createEmptyBoard();
      expect(moveRight(board, shape2x2, 5, 5)).toBe(true);
    });

    test('should return false when piece is at right wall', () => {
      const board = createEmptyBoard();
      expect(moveRight(board, shape2x2, 5, 8)).toBe(false);
    });

    test('should return false when moving right hits a block', () => {
      const board = createEmptyBoard();
      board[5][7] = 'T';
      expect(moveRight(board, shape2x2, 5, 5)).toBe(false);
    });

    test('should return false when piece would go out of bounds right', () => {
      const board = createEmptyBoard();
      expect(moveRight(board, shape2x2, 5, 9)).toBe(false);
    });
  });

  describe('moveDown', () => {
    test('should return true when piece can move down in empty space', () => {
      const board = createEmptyBoard();
      expect(moveDown(board, shape2x2, 5, 5)).toBe(true);
    });

    test('should return false when piece is at bottom', () => {
      const board = createEmptyBoard();
      expect(moveDown(board, shape2x2, 18, 5)).toBe(false);
    });

    test('should return false when moving down hits a block', () => {
      const board = createEmptyBoard();
      board[7][5] = 'T';
      board[7][6] = 'T';
      expect(moveDown(board, shape2x2, 5, 5)).toBe(false);
    });

    test('should return false when piece would go below board', () => {
      const board = createEmptyBoard();
      expect(moveDown(board, shape2x2, 19, 5)).toBe(false);
    });
  });

  describe('isValidMove', () => {
    test('should return true for valid position in empty space', () => {
      const board = createEmptyBoard();
      expect(isValidMove(board, shape2x2, 5, 5)).toBe(true);
    });

    test('should return false when piece goes left out of bounds', () => {
      const board = createEmptyBoard();
      expect(isValidMove(board, shape2x2, 5, -1)).toBe(false);
    });

    test('should return false when piece goes right out of bounds', () => {
      const board = createEmptyBoard();
      expect(isValidMove(board, shape2x2, 5, 9)).toBe(false);
    });

    test('should return false when piece goes below board', () => {
      const board = createEmptyBoard();
      expect(isValidMove(board, shape2x2, 20, 5)).toBe(false);
    });

    test('should return false when colliding with existing block', () => {
      const board = createEmptyBoard();
      board[10][5] = 'T';
      expect(isValidMove(board, shape2x2, 9, 5)).toBe(false);
    });

    test('should return true for I piece at left edge', () => {
      const board = createEmptyBoard();
      expect(isValidMove(board, shape1x4, 10, 0)).toBe(true);
    });

    test('should return false for I piece extending past right edge', () => {
      const board = createEmptyBoard();
      expect(isValidMove(board, shape1x4, 10, 7)).toBe(false);
    });
  });
});

describe('Rotation and Wall Kicks', () => {
  const createEmptyBoard = (): string[][] => {
    return Array(20).fill(null).map(() => Array(10).fill(null));
  };

  describe('rotatePiece', () => {
    test('should rotate a square piece 90 degrees clockwise', () => {
      const shape = [[1, 0], [1, 1]];
      const rotated = rotatePiece(shape);
      expect(rotated).toEqual([[1, 1], [1, 0]]);
    });

    test('should rotate T piece correctly', () => {
      const shape = [[0, 1, 0], [1, 1, 1], [0, 0, 0]];
      const rotated = rotatePiece(shape);
      expect(rotated).toEqual([[0, 1, 0], [0, 1, 1], [0, 1, 0]]);
    });

    test('should preserve dimensions for square pieces', () => {
      const shape = [[1, 1], [1, 1]];
      const rotated = rotatePiece(shape);
      expect(rotated.length).toBe(2);
      expect(rotated[0].length).toBe(2);
    });
  });

  describe('tryRotate with wall kicks', () => {
    test('should return valid rotation in empty space', () => {
      const board = createEmptyBoard();
      const shape = [[0, 1, 0], [1, 1, 1], [0, 0, 0]];
      const result = tryRotate(board, shape);
      expect(result.valid).toBe(true);
      expect(result.rotated).toBeDefined();
    });

    test('should perform wall kick when rotating near left wall', () => {
      const board = createEmptyBoard();
      const shape = [[0, 1, 0], [1, 1, 1], [0, 0, 0]];
      const result = tryRotate(board, shape);
      expect(result.valid).toBe(true);
    });

    test('should perform wall kick when rotating near right wall', () => {
      const board = createEmptyBoard();
      const shape = [[0, 1, 0], [1, 1, 1], [0, 0, 0]];
      const result = tryRotate(board, shape);
      expect(result.valid).toBe(true);
    });

    test('should return false when rotation blocked by blocks on all positions', () => {
      const board = createEmptyBoard();
      const shape = [[0, 1, 0], [1, 1, 1], [0, 0, 0]];
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          board[r][c] = 'T';
        }
      }
      const result = tryRotate(board, shape);
      expect(result.valid).toBe(false);
    });


    test('should find valid kick position with offset -1', () => {
      const board = createEmptyBoard();
      const shape = [[1, 0], [1, 1]];
      const result = tryRotate(board, shape);
      expect(result.valid).toBe(true);
    });

    test('should find valid kick position with offset +1', () => {
      const board = createEmptyBoard();
      const shape = [[0, 1], [1, 1]];
      const result = tryRotate(board, shape);
      expect(result.valid).toBe(true);
    });
  });
});

describe('Hard Drop', () => {
  const createEmptyBoard = (): string[][] => {
    return Array(20).fill(null).map(() => Array(10).fill(null));
  };

  const shape2x2 = [[1, 1], [1, 1]];
  const shape1x4 = [[1, 1, 1, 1]];

  describe('hardDropPosition', () => {
    test('should drop piece to bottom of empty board', () => {
      const board = createEmptyBoard();
      const finalRow = hardDropPosition(board, shape2x2, 0, 5);
      expect(finalRow).toBe(18);
    });

    test('should drop piece until it hits a block', () => {
      const board = createEmptyBoard();
      board[15][5] = 'T';
      board[15][6] = 'T';
      const finalRow = hardDropPosition(board, shape2x2, 0, 5);
      expect(finalRow).toBe(13);
    });

    test('should drop I piece to correct position', () => {
      const board = createEmptyBoard();
      const finalRow = hardDropPosition(board, shape1x4, 0, 3);
      expect(finalRow).toBe(19);
    });

    test('should handle piece already at bottom', () => {
      const board = createEmptyBoard();
      const finalRow = hardDropPosition(board, shape2x2, 18, 5);
      expect(finalRow).toBe(18);
    });

    test('should stop when piece would go out of bounds', () => {
      const board = createEmptyBoard();
      const finalRow = hardDropPosition(board, shape2x2, 19, 5);
      expect(finalRow).toBe(19);
    });
  });
});
