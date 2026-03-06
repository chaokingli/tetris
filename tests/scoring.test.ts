import { describe, expect, test } from '@jest/globals';
import { calculateLineClearScore, calculateSoftDropScore, calculateHardDropScore } from '../src/lib/tetrisGame';

describe('Scoring System', () => {
  describe('calculateLineClearScore', () => {
    test('1 line cleared = 100 × level', () => {
      expect(calculateLineClearScore(1, 1)).toBe(100);
      expect(calculateLineClearScore(1, 2)).toBe(200);
      expect(calculateLineClearScore(1, 5)).toBe(500);
      expect(calculateLineClearScore(1, 10)).toBe(1000);
    });

    test('2 lines cleared = 300 × level', () => {
      expect(calculateLineClearScore(2, 1)).toBe(300);
      expect(calculateLineClearScore(2, 2)).toBe(600);
      expect(calculateLineClearScore(2, 5)).toBe(1500);
      expect(calculateLineClearScore(2, 10)).toBe(3000);
    });

    test('3 lines cleared = 500 × level', () => {
      expect(calculateLineClearScore(3, 1)).toBe(500);
      expect(calculateLineClearScore(3, 2)).toBe(1000);
      expect(calculateLineClearScore(3, 5)).toBe(2500);
      expect(calculateLineClearScore(3, 10)).toBe(5000);
    });

    test('4 lines cleared (Tetris) = 800 × level', () => {
      expect(calculateLineClearScore(4, 1)).toBe(800);
      expect(calculateLineClearScore(4, 2)).toBe(1600);
      expect(calculateLineClearScore(4, 5)).toBe(4000);
      expect(calculateLineClearScore(4, 10)).toBe(8000);
    });

    test('0 lines cleared = 0 points', () => {
      expect(calculateLineClearScore(0, 1)).toBe(0);
      expect(calculateLineClearScore(0, 5)).toBe(0);
    });

    test('invalid lines cleared (>4) = 0 points', () => {
      expect(calculateLineClearScore(5, 1)).toBe(0);
      expect(calculateLineClearScore(6, 2)).toBe(0);
    });
  });

  describe('calculateSoftDropScore', () => {
    test('soft drop = 1 point per cell', () => {
      expect(calculateSoftDropScore(0)).toBe(0);
      expect(calculateSoftDropScore(1)).toBe(1);
      expect(calculateSoftDropScore(5)).toBe(5);
      expect(calculateSoftDropScore(10)).toBe(10);
      expect(calculateSoftDropScore(20)).toBe(20);
    });
  });

  describe('calculateHardDropScore', () => {
    test('hard drop = 2 points per cell', () => {
      expect(calculateHardDropScore(0)).toBe(0);
      expect(calculateHardDropScore(1)).toBe(2);
      expect(calculateHardDropScore(5)).toBe(10);
      expect(calculateHardDropScore(10)).toBe(20);
      expect(calculateHardDropScore(20)).toBe(40);
    });
  });
});
