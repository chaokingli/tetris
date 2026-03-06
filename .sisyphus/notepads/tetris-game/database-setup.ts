# Tetris Game Database Setup

This file contains the database initialization and connection management code for the Tetris game.

## Overview

The database setup uses **better-sqlite3** (synchronous, reliable) with a singleton pattern to prevent multiple connections in development mode. It initializes tables from schema.sql on first run and handles edge cases like missing database files or permission errors.

---

## Code Implementation

```typescript
// File: .sisyphus/notepads/tetris-game/database-setup.ts
// Purpose: Database initialization and connection management for Tetris game

import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { readFileSync } from 'fs';

const DB_PATH = join(process.cwd(), './data/tetris.db');
const SCHEMA_PATH = join(__dirname, '../.sisyphus/notepads/tetris-game/schema.sql');

// Singleton pattern - prevent multiple connections in development
let db: Database.Database | null = null;

/**
 * Initialize database directory if it doesn't exist
 */
function ensureDatabaseDir(): void {
  const dir = dirname(DB_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Get or initialize the database connection (singleton pattern)
 * @returns Database instance
 * @throws Error if database cannot be initialized
 */
export function getDb(): Database.Database {
  if (!db) {
    try {
      ensureDatabaseDir();
      
      const sqlite = new Database(DB_PATH);
      
      // Enable foreign keys (good practice)
      sqlite.pragma('foreign_keys = ON') as { foreign_keys: number };
      
      // Initialize tables from schema.sql on first run
      initializeTables(sqlite);
      
      db = sqlite;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('permission')) {
        throw new Error(
          `Database permission error: Cannot write to ${DB_PATH}. ` +
          'Check file system permissions and ensure the directory is writable.'
        );
      } else if (errorMessage.includes('unable to open database')) {
        throw new Error(
          `Cannot create database at ${DB_PATH}: ${errorMessage}`
        );
      } else {
        throw new Error(`Failed to initialize database: ${errorMessage}`);
      }
    }
  }
  
  return db;
}

/**
 * Initialize database tables from schema.sql
 * @param db - Database instance to initialize
 */
function initializeTables(db: Database.Database): void {
  try {
    const schema = readFileSync(SCHEMA_PATH, 'utf-8');
    
    // Execute schema in separate transactions for better error handling
    const statements = schema.split(';').filter(s => s.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        db.exec(statement);
      }
    }
    
    console.log('Database initialized successfully from schema.sql');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('no such file')) {
      throw new Error(`Schema file not found: ${SCHEMA_PATH}. ${errorMessage}`);
    } else {
      throw new Error(`Failed to initialize tables from schema.sql: ${errorMessage}`);
    }
  }
}

/**
 * Close the database connection
 */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Check if database exists
 * @returns boolean indicating if database file exists
 */
export function databaseExists(): boolean {
  return existsSync(DB_PATH);
}

// Export for Next.js App Router compatibility
// These are server-side functions only - do not import in client components
```

---

## Usage Examples

### In API Routes (Server-Side)

```typescript
import { getDb, closeDb } from './database-setup';

export async function GET() {
  try {
    const db = getDb();
    
    // Query high scores
    const stmt = db.prepare('SELECT * FROM high_scores ORDER BY score DESC LIMIT 10');
    const scores = stmt.all();
    
    return Response.json(scores);
  } finally {
    closeDb();
  }
}
```

### In Server Components (Next.js App Router)

```typescript
import { getDb } from './database-setup';

export default async function HighScores() {
  const db = getDb();
  
  const stmt = db.prepare('SELECT * FROM high_scores ORDER BY score DESC LIMIT 5');
  const scores = stmt.all();
  
  return (
    <div>
      {scores.map((score: any) => (
        <div key={score.id}>{score.player_name}: {score.score}</div>
      ))}
    </div>
  );
}
```

---

## Error Handling Patterns

### Missing Database File
The `ensureDatabaseDir()` function creates the data directory automatically if it doesn't exist.

### Permission Errors
Caught and re-thrown with descriptive messages including the problematic path.

### Schema File Missing
If schema.sql is not found, a clear error message indicates the missing file path.

---

## Next.js App Router Considerations

1. **Server-Side Only**: This module must only be imported in:
   - API route handlers (`app/api/**/*.ts`)
   - Server components (no `'use client'` directive)
   - Server actions
   
2. **No Client Imports**: Never import this in components with `'use client'`

3. **Singleton Benefits**: The singleton pattern prevents multiple database connections during hot-reload development mode.

4. **Synchronous Operations**: better-sqlite3 is synchronous, which works perfectly with Next.js App Router server-side rendering.

---

## File Structure

```
game-tetris/
├── .sisyphus/notepads/tetris-game/
│   ├── schema.sql           # Database table definitions
│   └── database-setup.ts    # This file - DB initialization code
├── data/
│   └── tetris.db            # SQLite database (created automatically)
└── src/
    └── lib/
        └── database.ts      # Alternative implementation in project
```

---

## Version History

- **1.0.0** - Initial setup with better-sqlite3, singleton pattern, and comprehensive error handling
