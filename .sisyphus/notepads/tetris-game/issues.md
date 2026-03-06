# Tetris Game Issues - Phase 2 Review
**Date:** 2026-03-02  
**Reviewed by:** Sisyphus-Junior

---

## 🔴 CRITICAL: tetrisGame.ts - Core Game Logic Missing ENTIRELY

### Issue Summary
The file `src/lib/tetrisGame.ts` contains **only localStorage score saving**. The entire Tetris game engine is missing!

### Required Components (ALL MISSING):
- [ ] Board representation (10x20 grid)
- [ ] Collision detection system
- [ ] Line clear detection and handling
- [ ] Piece movement (left, right, soft drop, hard drop)
- [ ] Piece rotation with SRS wall kicks
- [ ] Spawn new piece logic
- [ ] Hold piece functionality
- [ ] Level progression system
- [ ] Nintendo-style scoring calculation

### Impact: **GAME IS NOT PLAYABLE**

---

## 🔴 CRITICAL: tetrominoes.ts - Missing SRS Wall Kick Tables

### Issue Summary
Tetromino shapes are defined but **NO WALL KICK DATA** for Super Rotation System. Without this, pieces will get stuck at walls when rotating.

### Required Data (MISSING):
```typescript
// Each piece needs kick tables like:
const I_KICKS = [
  {x: 0, y: 0}, {x: -1, y: 0}, {x: -2, y: 0}, {x: -1, y: 1}, // JLDI(0) -> H (A->H)
  {x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 1, y: -1},   // LJDI(H) -> A
];
```

### Shape Centering Issues:
Current shapes use arbitrary grid sizes. SRS requires consistent 4x4 or 3x3 grids with proper center point for kick calculations.

**Example:** I-piece should be centered in a 4x4 grid:
```
[0,0,0,0]
[1,1,1,1] - Center between columns 2-3 (index 1.5)
[0,0,0,0]
[0,0,0,0]
```

---

## 🟡 MEDIUM: database.ts - Schema Inconsistencies

### Issue 1: Table Name Mismatch
- **README.md** says table is `high_scores`
- **database.ts** creates table named `leaderboard`

### Issue 2: Missing Score Fields in insertScore()
```typescript
// Current (INCOMPLETE):
export async function insertScore(playerName: string, score: number)
// Should include:
export async function insertScore(
  playerName: string, 
  score: number,
  level: number,
  linesCleared: number
)
```

### Issue 3: Missing Game State Persistence Functions
No functions to save/load active game state for resume functionality.

---

## 🟡 MEDIUM: Scoring System Not Implemented

### Nintendo Formula (MISSING):
- Single line: `100 × level`
- Double lines: `300 × level`  
- Triple lines: `500 × level`
- Tetris (4 lines): `800 × level`
- Soft drop: `1 pt per cell`
- Hard drop: `2 pts per cell`

---

## 📋 RECOMMENDATIONS

### Priority 1: Implement Core Game Engine in tetrisGame.ts
Create complete game loop with:
```typescript
interface TetrisState {
  board: number[][];          // 10x20 grid (row-major)
  currentPiece: Piece;        // Active falling piece
  nextPieces: TetrominoType[]; // Next 3 pieces queue
  heldPiece: TetrominoType | null;
  score: number;
  level: number;
  linesCleared: number;
  gameOver: boolean;
}

interface Piece {
  type: TetrominoType;
  rotation: number;           // 0-3 (SRS rotation index)
  x: number;                  // Board column
  y: number;                  // Board row
}
```

### Priority 2: Add SRS Wall Kick Tables to tetrominoes.ts
Implement standard Nintendo wall kick tables for all pieces.

### Priority 3: Fix database.ts schema alignment
- Rename table or update README (consistency)
- Add level and linesCleared to insertScore
- Implement saveGameState/loadGameState functions

---

## 🔧 FIXES TO APPLY

1. **tetrisGame.ts**: Complete rewrite needed with full game engine
2. **tetrominoes.ts**: Add wall kick tables, fix shape centering
3. **database.ts**: Add missing fields and persistence functions

**Estimated effort:** 4-6 hours for complete implementation

---

---
## ✅ RESOLVED: tetrisGame.ts - Core Game Engine Implemented (2026-03-06)

### Implementation Summary

Created complete Tetris game engine in `src/lib/tetrisGame.ts` with:

**Core Systems:**
- ✅ Board representation (10x20 grid using board.ts Grid type)
- ✅ Collision detection system (checkCollision, isLanded, getLandingY)
- ✅ Line clear detection and handling (clearLines, isLineComplete)
- ✅ Piece movement (moveLeft, moveRight, moveDown, hardDrop)
- ✅ Piece rotation with SRS wall kicks (rotatePiece with full kick tables)
- ✅ Spawn new piece logic (spawnNewPiece with 7-bag randomizer)
- ✅ Hold piece functionality (holdCurrentPiece, canHold flag)
- ✅ Level progression system (level up every 10 lines)
- ✅ Nintendo-style scoring calculation

**SRS Wall Kick Implementation:**
- Complete kick tables for I piece (I_KICKS, I_KICKS_CCW)
- Complete kick tables for J, L, S, T, Z pieces (JLSTZ_KICKS, JLSTZ_KICKS_CCW)
- O piece has no kicks (symmetrical)
- getWallKicks() function returns appropriate kicks based on piece type and rotation

**Scoring System (Nintendo Formula):**
- Single line: 100 × level
- Double lines: 300 × level
- Triple lines: 500 × level
- Tetris (4 lines): 800 × level
- Soft drop: 1 pt per cell
- Hard drop: 2 pts per cell

**Game Loop Integration:**
- processGravityTick() uses timestamp-based timing (not setInterval)
- Drop speeds calculated per level (1000ms at level 1 to 5ms at level 15+)
- Soft drop acceleration (10x faster during soft drop)
- Proper piece locking and spawning cycle

**Additional Features:**
- 7-bag randomizer for fair piece distribution
- Next 3 pieces queue
- Hold piece system (once per turn)
- High score management with localStorage
- Game state serialization for save/load
- Pause functionality

### Verification
- ✅ `npm run build` passed with ZERO TypeScript errors
- ✅ All interfaces properly typed
- ✅ Pure functions where possible for testability
- ✅ Integrates with existing board.ts and tetrominos.ts

### Status
**GAME ENGINE COMPLETE** - Ready for UI integration and testing
