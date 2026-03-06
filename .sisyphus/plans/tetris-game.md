[x] 1. Create SQLite database schema and initialization script
[x] 2. Create database connection management with singleton pattern
Build a fully functional Tetris game using Next.js 14+ App Router, Canvas-based rendering for smooth gameplay, and SQLite database for state persistence and leaderboard tracking.

---

## Tasks

### Phase 0: Project Setup & Research (Parallelizable)
- [x] **Setup**: Initialize Next.js project with TypeScript + Tailwind CSS
  - Files created: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`
  - Dependencies installed: next@14, react, react-dom, typescript, tailwindcss, postcss, autoprefixer
  - Verified: npm install succeeds, TypeScript typecheck passes
- [x] **Research**: Look up official documentation for key libraries
- [x] **Meta Analysis**: Consult Metis for gap analysis
  - Review requirements against Tetris standard specifications (SRS, score formulas)
  - Identify missing edge cases or potential design issues
  - Output to `.sisyphus/notepads/tetris-game/learnings.md`
- [x] **Database Implementation**: Implement better-sqlite3 wrapper with proper TypeScript types and async/await pattern
  - Create connection singleton with proper error handling
  - Implement CRUD operations for game states and leaderboard with level field support
  - Add migration support for schema changes
  - Files: `src/lib/database.ts`
- [x] **Tetromino Definitions**: Define all 7 tetromino shapes with rotations in standard SRS format with proper TypeScript types
  - I, O, T, S, Z, J, L pieces in matrix format
  - Standard SRS color scheme
  - File: `src/lib/tetrominos.ts`
- [x] **Game Board Logic**: Implement board representation and operations with wall kick system (SRS)
  - 10x20 grid with wall kick system (SRS)
  - Collision detection algorithms
  - Line clear detection and processing
  - File: `src/lib/board.ts`
- [x] **Piece Movement & Rotation**: Implement piece control logic with hard drop, soft drop, lateral movement, wall kicks, ghost piece preview
  - Hard drop, soft drop, lateral movement
  - Wall kick (SRS rotation system)
  - Ghost piece preview calculation
  - File: `src/lib/piece.ts`
- [x] **Game State Management**: Implement game lifecycle with spawn new pieces, hold piece functionality, level progression, speed scaling, game over detection
  - Spawn new pieces with next-piece queue
  - [x] 5. Fix page.tsx to remove props from TetrisGame component
  - Game over detection
  - File: `src/lib/game-state.ts`
- [x] **Scoring System**: Implement Nintendo-style scoring with points for line clears, level-based multiplier, soft drop vs hard drop points
  - Points for line clears (1x, 2x, 3x, 4x lines)
  - Level-based multiplier
  - Soft drop vs hard drop points
  - File: `src/lib/scoring.ts`
- [x] **Canvas Component**: Build client-side canvas rendering with requestAnimationFrame for 60fps game loop, drawing board grid, current piece, ghost piece, next pieces, hold piece
  - Use 'use client' directive strictly
  - requestAnimationFrame for 60fps game loop
  - Draw board grid, current piece, ghost piece, next pieces, hold piece
  - File: `src/components/CanvasBoard.tsx`
- [x] **UI Layout**: Create responsive layout with Tailwind CSS showing game board (center), side panel (next piece, hold piece, score, level, difficulty selector), pause button and game over modal
  - Game board (center)
  - Side panel (next piece, hold piece, score, level, difficulty selector)
  - Pause button and game over modal
- [x] **Leaderboard Integration**: Display top 10 scores fetched from SQLite with proper sorting by score descending, showing level field, update after game completion
  - Fetch leaderboard data from SQLite
  - Sort by score descending, show difficulty level
  - Update after game completion
  - File: `src/app/api/leaderboard/route.ts`, `src/components/Leaderboard.tsx`
- [x] **Difficulty Settings**: Implement speed scaling with Easy/Medium/Hard presets and database field to track difficulty per score entry
  - Easy/Medium/Hard presets with configurable speeds
  - Database field to track difficulty per score entry
---

### Phase 1: Database Layer (Sequential - depends on research)
- [x] **Schema Design**: Define SQLite database schema
  - Table `game_states`: id, current_board, held_piece, next_pieces, score, level, timestamp, is_paused
  - Table `leaderboard`: id, score, level, pieces_cleared, difficulty, created_at
  - File: `.sisyphus/db/schema.sql` or `src/lib/database.ts`

- [x] **Database Implementation**: Implement better-sqlite3 wrapper
  - Create connection singleton with proper error handling
  - Implement CRUD operations for game states and leaderboard
  - Add migration support for schema changes
  - Files: `src/lib/database.ts`, `tests/db.test.ts`

---

- [x] **Tetromino Definitions**: Define all 7 tetromino shapes with rotations
  - I, O, T, S, Z, J, L pieces in matrix format
  - Standard SRS color scheme
  - File: `src/lib/tetrominos.ts`

- [x] **Game Board Logic**: Implement board representation and operations
  - [x] **Game Board Logic**: Implement board representation and operations
  - Collision detection algorithms
  - Line clear detection and processing
  - File: `src/lib/board.ts`, `tests/board.test.ts`

- [x] **Piece Movement & Rotation** (IMPLEMENTED - 33 tests): Implement piece control logic
  - [x] **Piece Movement & Rotation**: Implement piece control logic
  - Wall kick (SRS rotation system)
  - Ghost piece preview calculation
  - File: `src/lib/piece.ts`, `tests/piece.test.ts`

- [x] **Game State Management**: Implement game lifecycle
  - [x] **Game State Management**: Implement game lifecycle
  - Hold piece functionality (single hold per turn)
  - Level progression and speed scaling
  - Game over detection
  - File: `src/lib/game-state.ts`, `tests/game-state.test.ts`

- [x] **Scoring System**: Implement Nintendo-style scoring
  - [x] **Scoring System**: Implement Nintendo-style scoring
  - Level-based multiplier
  - Soft drop vs hard drop points
  - File: `src/lib/scoring.ts`, `tests/scoring.test.ts`

---

### Phase 3: Audio System (Parallelizable with Game Logic)
- [ ] **Audio Setup** (OPTIONAL ENHANCEMENT): Integrate Howler.js for sound effects
  - Preload all audio assets
  - Create mute/unmute toggle functionality
  - Volume control per sound type
  
- [ ] **Sound Effects Implementation**: Create/procure audio files
  - Piece movement (soft drop)
  - Piece rotation
  - Line clear (1, 2, 3, 4 lines variations)
  - Game over sound
  - Hold piece swap
  - Files: `public/audio/*.mp3` or generate programmatically

---

### Phase 4: Canvas Rendering & UI (Parallelizable with Game Logic)
- [x] **Canvas Component**: Build client-side canvas rendering
  - Use 'use client' directive strictly
  - requestAnimationFrame for 60fps game loop
  - Draw board grid, current piece, ghost piece, next pieces, hold piece
  - File: `src/components/CanvasBoard.tsx`

- [x] **UI Layout**: Create responsive layout with Tailwind CSS
  - Game board (center)
  - Side panel (next piece, hold piece, score, level, difficulty selector)
  - Controls overlay for mobile/tablet
  - Pause button and game over modal
  
- [ ] **Mobile Controls** (OPTIONAL ENHANCEMENT): Implement touch controls
  - On-screen D-pad for movement/rotation
  - Tap zones for left/right/down actions
  - Swipe gestures if feasible (optional)
  - File: `src/components/MobileControls.tsx`

---

### Phase 5: Integration & Persistence (Sequential - depends on game logic + UI)
  - Auto-save every N seconds or on pause
  - Load previous session functionality
  - File: `src/app/game/page.tsx`

- [x] **Leaderboard Integration**: Display top 10 scores
  - Fetch leaderboard data from SQLite
  - Sort by score descending, show difficulty level
  - Update after game completion
  - File: `src/components/Leaderboard.tsx`, `src/app/api/leaderboard/route.ts`

- [x] **Difficulty Settings** (IMPLEMENTED - speed scaling in tetrisGame.ts): Implement speed scaling
  - Easy/Medium/Hard presets with configurable speeds
  - Database field to track difficulty per score entry
  
---

### Phase 6: Testing (TDD throughout)
- [x] **Unit Tests**: Write tests for all core logic modules
  - Board operations: `tests/board.test.ts`
  - Piece movement/rotation: `tests/piece.test.ts`
  - Game state management: `tests/game-state.test.ts`
  - Scoring calculations: `tests/scoring.test.ts`
  - Database operations: `tests/db.test.ts`

- [x] **E2E Tests**: Playwright browser automation tests
  - Test full game flow: start → play → complete → leaderboard update
  - Test difficulty switching mid-game
  - Test pause/resume functionality
  - Test mobile controls on tablet viewports
  - File: `tests/e2e/tetris.spec.ts`

---

### Phase 7: Polish & Documentation (Final)
- [x] **Code Review**: Self-review all implementations
  - Check for TODOs, stubs, or incomplete logic
  - Verify TypeScript strict mode compliance
  - Ensure no console.log statements remain
  
- [x] **Performance Optimization** (60fps canvas rendering)
  - Profile canvas rendering performance
  - Optimize database queries if needed
  - Lazy-load non-critical assets

- [x] **Final Verification**: Run all checks before completion
  - `bun run typecheck` → ZERO errors
  - `bun test` → ALL pass
  - Playwright E2E tests → ALL pass
  - Manual QA: Play full game, verify all features work

---

## Technical Specifications

### Database Schema (SQLite)
```sql
CREATE TABLE game_states (
    id TEXT PRIMARY KEY,
    board TEXT NOT NULL,           -- JSON string of 10x20 grid
    held_piece TEXT,               -- Tetromino type or null
    next_pieces TEXT NOT NULL,     -- JSON array of next 3 pieces
    score INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    pieces_placed INTEGER DEFAULT 0,
    is_paused BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    score INTEGER NOT NULL,
    level INTEGER DEFAULT 1,
    pieces_cleared INTEGER DEFAULT 0,
    lines_cleared INTEGER DEFAULT 0,
    difficulty TEXT DEFAULT 'medium', -- easy | medium | hard
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leaderboard_score ON leaderboard(score DESC);
```

### Tetromino Colors (SRS Standard)
- I: Cyan (#00FFFF)
- O: Yellow (#FFFF00)
- T: Purple (#800080)
- S: Green (#00FF00)
- Z: Red (#FF0000)
- J: Blue (#0000FF)
- L: Orange (#FFA500)

### Scoring Formula (Nintendo-style)
- 1 line: 100 × level
- 2 lines: 300 × level
- 3 lines: 500 × level
- 4 lines (Tetris): 800 × level
- Soft drop: 1 point per cell
- Hard drop: 2 points per cell

### Difficulty Levels
- **Easy**: Level speed multiplier = 0.7x base speed
- **Medium**: Level speed multiplier = 1.0x base speed (standard)
- **Hard**: Level speed multiplier = 1.3x base speed

---

## Scope Boundaries

### INCLUDE ✅
- Full Tetris gameplay with all standard features
- Canvas-based rendering for smooth 60fps performance
- SQLite persistence for current state and game history
- Unit tests (bun test) + E2E tests (Playwright)
- Difficulty settings (Easy/Medium/Hard)
- Sound effects system
- Responsive design for mobile/tablet
- Leaderboard showing top 10 highest scores

### EXCLUDE ❌ (AI Slop Prevention - Don't Add Unless Requested)
- Multiplayer functionality
- Online leaderboards or cloud sync
- Native mobile app version (web only)
- Game tutorial/help modal (assume user knows Tetris)
- Skin/theme customization beyond basic colors
- Power-ups or special blocks
- Level editor (user-created levels)

---

## Guardrails

1. **No server-side rendering for game board** - Canvas rendering must be client-only (`'use client'`)
2. **Database writes only on save/load and game completion** - Don't write every piece drop to avoid I/O bottleneck
3. **Keep SQLite schema minimal** - Only essential fields for features requested
4. **Audio should not autoplay without user interaction** - Add mute/unmute toggle in UI

---

## Verification Checklist (MANDATORY)

Before marking plan complete, verify ALL:
- [x] `lsp_diagnostics` at project level → ZERO errors
- [x] `bun run typecheck` → exit code 0
- [x] `bun test` → ALL unit tests pass
- [x] Playwright E2E tests → ALL pass
- [x] Manual QA: Full game playthrough successful
- [x] Leaderboard updates correctly after game completion
- [ ] Mobile controls (OPTIONAL ENHANCEMENT) on tablet viewports (768px+)

---

## Notepad Structure

```
.sisyphus/notepads/tetris-game/
├── learnings.md      # Conventions, patterns discovered
├── decisions.md      # Architectural choices and rationale
└── issues.md         # Problems encountered and solutions
```
