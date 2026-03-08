# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js-based Tetris game with SQLite database for high score persistence. Uses React hooks for state management and canvas-based rendering.

## Commands

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm test             # Run unit tests (Jest)
npm run test:e2e     # Run end-to-end tests (Playwright)
npm run db:init      # Initialize/reset SQLite database
```

## Architecture

### Directory Structure

- **`app/`** - Next.js App Router pages and API routes
  - `api/scores/route.ts` - REST API for high scores (GET/POST/DELETE)
  - `page.tsx`, `layout.tsx` - Main application entry points
- **`components/`** - React UI components
  - `TetrisGame.tsx` - Main game container with game loop and controls
  - `Board.tsx`, `PieceRenderer.tsx` - Canvas rendering components
  - `GameLogic.ts` - Game state mutation functions (movement, rotation, collision)
  - `Tetrominoes.ts` - Piece definitions (shapes, colors, wall kick data)
- **`hooks/`** - React hooks
  - `useTouchGestures.ts` - Touch gesture recognition (swipe, tap, double tap, long press)
  - `useVibration.ts` - Haptic feedback hook using Vibration API
- **`lib/`** - Core game logic and utilities
  - `tetrisGame.ts` - Complete game engine with SRS (Super Rotation System)
  - `game.ts` - Alternative game state management
  - `board.ts` - Board representation and collision detection
  - `database.ts` - SQLite operations using sql.js
- **`src/`** - Duplicate/alternate implementation structure
  - Mirrors `lib/` and `components/` with some variations
- **`data/`** - SQLite database storage (`tetris.db`)
- **`scripts/`** - Database setup utilities

### Game Engine

The game uses a gravity-based game loop with the following systems:

1. **Piece Queue**: 7-bag randomizer for fair piece distribution
2. **SRS Rotation**: Standard wall kick tables for J/L/S/T/Z/I pieces
3. **Scoring**: Nintendo formula (100/300/500/800 × level for 1-4 lines)
4. **Level System**: Level increases every 10 lines, drop speed increases
5. **Hold Piece**: One hold per turn, stored in game state

### Database Schema

Two tables managed by `src/lib/database.ts`:

```sql
-- Leaderboard for high scores
CREATE TABLE leaderboard (
  id INTEGER PRIMARY KEY,
  player_name TEXT,
  score INTEGER,
  level INTEGER,
  pieces_cleared INTEGER,
  lines_cleared INTEGER,
  difficulty TEXT,
  created_at DATETIME
)

-- Save/resume game state
CREATE TABLE game_states (
  id TEXT PRIMARY KEY,
  current_board TEXT,        -- JSON 10x20 grid
  held_piece TEXT,
  next_pieces TEXT,          -- JSON array of next 3 pieces
  score INTEGER,
  level INTEGER,
  pieces_placed INTEGER,
  is_paused BOOLEAN,
  created_at/updated_at DATETIME
)
```

### Key Interfaces

```typescript
interface GameState {
  board: Grid              // 10x20 cell grid
  currentPiece: Piece      // Active piece or null
  nextPieces: TetrominoType[]  // Queue of next 3 pieces
  holdPiece: TetrominoType | null
  score: number
  level: number
  linesCleared: number
  gameOver: boolean
  paused: boolean
}
```

### Controls

**Keyboard:**
- **Arrow Left/Right**: Move piece
- **Arrow Up**: Rotate clockwise (with wall kicks)
- **Arrow Down**: Soft drop
- **Space**: Hard drop (instant placement)
- **P**: Pause game
- **C**: Hold piece

**Touch/Gesture (Mobile/Tablet):**
- **Swipe Left/Right**: Move piece
- **Swipe Down**: Soft drop
- **Single Tap**: Rotate piece
- **Double Tap**: Hard drop
- **Two-finger Tap**: Pause/Unpause
- **Long Press (500ms)**: Hold piece

**Virtual Buttons:**
- On-screen D-pad buttons for left/right/down/rotate
- Hard Drop button
- Hold and Pause buttons
- Auto-shown on mobile devices, can be toggled

## Touch Control Implementation

### Files
- `hooks/useTouchGestures.ts` - Gesture recognition hook (swipe, tap, double tap, long press)
- `hooks/useVibration.ts` - Haptic feedback using Vibration API
- `components/TouchControls.tsx` - Virtual button components
- `components/GameBoard.tsx` - Board with integrated touch gesture support
- `components/TetrisGame.tsx` - Main game component integrating all controls

### Gesture Detection
- Swipe threshold: 30px minimum distance
- Double tap window: 300ms between taps
- Long press delay: 500ms
- Prevents default browser scrolling with `touch-action: none`

### Responsive Layout
- Mobile (< 640px): Vertical layout, touch controls shown by default
- Tablet (640px - 1024px): Side-by-side layout, gesture + button support
- Desktop (> 1024px): Keyboard-focused, touch controls hidden

## Testing

- **Unit tests** (`tests/*.test.ts`): Board, piece, and scoring logic
- **E2E tests** (`tests/e2e/*.spec.ts`): Playwright tests against dev server

Run single test: `npm test -- --testNamePattern="scoring"`

## Notes

- Database file location: `./data/tetris.db`
- The codebase has dual implementations: root-level (`components/`, `lib/`) and `src/` directory
- `src/lib/tetrisGame.ts` contains the complete SRS implementation
- `components/GameLogic.ts` has an alternative, simplified game logic
- The app uses `better-sqlite3` for server-side database and `sql.js` for browser-compatible operations
