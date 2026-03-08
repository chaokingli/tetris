'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameBoard } from './GameBoard';
import { PreviewPiece } from './PreviewPiece';
import { TouchControls } from './TouchControls';
import { GameState, getInitialGameState, movePiece, rotateCurrentPiece, hardDrop, holdPiece } from './GameLogic';
import { getRandomTetromino } from '@/lib/tetrominos';
import { useVibration } from '@/hooks/useVibration';

const PLAYER_NAME = 'Player';

export function TetrisGame() {
  const [gameState, setGameState] = useState<GameState>(() => getInitialGameState(PLAYER_NAME));
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const isGameStarted = useRef(false);
  const [showTouchControls, setShowTouchControls] = useState(true);
  const { vibrate } = useVibration({ enabled: true });

  // Check if device is mobile/tablet
  const isMobile = useRef(false);
  useEffect(() => {
    const checkMobile = () => {
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      isMobile.current = mobileRegex.test(navigator.userAgent) ||
        (navigator.maxTouchPoints > 2);
      setShowTouchControls(isMobile.current);
    };
    checkMobile();
  }, []);

  // Keyboard controls
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isGameStarted.current) return;

    switch (e.key) {
      case 'ArrowLeft':
        setGameState(prev => movePiece(prev, 'left'));
        vibrate(5);
        break;
      case 'ArrowRight':
        setGameState(prev => movePiece(prev, 'right'));
        vibrate(5);
        break;
      case 'ArrowDown':
        setGameState(prev => movePiece(prev, 'down'));
        vibrate(5);
        break;
      case 'ArrowUp':
        setGameState(prev => rotateCurrentPiece(prev));
        vibrate(10);
        break;
      case ' ':
        e.preventDefault();
        setGameState(prev => hardDrop(prev));
        vibrate(15);
        break;
      case 'p':
      case 'P':
        setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
        vibrate(10);
        break;
      case 'c':
      case 'C':
        setGameState(prev => holdPiece(prev));
        vibrate(10);
        break;
    }
  }, [vibrate]);

  // Start game
  const startGame = () => {
    isGameStarted.current = true;
    setGameState(getInitialGameState(PLAYER_NAME));
    vibrate(20);
  };

  // Keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Game loop for piece falling
  useEffect(() => {
    if (gameState.gameOver || gameState.isPaused || !isGameStarted.current) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    const dropSpeed = calculateDropSpeed(gameState.level);

    gameLoopRef.current = setInterval(() => {
      setGameState((prev: GameState) => {
        if (!prev.currentPiece || prev.gameOver) return prev;

        let newRow = prev.currentPiece.row + 1;
        // Check collision below
        const hasCollision = () => {
          for (let r = 0; r < prev.currentPiece!.shape.length; r++) {
            for (let c = 0; c < prev.currentPiece!.shape[r].length; c++) {
              if (prev.currentPiece!.shape[r][c] !== 0) {
                const boardRow = newRow + r;
                const boardCol = prev.currentPiece!.col + c;

                if (boardRow >= 20 || boardCol < 0 || boardCol >= 10 ||
                  (boardRow >= 0 && prev.board[boardRow][boardCol] !== null)) {
                  return true;
                }
              }
            }
          }
          return false;
        };

        if (hasCollision()) {
          // Lock the piece and check for game over
          const newBoard = prev.board.map(row => [...row]);

          for (let r = 0; r < prev.currentPiece!.shape.length; r++) {
            for (let c = 0; c < prev.currentPiece!.shape[r].length; c++) {
              if (prev.currentPiece!.shape[r][c] !== 0) {
                const boardRow = newRow + r;
                const boardCol = prev.currentPiece.col + c;

                if (boardRow >= 0 && boardRow < 20 && boardCol >= 0 && boardCol < 10) {
                  newBoard[boardRow][boardCol] = prev.currentPiece!.type;
                } else if (boardRow < 0) {
                  return { ...prev, gameOver: true };
                }
              }
            }
          }

          // Check for completed lines
          const clearedLines: number[] = [];
          for (let r = 19; r >= 0; r--) {
            if (newBoard[r].every(cell => cell !== null)) {
              clearedLines.push(r);
            }
          }

          let newScore = prev.score;
          let newLevel = prev.level;
          let newLinesCleared = prev.linesCleared;

          while (clearedLines.length > 0) {
            const lineIndex = clearedLines.pop()!;
            newBoard.splice(lineIndex, 1);
            newBoard.unshift(Array(10).fill(null));

            const linePoints = [100, 300, 500, 800][clearedLines.length];
            newScore += linePoints * prev.level;
            newLinesCleared++;

            if (Math.floor(newLinesCleared / 10) > Math.floor((newLinesCleared - 1) / 10)) {
              newLevel++;
            }
          }

          return {
            ...prev,
            board: newBoard,
            score: newScore,
            level: newLevel,
            linesCleared: newLinesCleared,
            piecesCleared: prev.piecesCleared + 1,
            currentPiece: spawnNextPiece(prev.nextPiece),
            nextPiece: getRandomTetromino(),
            canHold: true,
          };
        }

        return { ...prev, currentPiece: { type: prev.currentPiece.type, shape: prev.currentPiece.shape, row: newRow, col: prev.currentPiece.col } };
      });
    }, dropSpeed);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState.gameOver, gameState.isPaused, gameState.level]);

  const spawnNextPiece = (type: 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L') => {
    return { type, shape: getShape(type), row: 0, col: 4 };
  };

  const getShape = (type: 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'): number[][] => {
    switch (type) {
      case 'I': return [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]];
      case 'O': return [[1, 1], [1, 1]];
      case 'T': return [[0, 1, 0], [1, 1, 1], [0, 0, 0]];
      case 'S': return [[0, 1, 1], [1, 1, 0], [0, 0, 0]];
      case 'Z': return [[1, 1, 0], [0, 1, 1], [0, 0, 0]];
      case 'J': return [[0, 0, 1], [1, 1, 1], [0, 0, 0]];
      case 'L': return [[1, 0, 0], [1, 1, 1], [0, 0, 0]];
    }
    throw new Error(`Unknown piece type: ${type}`);
  };

  // Gesture control handlers for GameBoard
  const handleTap = useCallback(() => {
    if (!isGameStarted.current || gameState.gameOver || gameState.isPaused) return;
    setGameState(prev => rotateCurrentPiece(prev));
    vibrate(10);
  }, [gameState.gameOver, gameState.isPaused, vibrate]);

  const handleDoubleTap = useCallback(() => {
    if (!isGameStarted.current || gameState.gameOver || gameState.isPaused) return;
    setGameState(prev => hardDrop(prev));
    vibrate(15);
  }, [gameState.gameOver, gameState.isPaused, vibrate]);

  const handleSwipeLeft = useCallback(() => {
    if (!isGameStarted.current || gameState.gameOver || gameState.isPaused) return;
    setGameState(prev => movePiece(prev, 'left'));
    vibrate(5);
  }, [gameState.gameOver, gameState.isPaused, vibrate]);

  const handleSwipeRight = useCallback(() => {
    if (!isGameStarted.current || gameState.gameOver || gameState.isPaused) return;
    setGameState(prev => movePiece(prev, 'right'));
    vibrate(5);
  }, [gameState.gameOver, gameState.isPaused, vibrate]);

  const handleSwipeDown = useCallback(() => {
    if (!isGameStarted.current || gameState.gameOver || gameState.isPaused) return;
    setGameState(prev => movePiece(prev, 'down'));
    vibrate(5);
  }, [gameState.gameOver, gameState.isPaused, vibrate]);

  const handleTwoFingerTap = useCallback(() => {
    if (!isGameStarted.current || gameState.gameOver) return;
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
    vibrate(10);
  }, [gameState.gameOver, vibrate]);

  const handleLongPress = useCallback(() => {
    if (!isGameStarted.current || gameState.gameOver || gameState.isPaused) return;
    setGameState(prev => holdPiece(prev));
    vibrate(15);
  }, [gameState.gameOver, gameState.isPaused, vibrate]);

  // Virtual button handlers
  const handleVirtualLeft = useCallback(() => {
    if (!isGameStarted.current || gameState.gameOver || gameState.isPaused) return;
    setGameState(prev => movePiece(prev, 'left'));
  }, [gameState.gameOver, gameState.isPaused]);

  const handleVirtualRight = useCallback(() => {
    if (!isGameStarted.current || gameState.gameOver || gameState.isPaused) return;
    setGameState(prev => movePiece(prev, 'right'));
  }, [gameState.gameOver, gameState.isPaused]);

  const handleVirtualDown = useCallback(() => {
    if (!isGameStarted.current || gameState.gameOver || gameState.isPaused) return;
    setGameState(prev => movePiece(prev, 'down'));
  }, [gameState.gameOver, gameState.isPaused]);

  const handleVirtualRotate = useCallback(() => {
    if (!isGameStarted.current || gameState.gameOver || gameState.isPaused) return;
    setGameState(prev => rotateCurrentPiece(prev));
  }, [gameState.gameOver, gameState.isPaused]);

  const handleVirtualHardDrop = useCallback(() => {
    if (!isGameStarted.current || gameState.gameOver || gameState.isPaused) return;
    setGameState(prev => hardDrop(prev));
  }, [gameState.gameOver, gameState.isPaused]);

  const handleVirtualHold = useCallback(() => {
    if (!isGameStarted.current || gameState.gameOver || gameState.isPaused) return;
    setGameState(prev => holdPiece(prev));
  }, [gameState.gameOver, gameState.isPaused]);

  const handleVirtualPause = useCallback(() => {
    if (!isGameStarted.current || gameState.gameOver) return;
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, [gameState.gameOver]);

  // Save stats on game over
  useEffect(() => {
    if (gameState.gameOver) {
      saveGameStats(PLAYER_NAME, gameState.score, gameState.level, gameState.linesCleared);
    }
  }, [gameState.gameOver]);

  // Convert board for GameBoard component (string[][] to number[][])
  const getNumericBoard = useCallback(() => {
    const colorMap: Record<string, number> = {
      'I': 5, 'O': 3, 'T': 6, 'S': 4, 'Z': 1, 'J': 2, 'L': 7,
      'null': 0,
    };
    return gameState.board.map(row =>
      row.map(cell => cell === null ? 0 : colorMap[cell] || 0)
    );
  }, [gameState.board]);

  return (
    <div className="min-h-screen bg-[#0a0a10] text-white flex flex-col items-center justify-center p-4 font-sans">
      <h1 className="text-4xl md:text-5xl font-bold mb-4 text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]">
        TETRIS
      </h1>

      {!isGameStarted.current && (
        <button
          onClick={startGame}
          className="px-10 py-4 text-xl bg-green-500 hover:bg-green-400 text-black font-bold rounded-lg shadow-lg transform transition active:scale-95"
        >
          Start Game
        </button>
      )}

      {isGameStarted.current && (
        <div className="relative flex flex-col md:flex-row gap-4 items-center">
          {/* Game Board with gesture support */}
          <GameBoard
            board={getNumericBoard()}
            currentPiece={gameState.currentPiece ? {
              type: gameState.currentPiece.type,
              x: gameState.currentPiece.col,
              y: gameState.currentPiece.row,
              rotation: 0,
            } : undefined}
            onTap={handleTap}
            onDoubleTap={handleDoubleTap}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onSwipeDown={handleSwipeDown}
            onTwoFingerTap={handleTwoFingerTap}
            onLongPress={handleLongPress}
          />

          {/* Side panel */}
          <div className="bg-[#1a1a2e] p-4 rounded-lg min-w-[180px] shadow-xl">
            <h3 className="text-sm font-bold mb-2 text-gray-300">Next:</h3>
            <div className="mb-4"><PreviewPiece type={gameState.nextPiece} /></div>

            {gameState.holdPiece && (
              <>
                <h3 className="text-sm font-bold mb-2 text-gray-300">Hold:</h3>
                <div className="mb-4"><PreviewPiece type={gameState.holdPiece} /></div>
              </>
            )}

            <p className="text-sm"><strong className="text-cyan-400">Score:</strong> {gameState.score}</p>
            <p className="text-sm"><strong className="text-cyan-400">Level:</strong> {gameState.level}</p>
            <p className="text-sm"><strong className="text-cyan-400">Lines:</strong> {gameState.linesCleared}</p>
            <p className="text-sm"><strong className="text-cyan-400">Pieces:</strong> {gameState.piecesCleared}</p>

            {gameState.isPaused && !gameState.gameOver && (
              <div className="mt-3 text-yellow-400 font-bold text-center py-2">
                PAUSED
              </div>
            )}

            {gameState.gameOver && (
              <button
                onClick={startGame}
                className="w-full mt-3 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded transition"
              >
                Play Again
              </button>
            )}

            <div className="mt-4 text-xs text-gray-500">
              <p className="font-bold mb-1">Controls:</p>
              <p>Keyboard: Arrow keys + Space</p>
              <p>Touch: Swipe / Tap / Double-tap</p>
            </div>

            {/* Toggle button for touch controls */}
            {isMobile.current && (
              <button
                onClick={() => setShowTouchControls(!showTouchControls)}
                className="mt-2 w-full py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition"
              >
                {showTouchControls ? 'Hide' : 'Show'} Controls
              </button>
            )}
          </div>
        </div>
      )}

      {gameState.gameOver && (
        <div className="mt-6 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-2">GAME OVER</h2>
          <p>Final Score: <span className="text-cyan-400">{gameState.score}</span></p>
          <p>Level: <span className="text-cyan-400">{gameState.level}</span></p>
          <p>Lines Cleared: <span className="text-cyan-400">{gameState.linesCleared}</span></p>
        </div>
      )}

      {/* Touch Controls (Virtual Buttons) */}
      {isGameStarted.current && !gameState.gameOver && (
        <TouchControls
          visible={showTouchControls}
          onLeft={handleVirtualLeft}
          onRight={handleVirtualRight}
          onDown={handleVirtualDown}
          onRotate={handleVirtualRotate}
          onHardDrop={handleVirtualHardDrop}
          onHold={handleVirtualHold}
          onPause={handleVirtualPause}
        />
      )}
    </div>
  );
}

function calculateDropSpeed(level: number): number {
  const baseSpeed = 1000;
  const speedDecrement = 50 * (level - 1);
  return Math.max(baseSpeed - speedDecrement, 100);
}

async function saveGameStats(
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

export default TetrisGame;
