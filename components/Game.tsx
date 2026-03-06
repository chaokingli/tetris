'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TetrominoType, getRandomTetromino, getTetromino } from '@/lib/tetrominos';
import { GameBoard } from './GameBoard';
import { saveGameRecord, getHighScores, closeDb, clearAllScores as dbClearAllScores} from '@/src/lib/database';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const INITIAL_DROP_INTERVAL = 800; // ms

// Score multipliers for line clears
const SCORE_MULTIPLIERS = [0, 100, 300, 500, 800];

export function Game() {
  const [board, setBoard] = useState<number[][]>(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState<{
    type: TetrominoType;
    x: number;
    y: number;
    rotation: number;
  } | null>(null);
  
  const [nextPiece, setNextPiece] = useState<TetrominoType | null>(null);
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

  // Initialize next piece on client mount to avoid hydration mismatch
  useEffect(() => {
    setNextPiece(getRandomTetromino());
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

  // Spawn a new piece at the top center
  const spawnPiece = useCallback(() => {
    if (!nextPiece) return;
    
    const type = nextPiece;
    const tetromino = getTetromino(type);
    
    // Center the piece horizontally (adjust based on shape width)
    const minWidth = 4 - (type === 'O' ? 2 : type === 'I' || type === 'Z' || type === 'S' ? 3 : 3);
    const x = Math.floor((BOARD_WIDTH - minWidth) / 2);
    
    setCurrentPiece({
      type,
      x,
      y: 0, // Start at top
      rotation: 0,
    });

    setNextPiece(getRandomTetromino());
  }, [nextPiece]);

  // Initial piece spawn
  useEffect(() => {
    if (!currentPiece && !gameOver) {
      spawnPiece();
    }
  }, [currentPiece, gameOver, spawnPiece]);

  // Calculate ghost piece Y position (where piece would land)
  const getGhostY = useCallback((): number | undefined => {
    if (!currentPiece) return undefined;

    let ghostY = currentPiece.y;
    
    while (!checkCollision(board, currentPiece.type, ghostY + 1, currentPiece.rotation)) {
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
    xOffset = 0
  ): boolean {
    const tetromino = getTetromino(pieceType);
    const shape = tetromino.rotations[rotation % 4];

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] !== 0) {
          const boardX = xOffset + col;
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
      if (!checkCollision(board, currentPiece.type, currentPiece.y, newRotation, offset.x)) {
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

    if (!checkCollision(board, currentPiece.type, currentPiece.y, currentPiece.rotation, dx)) {
      setCurrentPiece(prev => prev ? ({ ...prev, x: prev.x + dx }) : null);
      return true;
    }

    // Try wall kick for edge cases
    const kickOffset = dx > 0 ? [1, -2] : [-1, 2];
    for (const offset of kickOffset) {
      if (!checkCollision(board, currentPiece.type, currentPiece.y, currentPiece.rotation, offset)) {
        setCurrentPiece(prev => prev ? ({ ...prev, x: prev.x + offset }) : null);
        return true;
      }
    }

    return false;
  }

  // Hard drop - move piece to bottom immediately
  function hardDrop(): boolean {
    if (!currentPiece || inputLockedRef.current || gameOver || isPaused) return false;

    let dropY = currentPiece.y;
    while (!checkCollision(board, currentPiece.type, dropY + 1, currentPiece.rotation)) {
      dropY++;
    }

    setCurrentPiece(prev => prev ? ({ ...prev, y: dropY }) : null);
    
    // Lock immediately after hard drop (lock delay starts)
    inputLockedRef.current = true;
    setTimeout(() => { 
      lockCurrentPiece();
      inputLockedRef.current = false;
    }, 50);
    
    return true;
  }
  // Helper function to get color index for piece type
  const getPieceColorIndex = (type: TetrominoType): number => {
    const colors: Record<TetrominoType, number> = {
      I: 5, // Cyan
      J: 2, // Teal
      L: 7, // Blue-grey
      O: 3, // Yellow
      S: 4, // Mint green
      T: 6, // Purple
      Z: 1, // Red-ish
    };
    return colors[type] || 9;
  };

  // Lock current piece to board and check for line clears
  function lockCurrentPiece() {
    if (!currentPiece) return;

    const newBoard = board.map(row => [...row]);
    const tetromino = getTetromino(currentPiece.type);
    const shape = tetromino.rotations[currentPiece.rotation % 4];
    
    // Get color index for this piece type
    const colorIndex = getPieceColorIndex(currentPiece.type);

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] !== 0) {
          const boardX = currentPiece.x + x;
          const boardY = currentPiece.y + y;

          // Game over if locking at top
          if (boardY < 0) {
            setGameOver(true);
            return;
          }

          newBoard[boardY][boardX] = colorIndex;
        }
      }
    }

    // Check for line clears
    const clearedLines: number[] = [];
    
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell !== 0)) {
        clearedLines.push(y);
      }
    }

    // Remove cleared lines and add new empty lines at top
    for (const y of clearedLines) {
      newBoard.splice(y, 1);
      newBoard.unshift(Array(BOARD_WIDTH).fill(0));
    }

    setBoard(newBoard);

    if (clearedLines.length > 0) {
      // Update score and lines
      const points = SCORE_MULTIPLIERS[clearedLines.length] * level;
      setScore(prev => prev + points);
      setLines(prev => {
        const newLines = prev + clearedLines.length;
        
        // Level up every 10 lines
        const newLevel = Math.floor(newLines / 10) + 1;
        if (newLevel > level) {
          setLevel(newLevel);
          dropIntervalRef.current = Math.max(100, INITIAL_DROP_INTERVAL - (newLevel - 1) * 70);
        }
        
        return newLines;
      });
  }

  }
  // Game loop - handle piece drop
  useEffect(() => {
    if (gameOver || isPaused || !currentPiece) return;

    const gameLoop = (timestamp: number) => {
      if (!lastDropTimeRef.current) lastDropTimeRef.current = timestamp;
      
      const deltaTime = timestamp - lastDropTimeRef.current;
      
      if (deltaTime >= dropIntervalRef.current) {
        if (!checkCollision(board, currentPiece.type, currentPiece.y + 1, currentPiece.rotation)) {
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
          if (currentPiece && !checkCollision(board, currentPiece.type, currentPiece.y + 1, currentPiece.rotation)) {
            setCurrentPiece(prev => prev ? ({ ...prev, y: prev.y + 1 }) : null);
            setScore(prev => prev + 1); // Soft drop points
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-2 sm:p-4 overflow-hidden relative">
      {/* Background decorative Tetrominoes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 opacity-20 text-6xl">🟦</div>
        <div className="absolute top-20 right-20 opacity-20 text-6xl">🟩</div>
        <div className="absolute bottom-20 left-20 opacity-20 text-6xl">🟪</div>
        <div className="absolute bottom-10 right-10 opacity-20 text-6xl">🟧</div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 max-w-7xl w-full items-center lg:items-start justify-center">
        {/* Mobile/Tablet Logo */}
        <div className="lg:hidden w-full text-center mb-2">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 bg-clip-text text-transparent drop-shadow-lg">
            TETRIS
          </h1>
        </div>

        {/* Left Panel - Controls (Desktop only) */}
        <div className="hidden lg:block w-48 xl:w-56 flex-shrink-0">
          <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700 shadow-xl sticky top-4">
            <h3 className="text-white font-bold text-lg mb-3 text-center">CONTROLS</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="flex gap-1">
                  <kbd className="bg-gray-700 text-white px-2 py-1 rounded text-xs font-mono">←</kbd>
                  <kbd className="bg-gray-700 text-white px-2 py-1 rounded text-xs font-mono">→</kbd>
                </div>
                <span className="text-gray-300">Move</span>
              </li>
              <li className="flex items-center gap-2">
                <kbd className="bg-gray-700 text-white px-2 py-1 rounded text-xs font-mono">↑</kbd>
                <span className="text-gray-300">Rotate</span>
              </li>
              <li className="flex items-center gap-2">
                <kbd className="bg-gray-700 text-white px-2 py-1 rounded text-xs font-mono">↓</kbd>
                <span className="text-gray-300">Soft drop</span>
              </li>
              <li className="flex items-center gap-2">
                <kbd className="bg-gray-700 text-white px-2 py-1 rounded text-xs font-mono">Space</kbd>
                <span className="text-gray-300">Hard drop</span>
              </li>
              <li className="flex items-center gap-2">
                <kbd className="bg-gray-700 text-white px-2 py-1 rounded text-xs font-mono">P</kbd>
                <span className="text-gray-300">Pause</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Center - Game Board */}
        <div className="flex-shrink-0 flex flex-col items-center">
          {/* Mobile Stats Bar */}
          <div className="lg:hidden w-full grid grid-cols-3 gap-2 mb-3">
            <div className="bg-gray-800/80 backdrop-blur-sm p-2 rounded-lg text-center">
              <p className="text-gray-400 text-xs">SCORE</p>
              <p className="text-lg font-bold text-white">{score.toLocaleString()}</p>
            </div>
            <div className="bg-gray-800/80 backdrop-blur-sm p-2 rounded-lg text-center">
              <p className="text-gray-400 text-xs">LINES</p>
              <p className="text-lg font-bold text-cyan-400">{lines}</p>
            </div>
            <div className="bg-gray-800/80 backdrop-blur-sm p-2 rounded-lg text-center">
              <p className="text-gray-400 text-xs">LEVEL</p>
              <p className="text-lg font-bold text-yellow-400">{level}</p>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="lg:hidden w-full mb-3">
            <div className="bg-gray-800/80 backdrop-blur-sm p-3 rounded-lg">
              <div className="grid grid-cols-4 gap-2">
                <button
                  onTouchStart={(e) => { e.preventDefault(); movePiece(-1); }}
                  onClick={() => movePiece(-1)}
                  className="bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white p-3 rounded-lg text-xl font-bold"
                >
                  ←
                </button>
                <button
                  onTouchStart={(e) => { e.preventDefault(); movePiece(1); }}
                  onClick={() => movePiece(1)}
                  className="bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white p-3 rounded-lg text-xl font-bold"
                >
                  →
                </button>
                <button
                  onTouchStart={(e) => { e.preventDefault(); rotatePiece('clockwise'); }}
                  onClick={() => rotatePiece('clockwise')}
                  className="bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white p-3 rounded-lg text-xl font-bold"
                >
                  ↻
                </button>
                <button
                  onTouchStart={(e) => { e.preventDefault(); hardDrop(); }}
                  onClick={() => hardDrop()}
                  className="bg-orange-600 hover:bg-orange-700 active:bg-orange-500 text-white p-3 rounded-lg text-xs font-bold"
                >
                  DROP
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onTouchStart={(e) => { e.preventDefault(); if (currentPiece && !checkCollision(board, currentPiece.type, currentPiece.y + 1, currentPiece.rotation)) { setCurrentPiece(prev => prev ? ({ ...prev, y: prev.y + 1 }) : null); setScore(prev => prev + 1); } }}
                  onClick={() => { if (currentPiece && !checkCollision(board, currentPiece.type, currentPiece.y + 1, currentPiece.rotation)) { setCurrentPiece(prev => prev ? ({ ...prev, y: prev.y + 1 }) : null); setScore(prev => prev + 1); } }}
                  className="bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white p-3 rounded-lg text-xl font-bold"
                >
                  ↓
                </button>
                <button
                  onClick={() => setIsPaused(prev => !prev)}
                  className="bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-500 text-white p-3 rounded-lg font-bold text-sm"
                >
                  {isPaused ? 'RESUME' : 'PAUSE'}
                </button>
              </div>
            </div>
          </div>

          {isPaused && !gameOver ? (
            <div className="bg-gray-900/90 backdrop-blur-sm border-4 border-yellow-600 rounded-xl p-8 w-[280px] sm:w-[320px] h-[504px] sm:h-[570px] flex items-center justify-center shadow-2xl">
              <p className="text-yellow-500 text-2xl font-bold animate-pulse">PAUSED</p>
            </div>
          ) : (
            <GameBoard 
              board={board} 
              currentPiece={currentPiece || undefined}
              ghostY={ghostY}
            />
          )}

          {/* Game Over Modal */}
          {gameOver && (
            <div className="mt-4 bg-red-900/50 border-2 border-red-700 rounded-xl p-4 text-center animate-pulse shadow-xl">
              <p className="text-xl font-bold text-red-300 mb-2">GAME OVER</p>
              <p className="text-gray-200 mb-3">Final Score: <span className="text-yellow-400 font-bold">{score.toLocaleString()}</span></p>
              <button
                onClick={resetGame}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition"
              >
                Play Again
              </button>
            </div>
          )}
        </div>

        {/* Right Panel - Stats & Next Piece */}
        <div className="w-full lg:w-48 xl:w-56 flex-shrink-0 space-y-3 lg:space-y-4">
          {/* Desktop Logo */}
          <div className="hidden lg:block">
            <h1 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 bg-clip-text text-transparent drop-shadow-lg">
              TETRIS
            </h1>
          </div>

          {/* Desktop Stats */}
          <div className="hidden lg:block space-y-3">
            <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700 shadow-xl">
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider">SCORE</p>
                  <p className="text-3xl font-bold text-white">{score.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider">LINES</p>
                  <p className="text-2xl font-bold text-cyan-400">{lines}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider">LEVEL</p>
                  <p className="text-2xl font-bold text-yellow-400">{level}</p>
                </div>
              </div>
            </div>
        
            {/* High Scores */}
            {highScores.length > 0 && (
              <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700 shadow-xl">
                <h3 className="text-gray-300 font-bold mb-2 text-sm uppercase tracking-wider">🏆 Top Scores</h3>
                <ul className="space-y-1 text-sm">
                  {highScores.slice(0, 5).map((entry, i) => (
                    <li key={i} className="flex justify-between">
                      <span className="text-gray-400">#{i + 1}</span>
                      <span className="text-green-400 font-bold">{entry.score.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        
          {/* Next Piece */}
          <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700 shadow-xl">
            <h2 className="text-gray-400 text-center mb-3 text-sm uppercase tracking-wider">NEXT</h2>
            <div className="flex items-center justify-center min-h-[100px]">
              {nextPiece && (
                <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  {(() => {
                    const tetromino = getTetromino(nextPiece);
                    return Array.from({ length: 3 }).map((_, row) => 
                      Array.from({ length: 3 }).map((_, col) => (
                        <div
                          key={`${row}-${col}`}
                          className={`w-6 h-6 sm:w-8 sm:h-8 rounded-sm ${
                            tetromino.rotations[0][row]?.[col] ? 'border-2' : ''
                          }`}
                          style={{
                            backgroundColor: tetromino.rotations[0][row]?.[col] 
                              ? getPieceColorIndex(nextPiece) + '88'
                              : 'transparent',
                            borderColor: tetromino.rotations[0][row]?.[col] ? '#fff' : 'transparent',
                          }}
                        />
                      ))
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        
          {/* Action Buttons */}
          <div className="space-y-2">
            {!isPaused && !gameOver && (
              <button
                onClick={() => setIsPaused(true)}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-3 rounded-lg font-bold shadow-lg transition transform hover:scale-105"
              >
                ⏸ Pause Game
              </button>
            )}
        
            {isPaused && !gameOver && (
              <button
                onClick={() => setIsPaused(false)}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 rounded-lg font-bold shadow-lg transition transform hover:scale-105"
              >
                ▶ Resume Game
              </button>
            )}
        
            <button
              onClick={resetGame}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3 rounded-lg font-bold shadow-lg transition transform hover:scale-105"
            >
              🔄 Reset Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Game;
