"use client";

import { useState } from "react";
import data from "./goty.json";
import { classNames } from "../../lib/util";

interface Entry {
  year: number;
  title: string;
}

export default function GameOfTheYear() {
  const gotyData: Entry[] = data as Entry[];
  const [selectedYear, setSelectedYear] = useState<number>(gotyData[0].year);

  const current = gotyData.find((g) => g.year === selectedYear);

  return (
    <div className="p-5 text-center">
      <h1 className="text-3xl mb-4 font-bold text-indigo-600">
        Game of the Year
      </h1>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 justify-center mb-6">
        {gotyData.map((g) => (
          <button
            key={g.year}
            onClick={() => setSelectedYear(g.year)}
            className={classNames(
              "px-3 py-2 rounded border",
              selectedYear === g.year
                ? "bg-indigo-600 text-white"
                : "bg-white text-black hover:bg-gray-100",
            )}
          >
            {g.year}
          </button>
        ))}
      </div>
      {current && (
        <div className="text-lg">
          <p>
            <span className="font-semibold">{current.year}:</span>{" "}
            {current.title}
          </p>
        </div>
      )}
    </div>
  );
}
