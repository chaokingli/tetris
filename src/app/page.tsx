'use client';

import React from 'react';
import { Game } from '@/components/Game';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          Tetris
        </h1>
        <Game />
      </div>
    </main>
  );
}
