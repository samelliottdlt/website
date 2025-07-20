"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
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
  const router = useRouter();
  const params = useParams();
  const [isPending, startTransition] = useTransition();
  const [pendingYear, setPendingYear] = useState<number | null>(null);
  const currentYear = parseInt(params.year as string);

  const handleYearClick = (year: number) => {
    if (year === currentYear) return;
    
    setPendingYear(year);
    startTransition(() => {
      router.push(`/game-of-the-year/${year}`);
    });
  };

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 justify-center mb-6">
        {allGames.map((g) => {
          const isSelected = currentYear === g.year;
          const isPendingThis = pendingYear === g.year;
          
          return (
            <button
              key={g.year}
              onClick={() => handleYearClick(g.year)}
              disabled={isPending}
              className={classNames(
                "px-3 py-2 rounded border transition-all duration-200",
                isSelected
                  ? "bg-indigo-600 text-white"
                  : isPendingThis
                  ? "bg-indigo-400 text-white animate-pulse"
                  : "bg-white text-black hover:bg-gray-100",
                isPending && !isSelected && !isPendingThis
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              )}
            >
              {g.year}
            </button>
          );
        })}
      </div>
      
      <div className="flex flex-col items-center space-y-4">
        <div className="text-lg">
          <p className={classNames(
            "transition-opacity duration-200",
            isPending ? "opacity-50" : "opacity-100"
          )}>
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
              className={classNames(
                "w-64 h-64 object-cover rounded-lg shadow-lg transition-all duration-300",
                isPending ? "opacity-50 scale-95" : "opacity-100 scale-100"
              )}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className={classNames(
              "w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 transition-all duration-300",
              isPending ? "opacity-50 scale-95" : "opacity-100 scale-100"
            )}>
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
