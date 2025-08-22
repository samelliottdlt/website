"use client";

import { useState } from "react";
import Grid from "../../components/Grid";
import words from "./words.json";
import { CellColor, generateWordsForGrid } from "./util";

const colorOrder: CellColor[] = ["gray", "yellow", "green"];

export default function WordleArtPage() {
  const [rows, setRows] = useState(6);
  const [cols, setCols] = useState(5);
  const [grid, setGrid] = useState<CellColor[][]>(
    Array.from({ length: rows }, () => Array(cols).fill("gray")),
  );
  const [answer, setAnswer] = useState("");
  const [generated, setGenerated] = useState<(string | null)[]>([]);

  const updateRows = (value: number) => {
    setRows(value);
    setGrid((prev) => {
      const newGrid = Array.from({ length: value }, (_, i) =>
        prev[i] ? [...prev[i]] : Array(cols).fill("gray"),
      );
      return newGrid;
    });
  };

  const updateCols = (value: number) => {
    setCols(value);
    setGrid((prev) =>
      prev.map((row) =>
        Array.from({ length: value }, (_, i) => row[i] ?? "gray"),
      ),
    );
  };

  const cycleColor = (r: number, c: number) => {
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      const current = prev[r][c];
      const idx = colorOrder.indexOf(current);
      next[r][c] = colorOrder[(idx + 1) % colorOrder.length];
      return next;
    });
  };

  const generate = () => {
    if (answer.length !== cols) return;
    setGenerated(generateWordsForGrid(answer.toLowerCase(), grid, words));
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Wordle Art</h1>
      <div className="flex space-x-4">
        <label className="flex items-center space-x-1">
          <span>Rows</span>
          <input
            type="number"
            min={1}
            value={rows}
            onChange={(e) => updateRows(Number(e.target.value))}
            className="w-16 border p-1 rounded"
          />
        </label>
        <label className="flex items-center space-x-1">
          <span>Cols</span>
          <input
            type="number"
            min={1}
            value={cols}
            onChange={(e) => updateCols(Number(e.target.value))}
            className="w-16 border p-1 rounded"
          />
        </label>
      </div>
      <Grid
        cells={grid}
        className="gap-1"
        renderCell={(color, r, c) => (
          <div
            onClick={() => cycleColor(r, c)}
            className={`w-8 h-8 cursor-pointer border ${
              color === "green"
                ? "bg-green-500"
                : color === "yellow"
                  ? "bg-yellow-400"
                  : "bg-gray-400"
            }`}
          />
        )}
      />
      <div className="flex space-x-2">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Word of the day"
          className="border p-2 rounded flex-1"
        />
        <button
          onClick={generate}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Generate
        </button>
      </div>
      {generated.length > 0 && (
        <ul className="list-disc pl-5">
          {generated.map((word, idx) => (
            <li key={idx}>{word ?? "No match"}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
