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
  
  const [nextPiece, setNextPiece] = useState<TetrominoType>(() => getRandomTetromino());
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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="flex gap-8 max-w-4xl w-full">
        {/* Left panel - Stats */}
        <div className="w-48 space-y-4">
          <h1 className="text-3xl font-bold text-white mb-4 text-center">Tetris</h1>
          
          {gameOver && (
            <div className="bg-red-900/50 border-2 border-red-700 rounded-lg p-4 text-center animate-pulse">
              <p className="text-xl font-bold text-red-300 mb-2">GAME OVER</p>
              <p className="text-gray-200 mb-2">Score: {score}</p>
              <button
                onClick={resetGame}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold"
              >
                Play Again (R)
              </button>
            </div>
          )}

          {!gameOver && (
            <div className="space-y-3">
              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-400 text-sm">Score</p>
                <p className="text-2xl font-bold text-white">{score.toLocaleString()}</p>
              </div>

              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-400 text-sm">Lines</p>
                <p className="text-xl font-bold text-cyan-400">{lines}</p>
              </div>

              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-400 text-sm">Level</p>
                <p className="text-xl font-bold text-yellow-400">{level}</p>
              </div>
            </div>
          )}

          {highScores.length > 0 && (
            <div className="bg-gray-800 p-3 rounded-lg">
              <h3 className="text-gray-300 font-bold mb-2">High Scores</h3>
              <ul className="space-y-1 text-sm">
                {highScores.slice(0, 5).map((entry, i) => (
                  <li key={i}>
                    <span className="text-green-400 font-bold">{entry.score.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Controls help */}
          {!gameOver && (
            <div className="bg-gray-800 p-3 rounded-lg text-xs">
              <h3 className="text-gray-300 font-bold mb-2">Controls</h3>
              <ul className="space-y-1 text-gray-400">
                <li><span className="text-white font-mono">←→</span> Move</li>
                <li><span className="text-white font-mono">↑</span> Rotate</li>
                <li><span className="text-white font-mono">↓</span> Soft drop</li>
                <li><span className="text-white font-mono">Space</span> Hard drop</li>
                <li><span className="text-white font-mono">P</span> Pause</li>
              </ul>
            </div>
          )}

          {!isPaused && !gameOver && (
            <button
              onClick={() => setIsPaused(true)}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded font-bold"
            >
              Pause Game
            </button>
          )}

          {isPaused && !gameOver && (
            <button
              onClick={() => setIsPaused(false)}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold"
            >
              Resume Game
            </button>
          )}
        </div>

        {/* Center - Game Board */}
        <div className="flex-shrink-0">
          {isPaused && !gameOver ? (
            <div className="bg-gray-900 border-4 border-yellow-600 rounded-lg p-8 w-[320px] h-[570px] flex items-center justify-center">
              <p className="text-yellow-500 text-2xl font-bold animate-pulse">PAUSED</p>
            </div>
          ) : (
            <GameBoard 
              board={board} 
              currentPiece={currentPiece || undefined}
              ghostY={ghostY}
            />
          )}
        </div>

        {/* Right panel - Next piece */}
        <div className="w-32">
          <h2 className="text-gray-400 text-center mb-2">Next</h2>
          <div className="bg-gray-800 p-4 rounded-lg flex items-center justify-center min-h-[150px]">
            {nextPiece && (
              <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {(() => {
                  const tetromino = getTetromino(nextPiece);
                  return Array.from({ length: 3 }).map((_, row) => 
                    Array.from({ length: 3 }).map((_, col) => (
                      <div
                        key={`${row}-${col}`}
                        className={`w-6 h-6 rounded-sm ${
                          tetromino.rotations[0][row]?.[col] ? 'border-2' : ''
                        }`}
                        style={{
                          backgroundColor: tetromino.rotations[0][row]?.[col] 
                            ? getPieceColorIndex(nextPiece) + '88' // semi-transparent
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

          <button
            onClick={resetGame}
            className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold"
          >
            Reset Game
          </button>
        </div>
      </div>
    </div>
  );
}

export default Game;
