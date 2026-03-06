import { NextResponse } from 'next/server';
import { getHighScores, saveScoreToDb } from '@/src/lib/database';

export async function GET() {
  try {
    const scores = await getHighScores(10);
    return NextResponse.json(scores);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, score, level, linesCleared } = body;

    if (!name || typeof score !== 'number' || typeof level !== 'number' || typeof linesCleared !== 'number') {
      return NextResponse.json(
        { error: 'Invalid request body. Required: name, score, level, linesCleared' },
        { status: 400 }
      );
    }

    const success = await saveScoreToDb(name, score, level, linesCleared);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to save score' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error saving score:', error);
    return NextResponse.json(
      { error: 'Failed to save score' },
      { status: 500 }
    );
  }
}
