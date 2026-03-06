'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  createInitialState,
  processGravityTick,
  moveLeft,
  moveRight,
  moveDown,
  hardDrop,
  rotatePiece,
  holdCurrentPiece,
  togglePause,
  resetGame,
  getLandingY,
  getPieceShape,
  GameState,
} from '@/src/lib/tetrisGame';
import { TETROMINOES, TetrominoType } from '@/src/lib/tetrominos';

const CELL_SIZE = 30;
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CANVAS_WIDTH = BOARD_WIDTH * CELL_SIZE;
const CANVAS_HEIGHT = BOARD_HEIGHT * CELL_SIZE;

const TETROMINO_COLORS: Record<TetrominoType, string> = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000',
};

export default function CanvasBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>(createInitialState());
  const requestRef = useRef<number>(0);
  const [_, forceUpdate] = useState(0);

  const drawCell = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, color: string, alpha: number = 1) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    
    // Draw border
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    
    // Inner highlight for 3D effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x * CELL_SIZE + 2, y * CELL_SIZE + 2, CELL_SIZE - 4, 4);
    
    ctx.globalAlpha = 1;
  }, []);

  const drawBoard = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    ctx.strokeStyle = '#2a2a3e';
    ctx.lineWidth = 1;
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(CANVAS_WIDTH, y * CELL_SIZE);
      ctx.stroke();
    }

    // Draw locked pieces
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const cellValue = state.board[y][x];
        if (cellValue !== 0) {
          const colors = Object.values(TETROMINO_COLORS);
          const colorIndex = ((cellValue - 1) % colors.length);
          drawCell(ctx, x, y, colors[colorIndex]);
        }
      }
    }

    // Draw current piece
    if (state.currentPiece) {
      const shape = getPieceShape(state.currentPiece);
      const color = TETROMINO_COLORS[state.currentPiece.type];

      // Draw ghost piece first
      const landingY = getLandingY(state.board, state.currentPiece);
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c] !== 0) {
            const boardX = state.currentPiece.x + c;
            const boardY = landingY + r;
            if (boardY >= 0) {
              drawCell(ctx, boardX, boardY, color, 0.5);
            }
          }
        }
      }

      // Draw actual piece
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c] !== 0) {
            const boardX = state.currentPiece.x + c;
            const boardY = state.currentPiece.y + r;
            if (boardY >= 0) {
              drawCell(ctx, boardX, boardY, color);
            }
          }
        }
      }
    }
  }, [drawCell]);

  const drawUI = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    const rightPanelX = CANVAS_WIDTH + 20;
    
    // Draw hold piece
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText('HOLD', rightPanelX, 20);
    
    if (state.holdPiece) {
      const holdShape = TETROMINOES[state.holdPiece].rotations[0];
      const holdColor = TETROMINO_COLORS[state.holdPiece];
      const previewSize = 15;
      const holdOffsetX = rightPanelX + 20;
      const holdOffsetY = 30;
      
      for (let r = 0; r < holdShape.length; r++) {
        for (let c = 0; c < holdShape[r].length; c++) {
          if (holdShape[r][c] !== 0) {
            ctx.fillStyle = holdColor;
            ctx.fillRect(
              holdOffsetX + c * previewSize,
              holdOffsetY + r * previewSize,
              previewSize,
              previewSize
            );
            ctx.strokeStyle = holdColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(
              holdOffsetX + c * previewSize,
              holdOffsetY + r * previewSize,
              previewSize,
              previewSize
            );
          }
        }
      }
    }

    // Draw next pieces
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText('NEXT', rightPanelX, 120);
    
    let nextY = 140;
    for (let i = 0; i < state.nextPieces.length; i++) {
      const nextShape = TETROMINOES[state.nextPieces[i]].rotations[0];
      const nextColor = TETROMINO_COLORS[state.nextPieces[i]];
      const previewSize = 12;
      const nextOffsetX = rightPanelX + 10;
      
      for (let r = 0; r < nextShape.length; r++) {
        for (let c = 0; c < nextShape[r].length; c++) {
          if (nextShape[r][c] !== 0) {
            ctx.fillStyle = nextColor;
            ctx.fillRect(
              nextOffsetX + c * previewSize,
              nextY + r * previewSize,
              previewSize,
              previewSize
            );
            ctx.strokeStyle = nextColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(
              nextOffsetX + c * previewSize,
              nextY + r * previewSize,
              previewSize,
              previewSize
            );
          }
        }
      }
      nextY += 50;
    }

    // Draw score
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('SCORE', rightPanelX, 280);
    ctx.font = '14px Arial';
    ctx.fillText(state.score.toString(), rightPanelX, 300);

    // Draw level
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('LEVEL', rightPanelX, 340);
    ctx.font = '14px Arial';
    ctx.fillText(state.level.toString(), rightPanelX, 360);

    // Draw lines
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('LINES', rightPanelX, 400);
    ctx.font = '14px Arial';
    ctx.fillText(state.linesCleared.toString(), rightPanelX, 420);
  }, []);

  const drawPauseOverlay = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.font = '16px Arial';
    ctx.fillText('Press P to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    ctx.textAlign = 'left';
  }, []);

  const drawGameOver = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Arial';
    ctx.fillText(`Score: ${state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    ctx.fillText(`Level: ${state.level}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 45);
    ctx.font = '14px Arial';
    ctx.fillText('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
    ctx.textAlign = 'left';
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameStateRef.current;
    
    drawBoard(ctx, state);
    drawUI(ctx, state);
    
    if (state.paused) {
      drawPauseOverlay(ctx);
    }
    
    if (state.gameOver) {
      drawGameOver(ctx, state);
    }
  }, [drawBoard, drawUI, drawPauseOverlay, drawGameOver]);

  const gameLoop = useCallback((time: number) => {
    const state = gameStateRef.current;
    
    if (!state.paused && !state.gameOver) {
      processGravityTick(state.board, state, time);
    }
    
    draw();
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameLoop]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const state = gameStateRef.current;
    
    if (state.gameOver) {
      if (e.key.toLowerCase() === 'r') {
        gameStateRef.current = resetGame();
        forceUpdate(n => n + 1);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowLeft':
        moveLeft(state.board, state);
        break;
      case 'ArrowRight':
        moveRight(state.board, state);
        break;
      case 'ArrowDown':
        moveDown(state.board, state);
        break;
      case 'ArrowUp':
        rotatePiece(state.board, state, true);
        break;
      case ' ':
        hardDrop(state.board, state);
        break;
      case 'c':
      case 'C':
        holdCurrentPiece(state);
        break;
      case 'p':
      case 'P':
        togglePause(state);
        break;
      case 'r':
      case 'R':
        gameStateRef.current = resetGame();
        break;
    }
    
    forceUpdate(n => n + 1);
    e.preventDefault();
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex gap-4 p-4 bg-gray-900">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-4 border-gray-700 rounded"
        style={{ display: 'block' }}
      />
      <div className="w-40">
        <div className="text-white text-sm mb-2">
          <p className="mb-1"><strong>HOLD</strong> (C)</p>
          <p className="mb-1"><strong>NEXT</strong></p>
          <p className="mb-1"><strong>SCORE</strong></p>
          <p className="mb-1"><strong>LEVEL</strong></p>
          <p className="mb-1"><strong>LINES</strong></p>
        </div>
        <div className="text-gray-400 text-xs mt-4">
          <p className="mb-1">← → Move</p>
          <p className="mb-1">↑ Rotate</p>
          <p className="mb-1">↓ Soft Drop</p>
          <p className="mb-1">Space Hard Drop</p>
          <p className="mb-1">C Hold</p>
          <p className="mb-1">P Pause</p>
          <p>R Restart</p>
        </div>
      </div>
    </div>
  );
}
