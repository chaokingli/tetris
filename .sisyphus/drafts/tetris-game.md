# Draft: Tetris Game with Next.js + SQLite

## Requirements (confirmed)
- **Framework**: Next.js 14+ App Router
- **Rendering**: Canvas-based rendering for game board (performance-focused)
- **Database**: SQLite for persistence
  - Current game state table (for save/load functionality)
  - Game history table (completed games with score, level, pieces_placed, timestamp)

## Features Scope
### Core Mechanics (Must Have)
- [x] Standard Tetris gameplay with 7 tetromino types
- [x] Piece rotation system
- [x] Level system with speed progression
- [x] Scoring system
- [x] Game over detection and handling

### Advanced Features (Must Have)
- [x] Next piece preview panel
- [x] Hold piece functionality  
- [x] Pause/resume capability

## Technical Decisions
- **Test Strategy**: bun test for unit tests + Playwright for E2E testing
- **Database Library**: Need to decide between better-sqlite3 (sync) vs prisma + sqlite (ORM)
- **State Management**: Client-side state with localStorage fallback, database as persistence layer

## Research Findings
- Fresh project - no existing patterns to reference
- Node.js 24.x available in environment
- bun not installed yet but recommended for testing
- Need to install: Next.js 14+, SQLite library, Playwright

## User Decisions (Confirmed)
- **Database Library**: better-sqlite3 ✓
- **Mobile Support**: YES - responsive design with touch controls for mobile/tablet ✓
- **Game Replay**: NO - only final score records, not full move history
- **Leaderboard**: YES - local leaderboard showing top scores from database ✓

## User Decisions (Confirmed)
- **Board Size**: Standard 10×20 cells ✓
- **UI Framework**: Tailwind CSS ✓
- **Difficulty Settings**: Optional (Easy/Medium/Hard) ✓
- **Sound Effects**: YES - piece movement, rotation, line clear, game over ✓
- **Leaderboard Display**: Top 10 highest scores from database ✓

## Scope Boundaries  
### INCLUDE
- Full Tetris gameplay with all standard features
- Canvas-based rendering for smooth 60fps performance
- SQLite persistence for current state and game history
- Unit tests (bun test) + E2E tests (Playwright)
- Difficulty settings with different speed levels
- Sound effects system
- Responsive design for mobile/tablet

### EXCLUDE (AI Slop Prevention - Don't Add Unless Requested)
- Multiplayer functionality
- Online leaderboards
- Mobile app version (web only)
- Game tutorial/help modal (assume user knows Tetris)
- Skin/theme customization beyond basic colors
- Power-ups or special blocks
- Level editor (user-created levels)

## Guardrails
1. **No server-side rendering for game board** - Canvas rendering must be client-only (use 'use client')
2. **Database writes only on save/load and game completion** - Don't write every piece drop
3. **Keep SQLite schema minimal** - Only essential fields for features requested
4. **Audio should not autoplay without user interaction** - Add mute/unmute toggle
- **Automated tests**: YES (TDD workflow)
- **Framework**: bun test (faster than jest, native support in newer Node.js)
- **E2E Testing**: Playwright for browser automation and canvas interaction testing
