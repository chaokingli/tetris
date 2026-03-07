'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TetrominoType, getRandomTetromino, getTetromino } from '@/lib/tetrominos';
import { GameBoard } from './GameBoard';
import { saveGameRecord, getHighScores, closeDb, clearAllScores as dbClearAllScores } from '@/src/lib/database';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const INITIAL_DROP_INTERVAL = 800; // ms

// Score multipliers for line clears
const SCORE_MULTIPLIERS = [0, 100, 300, 500, 800];

export default function Game() {
  const [board, setBoard] = useState<number[][]>(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState<{
    type: TetrominoType;
    x: number;
    y: number;
    rotation: number;
  } | null>(null);

  const [pieceQueue, setPieceQueue] = useState<TetrominoType[]>([]);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [highScores, setHighScores] = useState<{ name: string; score: number }[]>([]);

  // Refs for game loop and inputs
  const lastDropTimeRef = useRef<number>(0);
  const dropIntervalRef = useRef<number>(INITIAL_DROP_INTERVAL);
  const animationFrameRef = useRef<number>(0);
  const inputLockedRef = useRef<boolean>(false);

  // Initialize piece queue on client mount to avoid hydration mismatch
  useEffect(() => {
    setPieceQueue([getRandomTetromino(), getRandomTetromino()]);
  }, []);

  // Initialize high scores from database
  useEffect(() => {
    loadHighScores();
  }, []);

  async function loadHighScores() {
    try {
      const scores = await getHighScores();
      setHighScores(scores.map(s => ({ name: s.name, score: s.score })));
    } catch (error) {
      console.error('Failed to load high scores:', error);
    }
  }
  async function clearAllScores() {
    try {
      await dbClearAllScores();
    } catch (error) {
      console.error("Failed to clear all scores:", error);
    }
  }

  function createEmptyBoard(): number[][] {
    return Array.from({ length: BOARD_HEIGHT }, () =>
      Array(BOARD_WIDTH).fill(0)
    );
  }

  // Function to spawn a new piece from the queue
  const spawnPiece = useCallback(() => {
    if (pieceQueue.length < 1) return;

    const type = pieceQueue[0];
    const tetromino = getTetromino(type);

    let x = 3;
    if (type === 'O') x = 4;

    const newPiece = {
      type,
      x,
      y: type === 'I' ? -1 : 0,
      rotation: 0,
    };

    if (checkCollision(board, type, newPiece.y, 0, x)) {
      setGameOver(true);
      return;
    }

    setCurrentPiece(newPiece);
    setPieceQueue(prev => [...prev.slice(1), getRandomTetromino()]);
  }, [board, pieceQueue]);

  // Spawn piece whenever currentPiece is null
  useEffect(() => {
    if (!currentPiece && !gameOver && pieceQueue.length > 0) {
      spawnPiece();
    }
  }, [currentPiece, gameOver, pieceQueue.length, spawnPiece]);

  // Calculate ghost piece Y position (where piece would land)
  const getGhostY = useCallback((): number | undefined => {
    if (!currentPiece) return undefined;

    let ghostY = currentPiece.y;

    while (!checkCollision(board, currentPiece.type, ghostY + 1, currentPiece.rotation, currentPiece.x)) {
      ghostY++;
    }

    // If piece is already at bottom or blocked immediately, don't show ghost
    if (ghostY === currentPiece.y) return undefined;

    return ghostY;
  }, [board, currentPiece]);

  // Check for collision with walls and locked pieces
  function checkCollision(
    boardState: number[][],
    pieceType: TetrominoType,
    y: number,
    rotation: number,
    x: number
  ): boolean {
    const tetromino = getTetromino(pieceType);
    const shape = tetromino.rotations[rotation % 4];

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] !== 0) {
          const boardX = x + col;
          const boardY = y + row;

          // Wall collision
          if (boardX < 0 || boardX >= BOARD_WIDTH) {
            return true;
          }

          // Bottom or locked piece collision
          if (boardY >= BOARD_HEIGHT || (boardY >= 0 && boardState[boardY][boardX] !== 0)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  // Rotate piece with wall kicks (SRS system)
  function rotatePiece(dir: 'clockwise' | 'counterClockwise'): boolean {
    if (!currentPiece || inputLockedRef.current || gameOver || isPaused) return false;

    const tetromino = getTetromino(currentPiece.type);
    const newRotation = (currentPiece.rotation + (dir === 'clockwise' ? 1 : 3)) % 4;

    // Try no kick first, then wall kicks
    const kickOffsets = dir === 'clockwise'
      ? tetromino.wallKicks.clockwise
      : tetromino.wallKicks.counterClockwise;

    for (const offset of kickOffsets) {
      if (!checkCollision(board, currentPiece.type, currentPiece.y, newRotation, currentPiece.x + offset.x)) {
        setCurrentPiece(prev => prev ? ({
          ...prev,
          x: prev.x + offset.x,
          rotation: newRotation,
        }) : null);

        inputLockedRef.current = true;
        setTimeout(() => { inputLockedRef.current = false; }, 50);
        return true;
      }
    }

    // No valid rotation found
    return false;
  }

  // Move piece left/right
  function movePiece(dx: number): boolean {
    if (!currentPiece || inputLockedRef.current || gameOver || isPaused) return false;

    if (!checkCollision(board, currentPiece.type, currentPiece.y, currentPiece.rotation, currentPiece.x + dx)) {
      setCurrentPiece(prev => prev ? ({ ...prev, x: prev.x + dx }) : null);
      return true;
    }

    return false;
  }

  // Hard drop - move piece to bottom immediately
  function hardDrop(): boolean {
    if (!currentPiece || inputLockedRef.current || gameOver || isPaused) return false;

    // Find final drop position
    let dropY = currentPiece.y;
    while (!checkCollision(board, currentPiece.type, dropY + 1, currentPiece.rotation, currentPiece.x)) {
      dropY++;
    }

    const finalPiece = { ...currentPiece, y: dropY };

    // Update piece position visually (though it will be nullified immediately)
    setCurrentPiece(finalPiece);

    // Lock immediately after hard drop using the final position
    lockCurrentPiece(finalPiece);

    return true;
  }
  // Helper function to get color index for piece type
  const getPieceColorIndex = (type: TetrominoType): number => {
    const colors: Record<TetrominoType, number> = {
      I: 5, // Cyan
      J: 2, // Blue
      L: 7, // Orange
      O: 3, // Yellow
      S: 4, // Green
      T: 6, // Purple
      Z: 1, // Red
    };
    return colors[type] || 9;
  };

  // Lock current piece to board and check for line clears
  function lockCurrentPiece(pieceToLock = currentPiece) {
    if (!pieceToLock) return;

    setBoard(prevBoard => {
      const newBoard = prevBoard.map(row => [...row]);
      const tetromino = getTetromino(pieceToLock.type);
      const shape = tetromino.rotations[pieceToLock.rotation % 4];
      const colorIndex = getPieceColorIndex(pieceToLock.type);

      let isGameOver = false;

      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x] !== 0) {
            const boardX = pieceToLock.x + x;
            const boardY = pieceToLock.y + y;

            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              newBoard[boardY][boardX] = colorIndex;
            } else if (boardY < 0) {
              isGameOver = true;
            }
          }
        }
      }

      if (isGameOver || pieceToLock.y < 0) {
        setGameOver(true);
        return newBoard;
      }

      // Check for line clears
      const clearedLines: number[] = [];
      for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (newBoard[y].every(cell => cell !== 0)) {
          clearedLines.push(y);
        }
      }

      if (clearedLines.length > 0) {
        for (const y of clearedLines) {
          newBoard.splice(y, 1);
          newBoard.unshift(Array(BOARD_WIDTH).fill(0));
        }

        // Update score and level
        const points = SCORE_MULTIPLIERS[clearedLines.length] * level;
        setScore(s => s + points);
        setLines(l => {
          const newLines = l + clearedLines.length;
          const newLevel = Math.floor(newLines / 10) + 1;
          if (newLevel > level) {
            setLevel(newLevel);
            dropIntervalRef.current = Math.max(100, INITIAL_DROP_INTERVAL - (newLevel - 1) * 70);
          }
          return newLines;
        });
      }

      // Important: Nullify current piece and spawn next ONE turn later
      // Or we can just trigger it here.
      return newBoard;
    });

    setCurrentPiece(null);
    // The useEffect will handle spawning the next piece when currentPiece becomes null
  }
  // Game loop - handle piece drop
  useEffect(() => {
    if (gameOver || isPaused || !currentPiece) return;

    const gameLoop = (timestamp: number) => {
      if (!lastDropTimeRef.current) lastDropTimeRef.current = timestamp;

      const deltaTime = timestamp - lastDropTimeRef.current;

      if (deltaTime >= dropIntervalRef.current) {
        if (!checkCollision(board, currentPiece.type, currentPiece.y + 1, currentPiece.rotation, currentPiece.x)) {
          setCurrentPiece(prev => prev ? ({ ...prev, y: prev.y + 1 }) : null);
          lastDropTimeRef.current = timestamp;
        } else {
          // Lock piece and spawn new one
          lockCurrentPiece();
        }
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [board, currentPiece, gameOver, isPaused]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          movePiece(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          movePiece(1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          // Soft drop - speed up fall
          if (currentPiece && !checkCollision(board, currentPiece.type, currentPiece.y + 1, currentPiece.rotation, currentPiece.x)) {
            setCurrentPiece(prev => prev ? ({ ...prev, y: prev.y + 1 }) : null);
            setScore(prev => prev + 1); // Soft drop points
          } else if (currentPiece) {
            // If we hit bottom while soft dropping, lock it
            lockCurrentPiece();
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotatePiece('clockwise');
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        case 'p':
        case 'P':
          setIsPaused(prev => !prev);
          break;
        case 'r':
        case 'R':
          if (gameOver) resetGame();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [board, currentPiece, gameOver]);

  async function resetGame() {
    setBoard(createEmptyBoard());
    setCurrentPiece(null);
    setPieceQueue([getRandomTetromino(), getRandomTetromino()]); // Reset piece queue
    setScore(0);
    setLines(0);
    setLevel(1);
    dropIntervalRef.current = INITIAL_DROP_INTERVAL;
    setGameOver(false);
    setIsPaused(false);
    lastDropTimeRef.current = 0;

    // Clear database and load fresh high scores
    clearAllScores();
    await loadHighScores();
  }

  const ghostY = getGhostY();

  if (pieceQueue.length === 0) return null;

  return (
    <div className="min-h-screen bg-[#1a1c23] flex items-center justify-center p-4 overflow-hidden relative font-sans selection:bg-purple-500/30">
      {/* Background Decorative Neon Tetrominoes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="neon-tetromino text-blue-500 top-[10%] left-[5%] rotate-12 scale-150">
          <svg width="60" height="40" viewBox="0 0 60 40" fill="currentColor"><rect x="0" y="0" width="20" height="20" /><rect x="20" y="0" width="20" height="20" /><rect x="40" y="0" width="20" height="20" /><rect x="20" y="20" width="20" height="20" /></svg>
        </div>
        <div className="neon-tetromino text-purple-500 top-[5%] right-[15%] -rotate-12 scale-125">
          <svg width="60" height="40" viewBox="0 0 60 40" fill="currentColor"><rect x="0" y="20" width="20" height="20" /><rect x="20" y="20" width="20" height="20" /><rect x="20" y="0" width="20" height="20" /><rect x="40" y="0" width="20" height="20" /></svg>
        </div>
        <div className="neon-tetromino text-green-500 top-[45%] left-[2%] rotate-45 scale-110">
          <svg width="40" height="60" viewBox="0 0 40 60" fill="currentColor"><rect x="0" y="0" width="20" height="20" /><rect x="0" y="20" width="20" height="20" /><rect x="0" y="40" width="20" height="20" /><rect x="20" y="40" width="20" height="20" /></svg>
        </div>
        <div className="neon-tetromino text-red-500 bottom-[15%] left-[10%] -rotate-6 scale-150">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="currentColor"><rect x="0" y="0" width="20" height="20" /><rect x="20" y="0" width="20" height="20" /><rect x="0" y="20" width="20" height="20" /><rect x="20" y="20" width="20" height="20" /></svg>
        </div>
        <div className="neon-tetromino text-yellow-500 bottom-[10%] right-[12%] rotate-[15deg] scale-125">
          <svg width="80" height="20" viewBox="0 0 80 20" fill="currentColor"><rect x="0" y="0" width="20" height="20" /><rect x="20" y="0" width="20" height="20" /><rect x="40" y="0" width="20" height="20" /><rect x="60" y="0" width="20" height="20" /></svg>
        </div>
        <div className="neon-tetromino text-cyan-400 top-[30%] right-[2%] rotate-[-30deg] scale-150">
          <svg width="40" height="60" viewBox="0 0 40 60" fill="currentColor"><rect x="20" y="0" width="20" height="20" /><rect x="20" y="20" width="20" height="20" /><rect x="20" y="40" width="20" height="20" /><rect x="0" y="40" width="20" height="20" /></svg>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 lg:gap-12 max-w-6xl w-full items-center md:items-stretch justify-center relative z-10 transition-all duration-500">

        {/* Mobile Header: Logo & Stats (Visible only on mobile/small tablet vertically) */}
        <div className="md:hidden w-full flex flex-col items-center gap-4 mb-4">
          <h1 className="tetris-logo-small">TETRIS</h1>
          <div className="grid grid-cols-3 gap-6 w-full max-w-[320px]">
            <div className="text-center">
              <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-0.5">Score</p>
              <p className="text-xl font-black">{score}</p>
            </div>
            <div className="text-center">
              <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-0.5">Lines</p>
              <p className="text-xl font-black">{lines}</p>
            </div>
            <div className="text-center">
              <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-0.5">Level</p>
              <p className="text-xl font-black">{level}</p>
            </div>
          </div>
        </div>

        {/* Left Panel - Controls (Hidden on mobile) */}
        <div className="hidden md:block w-52 lg:w-64">
          <div className="panel-glass p-6 h-full flex flex-col">
            <h3 className="text-white/90 font-black text-lg mb-8 tracking-tight border-b border-white/5 pb-2">CONTROLS</h3>
            <div className="space-y-6">
              {[
                { keys: ['←', '→'], label: 'Move' },
                { keys: ['↑'], label: 'Rotate' },
                { keys: ['↓'], label: 'Soft drop' },
                { keys: ['Space'], label: 'Hard drop', wide: true },
                { keys: ['P'], label: 'Pause' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex gap-1.5 min-w-[64px]">
                    {item.keys.map(key => (
                      <div key={key} className={`key-button ${item.wide ? 'px-3 text-[9px] uppercase' : 'w-7 h-7 text-xs text-center'}`}>{key}</div>
                    ))}
                  </div>
                  <span className="text-white/50 font-bold text-xs uppercase tracking-wider">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center - Game Board Area */}
        <div className="relative">
          {/* Mobile Quick Controls Row (Above board on mobile) */}
          <div className="md:hidden flex items-center justify-between gap-3 w-full max-w-[300px] mb-3 px-1">
            <div className="panel-glass p-2 flex-1 flex items-center justify-between px-3">
              <button className="key-button w-8 h-8" onClick={() => movePiece(-1)}>←</button>
              <button className="key-button w-8 h-8" onClick={() => movePiece(1)}>→</button>
              <button className="key-button w-8 h-8" onClick={() => rotatePiece('clockwise')}>↑</button>
              <button className="key-button w-8 h-8" onClick={() => { if (currentPiece && !checkCollision(board, currentPiece.type, currentPiece.y + 1, currentPiece.rotation, currentPiece.x)) { setCurrentPiece(prev => prev ? ({ ...prev, y: prev.y + 1 }) : null); } }}>↓</button>
            </div>
          </div>

          <div className="relative group">
            {/* Next Piece Overlay (Integrated top-right of the board area) */}
            <div className="absolute -right-3 top-0 translate-x-full z-20">
              <div className="panel-glass p-2 w-20 flex flex-col items-center gap-1 border-l-0 rounded-l-none shadow-xl">
                <p className="text-white/30 text-[9px] font-black tracking-widest uppercase border-b border-white/5 w-full text-center pb-0.5">Next</p>
                <div className="w-14 h-14 flex items-center justify-center scale-90">
                  {pieceQueue.length > 0 && (
                    <div
                      className="grid gap-[2px]"
                      style={{
                        gridTemplateColumns: `repeat(${getTetromino(pieceQueue[0]).rotations[0][0].length}, min-content)`,
                        gridTemplateRows: `repeat(${getTetromino(pieceQueue[0]).rotations[0].length}, min-content)`
                      }}
                    >
                      {(() => {
                        const nextType = pieceQueue[0];
                        const tetromino = getTetromino(nextType);
                        const shape = tetromino.rotations[0];
                        const color = getColorForPiece(nextType);
                        return shape.map((row, r) => row.map((isOccupied, c) => (
                          <div
                            key={`${r}-${c}`}
                            className="w-2.5 h-2.5 rounded-[1px]"
                            style={{
                              backgroundColor: isOccupied ? color : 'transparent',
                              boxShadow: isOccupied ? `0 0 8px ${color}60` : 'none',
                              opacity: isOccupied ? 1 : 0
                            }}
                          />
                        )));
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* The Board */}
            <div className="relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <GameBoard
                board={board}
                currentPiece={currentPiece || undefined}
                ghostY={ghostY}
              />

              {/* Overlays */}
              {(isPaused || gameOver) && (
                <div className={`absolute inset-0 z-40 flex flex-col items-center justify-center rounded-xl backdrop-blur-md transition-all ${gameOver ? 'bg-red-950/80' : 'bg-[#1a1c23]/60'}`}>
                  {isPaused && !gameOver ? (
                    <p className="text-yellow-500 text-3xl font-black tracking-widest animate-pulse drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">PAUSED</p>
                  ) : (
                    <>
                      <h2 className="text-3xl font-black text-red-500 mb-2 tracking-tighter">GAME OVER</h2>
                      <p className="text-white/60 font-bold mb-6 italic">Score: <span className="text-white not-italic text-xl">{score.toLocaleString()}</span></p>
                      <button onClick={resetGame} className="bg-red-500 hover:bg-red-600 text-white font-black py-3 px-8 rounded-xl shadow-[0_4px_0_rgb(153,27,27)] active:translate-y-1 transition-all">TRY AGAIN</button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Logo & Stats & Buttons (Desktop/Tablet) */}
        <div className="hidden md:flex flex-col w-56 lg:w-72 gap-6">
          <div className="panel-glass p-8 flex flex-col flex-1 h-full">
            <h1 className="tetris-logo mb-12 text-center">TETRIS</h1>

            <div className="space-y-8 flex-1">
              {[
                { label: 'Score', value: score, size: 'text-4xl' },
                { label: 'Lines', value: lines, size: 'text-3xl' },
                { label: 'Level', value: level, size: 'text-3xl' },
              ].map(stat => (
                <div key={stat.label}>
                  <p className="text-white/30 text-[11px] font-black tracking-widest uppercase mb-1">{stat.label}</p>
                  <p className={`${stat.size} font-black tabular-nums tracking-tight`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 mt-12">
              <button onClick={() => setIsPaused(prev => !prev)} className="game-button bg-[#ff9d3b] hover:bg-[#ff8a1f]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                <span>{isPaused ? 'Resume Game' : 'Pause Game'}</span>
              </button>
              <button className="game-button bg-[#3bff3b] hover:bg-[#2ae02a]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                <span>Next</span>
              </button>
              <button onClick={resetGame} className="game-button bg-[#ff3b3b] hover:bg-[#e62e2e]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                <span>Reset Game</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Buttons Footer (Visible only on mobile) */}
        <div className="md:hidden grid grid-cols-3 gap-3 w-full max-w-[320px] mt-4">
          <button onClick={() => setIsPaused(prev => !prev)} className="game-button bg-[#ff9d3b] p-3 text-[10px] flex-col gap-1 min-h-[60px]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="5" width="3" height="14" rx="1" /><rect x="14" y="5" width="3" height="14" rx="1" /></svg>
            <span>PAUSE</span>
          </button>
          <button className="game-button bg-[#3bff3b] p-3 text-[10px] flex-col gap-1 min-h-[60px]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            <span>NEXT</span>
          </button>
          <button onClick={resetGame} className="game-button bg-[#ff3b3b] p-3 text-[10px] flex-col gap-1 min-h-[60px]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
            <span>RESET</span>
          </button>
        </div>

      </div>
    </div>
  );
}

// Helper to get color for piece type
function getColorForPiece(type: TetrominoType): string {
  const colors: Record<TetrominoType, string> = {
    Z: '#ff3b3b', // Red
    J: '#3b82ff', // Blue
    O: '#ff9d3b', // Orange
    S: '#3bff3b', // Green
    I: '#00ddeb', // Cyan
    T: '#9d3bff', // Purple
    L: '#ffeb3b', // Yellow
  };
  return colors[type] || '#ffffff';
}
