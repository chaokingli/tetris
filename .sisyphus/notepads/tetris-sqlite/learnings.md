# Tetris SQLite Implementation Learnings

## Date: 2026-03-02

### Key Patterns Used

1. **better-sqlite3 Synchronous API**
   - Uses `new Database(path)` for connection initialization
   - All operations are synchronous (prepare, exec, run, all)
   - Requires `esModuleInterop` in tsconfig for default import

2. **WAL Mode for Concurrency**
   ```typescript
   db.pragma('journal_mode = WAL');
   ```
   - Enables better concurrent read/write performance
   - Essential for Next.js API routes that may handle multiple requests

3. **Lazy Database Initialization**
   - Singleton pattern with module-level `db` variable
   - Database created on first `getDb()` call
   - Prevents connection exhaustion in development

4. **Graceful Shutdown**
   ```typescript
   process.on('exit', () => closeDb());
   process.on('SIGINT', () => { closeDb(); process.exit(130); });
   process.on('SIGTERM', () => { closeDb(); process.exit(143); });
   ```
   - Ensures database connection closes cleanly on shutdown

### Schema Design

```sql
CREATE TABLE leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

- `id`: Auto-incrementing primary key for performance
- `player_name`: Player identifier (required)
- `score`: Game score (required)
- `level`: Current game level (defaults to 1)
- `timestamp`: Automatic datetime on insert

### Exported Functions

| Function | Purpose |
|----------|---------|
| `getDb()` | Returns singleton Database instance, initializes if needed |
| `getAllScores()` | Returns top 10 scores ordered by score DESC |
| `saveScore(playerName, score, level)` | Inserts new score, returns row ID |
| `closeDb()` | Closes database connection safely |

### File Locations

- **Database file**: `data/tetris.db` (created on first use)
- **Module**: `lib/db.ts`
- **Next.js compatible**: Uses ESM import syntax
