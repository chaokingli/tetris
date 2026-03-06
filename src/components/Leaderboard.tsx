'use client';

import { useEffect, useState } from 'react';

interface Score {
  id: number;
  name: string;
  score: number;
  level: number;
  lines_cleared: number;
  created_at: string;
}

export default function Leaderboard() {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const response = await fetch('/api/leaderboard');
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard');
        }
        const data = await response.json();
        setScores(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-center mb-6 text-white">Leaderboard</h2>
      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Rank</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Name</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">Score</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">Level</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">Lines</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((score, index) => (
              <tr
                key={score.id}
                className={`border-t border-gray-700 ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}`}
              >
                <td className="px-4 py-3 text-gray-400">
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index > 2 && `#${index + 1}`}
                </td>
                <td className="px-4 py-3 text-white font-medium">{score.name}</td>
                <td className="px-4 py-3 text-right text-yellow-400 font-bold">{score.score.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-gray-300">{score.level}</td>
                <td className="px-4 py-3 text-right text-gray-300">{score.lines_cleared}</td>
              </tr>
            ))}
            {scores.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No scores yet. Be the first to play!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
