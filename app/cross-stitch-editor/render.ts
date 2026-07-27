import { Pattern, Stitch } from "./util";

export interface RenderOptions {
  cellSize: number;
  showGrid: boolean;
  /** Draw a heavier line every 10 squares, like printed patterns. */
  showGuides: boolean;
  fabricColor: string;
}

/** Printed charts group squares into blocks of ten. */
export const GUIDE_STEP = 10;

export const FABRIC_COLORS = [
  { name: "White", hex: "#ffffff" },
  { name: "Antique", hex: "#f2e8d5" },
  { name: "Ash", hex: "#d8d8d8" },
  { name: "Denim", hex: "#38455c" },
  { name: "Black", hex: "#22242a" },
];

function drawStitch(
  ctx: CanvasRenderingContext2D,
  stitch: Stitch,
  x: number,
  y: number,
  size: number,
  palette: string[],
): void {
  const color = palette[stitch.color] ?? "#000000";
  const inset = Math.max(1, size * 0.14);
  const left = x + inset;
  const right = x + size - inset;
  const top = y + inset;
  const bottom = y + size - inset;

  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, size * 0.22);
  ctx.lineCap = "round";

  ctx.beginPath();
  if (stitch.type !== "half-up") {
    ctx.moveTo(left, top);
    ctx.lineTo(right, bottom);
  }
  if (stitch.type !== "half-down") {
    ctx.moveTo(left, bottom);
    ctx.lineTo(right, top);
  }
  ctx.stroke();
}

/**
 * Line offsets, in squares, for one axis: every `step`-th line plus the far
 * edge so a partial final block still gets its closing line.
 */
export function guideOffsets(count: number, step: number): number[] {
  if (count <= 0 || step <= 0) return [];
  const offsets: number[] = [];
  for (let offset = 0; offset < count; offset += step) offsets.push(offset);
  offsets.push(count);
  return offsets;
}

/**
 * Snap a line to a crisp pixel while keeping its full stroke inside the canvas,
 * so the right and bottom edges are as solid as the interior lines.
 */
function crisp(position: number, extent: number, lineWidth: number): number {
  const half = lineWidth / 2;
  const snapped =
    lineWidth % 2 === 1 ? Math.round(position) + 0.5 : Math.round(position);
  return Math.min(extent - half, Math.max(half, snapped));
}

function strokeLines(
  ctx: CanvasRenderingContext2D,
  pattern: Pattern,
  cellSize: number,
  step: number,
  color: string,
  lineWidth: number,
): void {
  const width = pattern.width * cellSize;
  const height = pattern.height * cellSize;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  for (const offset of guideOffsets(pattern.width, step)) {
    const px = crisp(offset * cellSize, width, lineWidth);
    ctx.moveTo(px, 0);
    ctx.lineTo(px, height);
  }
  for (const offset of guideOffsets(pattern.height, step)) {
    const py = crisp(offset * cellSize, height, lineWidth);
    ctx.moveTo(0, py);
    ctx.lineTo(width, py);
  }
  ctx.stroke();
}

export function renderPattern(
  ctx: CanvasRenderingContext2D,
  pattern: Pattern,
  options: RenderOptions,
): void {
  const { cellSize, showGrid, showGuides, fabricColor } = options;
  const width = pattern.width * cellSize;
  const height = pattern.height * cellSize;

  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = fabricColor;
  ctx.fillRect(0, 0, width, height);

  if (showGrid) {
    strokeLines(ctx, pattern, cellSize, 1, "rgba(120, 120, 120, 0.45)", 1);
  }

  if (showGuides) {
    strokeLines(
      ctx,
      pattern,
      cellSize,
      GUIDE_STEP,
      "rgba(40, 40, 40, 0.75)",
      2,
    );
  }

  for (let y = 0; y < pattern.height; y += 1) {
    for (let x = 0; x < pattern.width; x += 1) {
      const cell = pattern.cells[y * pattern.width + x];
      if (!cell) continue;
      drawStitch(
        ctx,
        cell,
        x * cellSize,
        y * cellSize,
        cellSize,
        pattern.palette,
      );
    }
  }

  ctx.restore();
}
