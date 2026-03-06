-- Tetris Game Database Schema
-- Version: 1.0.0
-- Description: SQLite schema for game state persistence and leaderboard tracking

-- ============================================================================
-- TABLE: high_scores
-- Purpose: Stores completed game scores for high score tracking across difficulty levels
-- ============================================================================
CREATE TABLE IF NOT EXISTS high_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT NOT NULL DEFAULT 'Player',
    score INTEGER NOT NULL DEFAULT 0,
    level INTEGER DEFAULT 1 CHECK(level >= 1 AND level <= 9),
    lines_cleared INTEGER DEFAULT 0 CHECK(lines_cleared >= 0),
    difficulty TEXT DEFAULT 'medium' NOT NULL CHECK(difficulty IN ('easy', 'medium', 'hard')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Composite index for efficient leaderboard queries by difficulty
    UNIQUE(player_name, score, difficulty)
);

-- Index on difficulty for filtering high scores by game mode
CREATE INDEX IF NOT EXISTS idx_high_scores_difficulty ON high_scores(difficulty);

-- Index on score within each difficulty level (top performers query optimization)
CREATE INDEX IF NOT EXISTS idx_high_scores_diff_score ON high_scores(difficulty, score DESC);

-- ============================================================================
-- TABLE: game_statistics
-- Purpose: Aggregated game statistics for analytics and player progression tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS game_statistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total_games_played INTEGER DEFAULT 0 CHECK(total_games_played >= 0),
    total_lines_cleared INTEGER DEFAULT 0 CHECK(total_lines_cleared >= 0),
    total_score INTEGER DEFAULT 0 CHECK(total_score >= 0),
    highest_score INTEGER DEFAULT 0 CHECK(highest_score >= 0),
    hardest_level_reached INTEGER DEFAULT 1 CHECK(hardest_level_reached >= 1 AND hardest_level_reached <= 9),
    games_by_difficulty TEXT DEFAULT '{}',  -- JSON: {"easy": N, "medium": N, "hard": N}
    lines_by_difficulty TEXT DEFAULT '{}',   -- JSON: {"easy": N, "medium": N, "hard": N}
    last_played DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to auto-update updated_at timestamp (SQLite workaround for ON UPDATE)
CREATE TRIGGER IF NOT EXISTS update_game_statistics_timestamp 
AFTER UPDATE ON game_statistics
BEGIN
    UPDATE game_statistics SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================================================
-- TABLE: user_settings
-- Purpose: User preferences and customizable gameplay settings
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT CHECK(id = 1),  -- Enforce single row
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Check constraints for valid settings keys
    CONSTRAINT valid_settings_key CHECK(key IN (
        'volume_master',
        'volume_music', 
        'volume_sfx',
        'difficulty_default',
        'controls_layout',
        'show_grid',
        'hold_enabled',
        'hard_drop_initial',
        'ghost_piece'
    ))
);

-- Default settings initialization (insert only if no rows exist)
INSERT OR IGNORE INTO user_settings (id, key, value) VALUES 
    (1, 'volume_master', '0.8'),
    (1, 'volume_music', '0.6'),
    (1, 'volume_sfx', '0.9'),
    (1, 'difficulty_default', 'medium'),
    (1, 'controls_layout', 'standard'),
    (1, 'show_grid', 'true'),
    (1, 'hold_enabled', 'true'),
    (1, 'hard_drop_initial', 'false'),
    (1, 'ghost_piece', 'true');

-- Index for quick setting lookups by key
CREATE INDEX IF NOT EXISTS idx_user_settings_key ON user_settings(key);
