// High-level database operations wrapper for game use
import { getHighScores, closeDb } from './database';

export async function saveScoreToDb(playerName: string, score: number): Promise<boolean> {
  try {
    // Note: Full implementation should call database.ts functions directly
    return true;
  } catch (error) {
    console.error('Error saving score:', error);
    return false;
  }
}

export async function getHighScoresFromDb(limit: number = 10): Promise<Array<{id: number, name: string, score: number, level: number, lines_cleared: number, created_at: string}>> {
  try {
    const scores = await getHighScores(limit);
    return scores;
  } catch (error) {
    console.error('Error getting high scores:', error);
    return [];
  } finally {
    await closeDb();
  }
}

export function clearAllScores(): boolean {
  try {
    // Implementation in database.ts
    const db = require('./database').getDb;
    if (db) {
      // Clear scores logic here
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error clearing scores:', error);
    return false;
  }
}
