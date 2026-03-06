# Database Schema Decisions - Tetris Game

## Date: 2026-03-01

---

### Decision 1: WAL Mode for SQLite Journal

**Choice**: Enable Write-Ahead Logging (WAL) via `PRAGMA journal_mode = WAL`

**Rationale**:
- Better concurrent read/write performance compared to DELETE mode
- Allows readers and writers to operate simultaneously without blocking
- Recommended in better-sqlite3 best practices documentation
- Minimal overhead for single-user game application while maintaining compatibility with future multi-user scenarios

**Trade-offs**:
- Creates additional `-wal` and `-shm` files alongside main database file
- Slightly more complex cleanup on manual deletion (need to remove 3 files)

---

### Decision 2: Board State as JSON String

**Choice**: Store board state as JSON string of 10x20 grid in `game_states.board` field

**Rationale**:
- Simpler than storing each cell as separate row
- Easier serialization/deserialization for client-side game loop
- Matches vanilla-js-tetris example pattern (array-based representation)
- Prepared statements work efficiently with TEXT columns containing JSON

**Data Format**: Row-major 2D array encoded as string: `[[0,0,0,...],[1,0,0,...],...]` where values represent tetromino types or empty cells.

---

### Decision 3: Game State vs Leaderboard Separation

**Choice**: Two separate tables (`game_states`, `leaderboard`) rather than single table with status field

**Rationale**:
- Clearer separation of concerns (active game state vs completed scores)
- Simpler queries for each use case without filtering by status
- Easier to optimize indexes independently
- Follows database normalization principles

---

### Decision 4: Difficulty Field in Both Tables

**Choice**: Include `difficulty` field in both tables with same enum values (easy, medium, hard)

**Rationale**:
- Enables fair leaderboard comparisons within difficulty tier
- Allows replay of previous games with context about original conditions
- Supports difficulty switching feature without losing historical data integrity

---

### Decision 5: AUTOINCREMENT vs INTEGER PRIMARY KEY

**Choice**: Use `INTEGER PRIMARY KEY` (without AUTOINCREMENT keyword) for leaderboar

**Rationale**:
- Simpler syntax, same behavior for this use case
- AUTOINCREMENT adds overhead to ensure uniqueness that we don't need
- Nintendo-style scoring doesn't require strictly sequential IDs
- Performance benefit of simpler primary key definition

---

### Decision 6: Indexes Strategy

**Choice**: Two indexes - single-column on score DESC and composite on (difficulty, score DESC)

**Rationale**:
- `idx_leaderboard_score` supports quick top-10 global leaderboard queries
- `idx_leaderboard_difficulty_score` optimizes filtered leaderboards by difficulty tier
- DESC ordering in index matches common query pattern (highest scores first)
- Composite index avoids filtering after retrieval for difficulty-specific views

---

### Decision 7: Timestamps Without Manual Updates

**Choice**: Only use DEFAULT CURRENT_TIMESTAMP, no trigger-based updated_at updates

**Rationale**:
- `game_states` is primarily written during single game session (not long-term storage)
- Avoids complexity of triggers for minimal benefit
- Client-side can track last modification time if needed for UI refreshes
- Keeps schema simpler and more maintainable

---

### Decision 8: View for Top Scores

**Choice**: Include `top_scores_by_difficulty` view despite simplicity of queries

**Rationale**:
- Provides ready-made SQL for common query pattern (top scores per difficulty)
- Reduces application code complexity - database handles sorting logic
- Can be indexed separately if query performance becomes bottleneck
- Follows principle of pushing computation to database layer when beneficial

---

### Decision 9: No Foreign Key Constraints

**Choice**: Omit foreign key constraints between tables

**Rationale**:
- Tables are independent (game_states doesn't reference leaderboard)
- Simplifies schema migration and rollback scenarios
- Application-level validation sufficient for this scope
- Avoids unnecessary complexity as per "MUST NOT DO" guidance

---

### Decision 10: Difficulty Values as Text Enum

**Choice**: Store difficulty as TEXT with enum values (easy, medium, hard) instead of INTEGER codes

**Rationale**:
- More readable in database dumps and debugging output
- Easier to add new difficulty levels without renumbering
- Direct mapping to UI labels without lookup table
- Trade-off: slightly more storage per row (negligible for this use case)

---

### Scoring System Alignment

**Implementation Notes**:
- Database stores only final scores and metadata
- Nintendo scoring calculated client-side before insertion:
  - 1 line: 100 × level
  - 2 lines: 300 × level  
  - 3 lines: 500 × level
  - 4 lines (Tetris): 800 × level
  - Soft drop: 1 point per cell
  - Hard drop: 2 points per cell

**Future Consideration**: If server-side validation is needed, scoring logic could be moved to database trigger or stored procedure.

---

### Next Steps

1. Implement `src/lib/database.ts` using better-sqlite3 API with prepared statements
2. Create migration script for schema initialization
3. Add unit tests in `tests/db.test.ts` covering CRUD operations
4. Verify WAL mode behavior with concurrent read/write scenarios
