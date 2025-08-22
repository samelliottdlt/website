import React from "react";

export type GridProps<T> = {
  cells: T[][];
  renderCell: (cell: T, row: number, col: number) => React.ReactNode;
  className?: string;
};

export default function Grid<T>({
  cells,
  renderCell,
  className,
}: GridProps<T>) {
  const cols = cells[0]?.length ?? 0;
  return (
    <div
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      }}
    >
      {cells.map((row, r) =>
        row.map((cell, c) => (
          <React.Fragment key={`${r}-${c}`}>
            {renderCell(cell, r, c)}
          </React.Fragment>
        )),
      )}
    </div>
  );
}
