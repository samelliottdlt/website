"use client";

import { useState } from 'react';
import GameList from './GameList';
import data from './games';

const BacklogTracker: React.FC = () => {
  const gamesData = data;

  const [collapsedYears, setCollapsedYears] = useState<{ [year: string]: boolean }>(Object.keys(gamesData.played).reduce((accumulator, year) => {
    return {
      ...accumulator,
      [year]: true,
    }
  }, {}));

  const toggleYear = (year: string) => {
    setCollapsedYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  const multiplayerGames = gamesData.current.filter((game) => game.type === 'multiplayer');
  const singlePlayerGames = gamesData.current.filter((game) => game.type === 'singleplayer');

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold my-8">Active</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <GameList games={multiplayerGames} title="Multiplayer Games" />
        <GameList games={singlePlayerGames} title="Single Player Games" />
      </div>
      <div className='text-2xl font-bold mb-4'>Completed</div>
      {Object.entries(gamesData.played)
        .sort(([year1], [year2]) => Number(year2) - Number(year1))
        .map(([year, games]) => (
          <div key={year} className="mb-4">
            <div
              className="cursor-pointer text-2xl font-bold mb-2"
              onClick={() => toggleYear(year)}
            >
              {year} {collapsedYears[year] ? '▼' : '▲'}
            </div>
            {!collapsedYears[year] && <GameList games={games} />}
          </div>
        ))}
    </div>
  );
};

export default BacklogTracker;
