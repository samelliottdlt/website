"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { classNames } from "../../lib/util";

interface Game {
  year: number;
  title: string;
  imageUrl?: string | null;
}

interface GameDisplayProps {
  game: Game;
  allGames: { year: number; title: string }[];
}

export default function GameDisplay({ game, allGames }: GameDisplayProps) {
  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 justify-center mb-6">
        {allGames.map((g) => (
          <Link
            key={g.year}
            href={`/game-of-the-year/${g.year}`}
            prefetch={true}
            className={classNames(
              "px-3 py-2 rounded border inline-block text-center transition-colors duration-150",
              game.year === g.year
                ? "bg-indigo-600 text-white"
                : "bg-white text-black hover:bg-gray-100",
            )}
          >
            {g.year}
          </Link>
        ))}
      </div>
      
      <div className="flex flex-col items-center space-y-4">
        <div className="text-lg">
          <p>
            <span className="font-semibold">{game.year}:</span>{" "}
            {game.title}
          </p>
        </div>
        
        {/* Game Image Section */}
        <div className="flex justify-center">
          {game.imageUrl ? (
            <img
              src={game.imageUrl}
              alt={`${game.title} box art`}
              className="w-64 h-64 object-cover rounded-lg shadow-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
              <p className="text-gray-500 text-center px-4">
                No image available for<br />{game.title}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
