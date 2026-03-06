## API Route Created

**Date**: 2026-03-06
**File**: src/app/api/leaderboard/route.ts

### Implementation Details
- Created Next.js 14 App Router API route with GET and POST endpoints
- GET: Returns top 10 scores using getHighScores(10)
- POST: Accepts {name, score, level, linesCleared}, validates input, saves to database

### Key Points
- Path alias in tsconfig.json maps '@/*' to './*' (root), not './src/*'
- Import path must be '@/src/lib/database' from src/ directory
- Uses getDb() internally through database functions
- Error handling with proper HTTP status codes (400, 500)

### Build Verification
- npm run build: PASSED
- No TypeScript errors

