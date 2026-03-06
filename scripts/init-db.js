#!/usr/bin/env node

/**
 * Database Setup Script for Tetris Game SQLite Database
 */

const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, '../data/tetris.db');

// Create data directory if it doesn't exist
if (!fs.existsSync('./data')) {
  console.log('Creating ./data directory...');
  fs.mkdirSync('./data', { recursive: true });
}

console.log(`Database path: ${DB_PATH}`);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
});

// Create game_states table for saving/resuming games
db.run(`
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
  )
`);

console.log('✓ Created game_states table');

// Create leaderboard table for high scores
db.run(`
  CREATE TABLE IF NOT EXISTS leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT DEFAULT 'Anonymous',
    score INTEGER NOT NULL,
    level INTEGER DEFAULT 1,
    pieces_cleared INTEGER DEFAULT 0,
    lines_cleared INTEGER DEFAULT 0,
    difficulty TEXT DEFAULT 'medium',   -- easy | medium | hard
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('✓ Created leaderboard table');

// Create index for efficient leaderboard queries (highest scores first)
db.run(`
  CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC)
`);

console.log('✓ Created index on score column');

// Clear demo data if exists (for fresh start)
db.run("DELETE FROM leaderboard WHERE id > 0", function(err) {
  if (err) {
    console.error('Error clearing records:', err.message);
  } else {
    console.log(`✓ Cleared existing records for fresh start`);
  }
  
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
      process.exit(1);
    }
    
    console.log('\n✅ Database setup complete!');
    console.log('Location:', DB_PATH);
  });
});
