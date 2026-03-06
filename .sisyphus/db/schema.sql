-- Tetris Game Database Schema
-- Version: 1.0.0
-- Description: SQLite schema for game state persistence and leaderboard tracking

-- Table: game_states
-- Stores active/paused game states for resuming gameplay
CREATE TABLE IF NOT EXISTS game_states (
    id TEXT PRIMARY KEY,
    current_board TEXT NOT NULL,        -- JSON string of 10x20 grid (row-major 2D array)
    held_piece TEXT,                    -- Tetromino type or null
    next_pieces TEXT NOT NULL,          -- JSON array of next 3 pieces
    score INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    pieces_placed INTEGER DEFAULT 0,
    is_paused BOOLEAN DEFAULT 0,        -- 0 = playing, 1 = paused
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: leaderboard
-- Stores completed game scores for high score tracking
CREATE TABLE IF NOT EXISTS leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    score INTEGER NOT NULL,
    level INTEGER DEFAULT 1,
    pieces_cleared INTEGER DEFAULT 0,
    lines_cleared INTEGER DEFAULT 0,
    difficulty TEXT DEFAULT 'medium',   -- easy | medium | hard
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index: Optimized for leaderboard queries (highest scores first)
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);
