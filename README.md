# Tetris Game - Next.js + SQLite

A classic Tetris game built with **Next.js**, **React**, and **SQLite** for persistent high scores.

## Features

- 🎮 Classic Tetris gameplay with all standard pieces
- 💾 High score persistence using SQLite database
- 🏆 Leaderboard system
- 🎨 Beautiful dark theme UI
- ⌨️ Full keyboard controls
- 📱 Responsive design
- 🌙 Dark mode by default

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React + Tailwind CSS
- **Database**: SQLite via better-sqlite3
- **Styling**: Tailwind CSS with dark theme

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd game-tetris

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the game.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Controls

| Key | Action |
|-----|--------|
| ← → | Move piece left/right |
| ↑ | Rotate piece clockwise |
| ↓ | Soft drop (faster fall) |
| Space | Hard drop (instant placement) |
| P | Pause game |

## Scoring System

- **Single line**: 100 × level
- **Double lines**: 300 × level  
- **Triple lines**: 500 × level
- **Tetris (4 lines)**: 800 × level

Level increases every 10 lines cleared!

## Database Schema

The SQLite database stores high scores in the `high_scores` table:

```sql
CREATE TABLE high_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  score INTEGER NOT NULL,
  level INTEGER DEFAULT 1,
  lines_cleared INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Database file location: `data/tetris.db`

## API Routes

### GET /api/scores
Returns the top 10 high scores.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Player1",
    "score": 5000,
    "level": 5,
    "lines_cleared": 50,
    "date": "2026-03-02T10:30:00.000Z"
  }
]
```

### POST /api/scores
Saves a new high score.

**Request Body:**
```json
{
  "name": "Player1",
  "score": 5000,
  "level": 5,
  "lines_cleared": 50
}
```

**Response:**
```json
{
  "success": true,
  "id": 2,
  "message": "Score saved successfully",
  "topScores": [...]
}
```

## Project Structure

```
game-tetris/
├── app/
│   ├── api/scores/route.ts    # API for high scores
│   └── page.tsx               # Main game page
├── components/
│   ├── GameCanvas.tsx         # Canvas rendering
│   ├── ScoreBoard.tsx         # Score display
│   └── TetrisGame.tsx         # Main game logic & UI
├── lib/
│   └── database.ts            # SQLite database functions
├── data/                      # SQLite database storage
└── public/                    # Static assets
```

## Development Notes

- The game uses a fixed canvas rendering approach for better performance
- All game state is managed with React hooks (useState, useEffect)
- LocalStorage is used for temporary game state during play
- High scores are persisted to SQLite via API routes

## License

MIT License - feel free to use this project for learning or personal projects!

---

Built with ❤️ using Next.js and SQLite
