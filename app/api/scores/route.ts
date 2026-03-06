import { NextResponse } from 'next/server';
import { getHighScores, clearAllScores, closeDb, saveGameRecord } from '@/src/lib/database';

export async function GET() {
  try {
    const scores = await getHighScores(10);
    return NextResponse.json({ success: true, data: scores });
  } catch (error) {
    console.error('Error getting high scores:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to retrieve high scores' 
    }, { status: 500 });
  } finally {
    await closeDb();
  }
}

export async function DELETE() {
  try {
    const result = clearAllScores();
    if (!result) throw new Error('Failed to clear scores');
    
    return NextResponse.json({ success: true, message: 'High scores cleared' });
  } catch (error) {
    console.error('Error clearing high scores:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to clear high scores' 
    }, { status: 500 });
  } finally {
    await closeDb();
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { playerName, score, linesCleared, level, durationSeconds } = body;
    
    if (!playerName || typeof score !== 'number') {
      return NextResponse.json({ 
        success: false, 
        message: 'Player name and score are required' 
      }, { status: 400 });
    }
    
    const recordId = await saveGameRecord(
      playerName,
      score,
      linesCleared || 0,
      level || 1,
      durationSeconds || null
    );
    
    return NextResponse.json({ 
      success: true, 
      message: 'Score saved',
      recordId 
    });
  } catch (error) {
    console.error('Error saving score:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to save score' 
    }, { status: 500 });
  } finally {
    await closeDb();
  }
}
