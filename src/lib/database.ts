// SQLite database operations using sql.js (works in browser and Node.js)
import initSqlJs, { Database } from 'sql.js';
import { GameState, calculateDropInterval } from './tetrisGame';
import { TetrominoType } from './tetrominos';


const DB_NAME = '/tmp/tetris_scores.db';

let dbInstance: typeof Database | null = null;

export async function getDb(): Promise<any> {
  if (dbInstance) return dbInstance;
  
  const SQL = await initSqlJs({
    locateFile: (file: string) => `/sqljs/${file}`
  });
  try {
    // Try to load existing database or create new one
    let fileBuffer: Uint8Array | undefined;
    
    if (typeof window === 'undefined') {
      // Server-side code
      const fs = require('fs');
      if (fs.existsSync(DB_NAME)) {
        fileBuffer = fs.readFileSync(DB_NAME);
      }
    }
    
    if (fileBuffer) {
      dbInstance = new SQL.Database(fileBuffer);
    } else {
      dbInstance = new SQL.Database();
    }
    
    // Initialize tables
    initializeDatabase(dbInstance);
    return dbInstance;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

function initializeDatabase(db: any): void {
  // Player statistics table
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      score INTEGER NOT NULL,
      level INTEGER DEFAULT 1,
      lines_cleared INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Game records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_name TEXT NOT NULL,
      score INTEGER NOT NULL,
      lines_cleared INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      duration_seconds INTEGER,
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Game state table for save/load functionality
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_states (
      id TEXT PRIMARY KEY,
      board TEXT NOT NULL,
      held_piece TEXT,
      next_pieces TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      lines_cleared INTEGER DEFAULT 0,
      is_paused BOOLEAN DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function saveScoreToDb(name: string, score: number, level: number, linesCleared: number): Promise<boolean> {
  try {
    const db = await getDb();
    db.run(
      'INSERT INTO players (name, score, level, lines_cleared) VALUES (?, ?, ?, ?)',
      [name, score, level, linesCleared]
    );
    return true;
  } catch (error) {
    console.error('Error saving score:', error);
    return false;
  }
}

export async function getHighScores(limit: number = 10): Promise<Array<{id: number, name: string, score: number, level: number, lines_cleared: number, created_at: string}>> {
  try {
    const db = await getDb();
    const results = db.exec(`
      SELECT id, name, score, level, lines_cleared, created_at 
      FROM players 
      ORDER BY score DESC 
      LIMIT ?
    `, [limit]);
    
    if (results.length === 0) return [];
    
    return results[0].values.map((row: any[]) => ({
      id: row[0],
      name: row[1],
      score: row[2],
      level: row[3],
      lines_cleared: row[4],
      created_at: row[5]
    }));
  } catch (error) {
    console.error('Error getting high scores:', error);
    return [];
  }
}

export async function clearAllScores(): Promise<boolean> {
  try {
    const db = await getDb();
    db.run('DELETE FROM players');
    return true;
  } catch (error) {
    console.error('Error clearing scores:', error);
    return false;
  }
}

export async function saveGameRecord(
  playerName: string, 
  score: number, 
  linesCleared: number, 
  level: number,
  durationSeconds: number | null = null
): Promise<number> {
  try {
    const db = await getDb();
    const result = db.run(
      'INSERT INTO game_records (player_name, score, lines_cleared, level, duration_seconds) VALUES (?, ?, ?, ?, ?)',
      [playerName, score, linesCleared, level, durationSeconds]
    );
    
    // Save database to file only on server side
    if (typeof window === 'undefined') {
      const fs = require('fs');
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_NAME, buffer);
    }
    
    return result.lastInsertRowid as number;
  } catch (error) {
    console.error('Error saving game record:', error);
    throw error;
  }
}

export async function saveGameState(state: GameState): Promise<void> {
  try {
    const db = await getDb();
    db.run(
      'INSERT OR REPLACE INTO game_states (id, board, held_piece, next_pieces, score, level, lines_cleared, is_paused, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [
        'current',
        JSON.stringify(state.board),
        state.holdPiece,
        JSON.stringify(state.nextPieces),
        state.score,
        state.level,
        state.linesCleared,
        state.paused ? 1 : 0
      ]
    );
  } catch (error) {
    console.error('Error saving game state:', error);
    throw error;
  }
}

export async function loadGameState(): Promise<GameState | null> {
  try {
    const db = await getDb();
    const results = db.exec('SELECT * FROM game_states WHERE id = ?', ['current']);
    
    if (results.length === 0 || results[0].values.length === 0) {
      return null;
    }
    
    const row = results[0].values[0];
    
    return {
      board: JSON.parse(row[1] as string),
      currentPiece: null,
      nextPieces: JSON.parse(row[3] as string),
      holdPiece: row[2] as TetrominoType | null,
      canHold: true,
      score: row[4] as number,
      level: row[5] as number,
      linesCleared: row[6] as number,
      gameOver: false,
      paused: (row[7] as number) === 1,
      softDropActive: false,
      softDropCells: 0,
      hardDropCells: 0,
      lastDropTime: performance.now(),
      dropInterval: calculateDropInterval(row[5] as number),
      totalDrops: 0
    };
  } catch (error) {
    console.error('Error loading game state:', error);
    return null;
  }
}

export async function deleteGameState(): Promise<void> {
  try {
    const db = await getDb();
    db.run('DELETE FROM game_states WHERE id = ?', ['current']);
  } catch (error) {
    console.error('Error deleting game state:', error);
    throw error;
  }
}


export async function closeDb(): Promise<void> {
  if (dbInstance) {
    // Save database to file only on server side
    if (typeof window === 'undefined') {
      const fs = require('fs');
      try {
        const data = (dbInstance as any).export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_NAME, buffer);
      } catch (error) {
        console.error('Error saving database:', error);
      }
    }
    (dbInstance as any).close();
    dbInstance = null;
  }
}

// Export for testing/debugging
export function getIsServerSide(): boolean {
  return typeof window === 'undefined';
}

export async function getAllScoresAsync(limit: number = 10): Promise<Array<{id: number, name: string, score: number, level: number, lines_cleared: number, created_at: string}>> {
  try {
    const db = await getDb();
    const results = db.exec(
      `SELECT id, name, score, level, lines_cleared, created_at 
       FROM players 
       ORDER BY score DESC 
       LIMIT ?`,
      [limit]
    );
    
    if (results.length === 0) return [];
    
    return results[0].values.map((row: any[]) => ({
      id: row[0],
      name: row[1],
      score: row[2],
      level: row[3],
      lines_cleared: row[4],
      created_at: row[5]
    }));
  } catch (error) {
    console.error('Error getting all scores:', error);
    return [];
  }
}

