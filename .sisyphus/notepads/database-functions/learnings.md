## database-functions

### Task: Add missing database functions to `/src/lib/database.ts`

**Date:** March 2, 2026

#### Functions Added/Fixed:

1. **`insertScore(playerName: string, score: number): Promise<void>`**
   - Inserts a new high score into the leaderboard table with player name and score
   - Uses parameterized query to prevent SQL injection
   - Difficulty defaults to 'medium'

2. **`getAllScores(): Promise<Array<{id: number; player_name: string; score: number}>>`**
   - Retrieves all scores ordered by highest first (DESC)
   - Limited to top 100 results
   - Returns proper TypeScript types matching API response format

#### Schema Changes:
- Added `player_name TEXT DEFAULT 'Anonymous'` column to leaderboard table schema
- This was required because the original schema didn't include player names but functions expected it

#### Issues Encountered:
1. Original `insertScore` function signature existed but body didn't accept or use the playerName parameter
2. Original `getAllScores` referenced non-existent `player_name` column in SELECT statement  
3. The `closeDb` function was malformed with missing closing parenthesis and return type
4. SQL string syntax errors due to missing backticks and parentheses

#### Patterns Used:
- Consistent with existing code style (better-sqlite3 prepare/stmt.run pattern)
- Parameterized queries for SQL injection prevention
- Proper TypeScript typing with inline object types for query results
- Descriptive JSDoc comments before each exported function
