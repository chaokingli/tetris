
---

## High Scores API Route Implementation

### Files Created
- `src/app/api/high-scores/route.ts` - API route for high scores CRUD operations
- `src/lib/database-setup.ts` - Database connection management with singleton pattern

### GET Endpoint
- **URL**: `/api/high-scores`
- **Query Params**: Optional `difficulty` (easy/medium/hard)
- **Returns**: Top 10 scores ordered by score DESC
- **Filtering**: When difficulty provided, returns top 10 for that difficulty

### POST Endpoint  
- **Body**: `{ player_name: string, score: number, difficulty: 'easy'|'medium'|'hard' }`
- **Validation**: 
  - `player_name`: required, non-empty string
  - `score`: required, positive integer
  - `difficulty`: required, one of easy/medium/hard
- **Returns**: Success response with inserted ID and updated top 10 list

### HTTP Status Codes
- 200: Success (GET or successful POST)
- 400: Validation error (invalid input data)
- 500: Server error (database issues, etc.)

### Design Patterns Used
- Next.js App Router conventions (GET/POST functions in route.ts)
- Singleton pattern for database connection via getDb()
- Proper error handling without exposing internal errors to clients
- better-sqlite3 synchronous operations within async handlers
