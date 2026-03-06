'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Board } from './Board';
import { PieceRenderer } from './PieceRenderer';

import { PreviewPiece } from './PreviewPiece';
import { GameState, getInitialGameState, movePiece, rotateCurrentPiece, hardDrop, checkGameOver, calculateDropSpeed, saveGameStats, GameStats } from './GameLogic';
import { getRandomTetromino } from '@/lib/tetrominos';
const PLAYER_NAME = 'Player';

export function TetrisGame() {
  const [gameState, setGameState] = useState<GameState>(() => getInitialGameState(PLAYER_NAME));
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const isGameStarted = useRef(false);
  
  // Game controls
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isGameStarted.current) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        setGameState(prev => movePiece(prev, 'left'));
        break;
      case 'ArrowRight':
        setGameState(prev => movePiece(prev, 'right'));
        break;
      case 'ArrowDown':
        setGameState(prev => movePiece(prev, 'down'));
        break;
      case 'ArrowUp':
        setGameState(prev => rotateCurrentPiece(prev));
        break;
      case ' ':
        e.preventDefault();
        setGameState(prev => hardDrop(prev));
        break;
      case 'p':
      case 'P':
        setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
        break;
    }
  }, []);

  // Start game
  const startGame = () => {
    isGameStarted.current = true;
    setGameState(getInitialGameState(PLAYER_NAME));
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
      case 'I': return [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]];
      case 'O': return [[1,1],[1,1]];
      case 'T': return [[0,1,0],[1,1,1],[0,0,0]];
      case 'S': return [[0,1,1],[1,1,0],[0,0,0]];
      case 'Z': return [[1,1,0],[0,1,1],[0,0,0]];
      case 'J': return [[0,0,1],[1,1,1],[0,0,0]];
      case 'L': return [[1,0,0],[1,1,1],[0,0,0]];
    }
    throw new Error(`Unknown piece type: ${type}`);
  };
  // Save stats on game over
  useEffect(() => {
    if (gameState.gameOver) {
      saveGameStats(PLAYER_NAME, gameState.score, gameState.level, gameState.linesCleared);
    }
  }, [gameState.gameOver]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#0a0a10',
      color: '#fff',
      fontFamily: 'Arial, sans-serif',
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', textShadow: '0 0 10px #0ff' }}>
        TETRIS
      </h1>

      {!isGameStarted.current && (
        <button
          onClick={startGame}
          style={{
            padding: '15px 40px',
            fontSize: '1.2rem',
            backgroundColor: '#0f0',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Start Game
        </button>
      )}

      {isGameStarted.current && (
        <div style={{ position: 'relative' }}>
          <Board board={gameState.board} />
          
          {gameState.currentPiece && !gameState.gameOver && (
            <PieceRenderer currentPiece={gameState.currentPiece} />
          )}

          {/* Side panel */}
          <div style={{
            position: 'absolute',
            right: '-200px',
            top: 0,
            width: '180px',
            backgroundColor: '#1a1a2e',
            padding: '15px',
            borderRadius: '8px',
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Next:</h3>
            <div style={{ marginBottom: '15px' }}><PreviewPiece type={gameState.nextPiece} /></div>
            <p><strong>Score:</strong> {gameState.score}</p>
            <p><strong>Level:</strong> {gameState.level}</p>
            <p><strong>Lines:</strong> {gameState.linesCleared}</p>
            <p><strong>Pieces:</strong> {gameState.piecesCleared}</p>

            {gameState.isPaused && !gameState.gameOver && (
              <div style={{ marginTop: '15px', color: '#ff0', fontWeight: 'bold' }}>
                PAUSED
              </div>
            )}

            {gameState.gameOver && (
              <button
                onClick={startGame}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '15px',
                  backgroundColor: '#f00',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Play Again
              </button>
            )}

            <div style={{ marginTop: '15px', fontSize: '0.8rem', color: '#aaa' }}>
              Controls:<br/>
              ← → Move<br/>
              ↑ Rotate<br/>
              ↓ Soft Drop<br/>
              Space Hard Drop<br/>
              P Pause
            </div>
          </div>
        </div>
      )}

      {gameState.gameOver && (
        <div style={{ marginTop: '20px' }}>
          <h2 style={{ color: '#f00' }}>GAME OVER</h2>
          <p>Final Score: {gameState.score}</p>
          <p>Level: {gameState.level}</p>
          <p>Lines Cleared: {gameState.linesCleared}</p>
        </div>
      )}
    </div>
  );

}


export default TetrisGame;
