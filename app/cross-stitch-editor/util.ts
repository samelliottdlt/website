export type StitchType = "full" | "half-up" | "half-down";

export interface Stitch {
  /** Index into `Pattern.palette`. */
  color: number;
  type: StitchType;
}

/** `null` means an empty square of fabric. */
export type Cell = Stitch | null;

export interface Pattern {
  width: number;
  height: number;
  /** Lowercase `#rrggbb` thread colors. */
  palette: string[];
  /** Row-major, always `width * height` entries long. */
  cells: Cell[];
}

export interface FlossColor {
  code: string;
  name: string;
  hex: string;
}

export const MIN_GRID = 4;
export const MAX_GRID = 120;
export const MIN_CELL_SIZE = 6;
export const MAX_CELL_SIZE = 48;
export const PATTERN_VERSION = 1;

/** A small DMC-inspired starter palette. Codes are the familiar floss numbers. */
export const FLOSS_COLORS: FlossColor[] = [
  { code: "310", name: "Black", hex: "#1c1c1c" },
  { code: "413", name: "Pewter Grey", hex: "#565656" },
  { code: "318", name: "Steel Grey", hex: "#a8a8a8" },
  { code: "B5200", name: "Snow White", hex: "#ffffff" },
  { code: "712", name: "Cream", hex: "#f5ecd7" },
  { code: "3771", name: "Peach Skin", hex: "#eac3ae" },
  { code: "817", name: "Coral Red", hex: "#bb2528" },
  { code: "666", name: "Bright Red", hex: "#e02128" },
  { code: "970", name: "Pumpkin", hex: "#f47b2b" },
  { code: "725", name: "Topaz", hex: "#ffc84b" },
  { code: "745", name: "Pale Yellow", hex: "#ffe9a3" },
  { code: "989", name: "Forest Green", hex: "#6fa64b" },
  { code: "699", name: "Christmas Green", hex: "#1a7a34" },
  { code: "3814", name: "Aquamarine", hex: "#3f8a7d" },
  { code: "3846", name: "Turquoise", hex: "#22c2d4" },
  { code: "996", name: "Electric Blue", hex: "#2ab3e6" },
  { code: "796", name: "Royal Blue", hex: "#1c4f9c" },
  { code: "336", name: "Navy Blue", hex: "#1f2f5c" },
  { code: "209", name: "Lavender", hex: "#b18ec4" },
  { code: "550", name: "Violet", hex: "#63206b" },
  { code: "603", name: "Cranberry", hex: "#f78fb5" },
  { code: "3607", name: "Plum", hex: "#c94d9a" },
  { code: "801", name: "Coffee Brown", hex: "#6b4028" },
  { code: "435", name: "Chestnut", hex: "#b07a44" },
];

export const DEFAULT_PALETTE: string[] = [
  "#1c1c1c",
  "#ffffff",
  "#e02128",
  "#f47b2b",
  "#ffc84b",
  "#6fa64b",
  "#2ab3e6",
  "#1c4f9c",
  "#b18ec4",
  "#6b4028",
];

const TYPE_TO_CODE: Record<StitchType, string> = {
  full: "f",
  "half-up": "u",
  "half-down": "d",
};

const CODE_TO_TYPE: Record<string, StitchType> = {
  f: "full",
  u: "half-up",
  d: "half-down",
};

export function clampGrid(value: number): number {
  if (!Number.isFinite(value)) return MIN_GRID;
  return Math.min(MAX_GRID, Math.max(MIN_GRID, Math.round(value)));
}

export function clampCellSize(value: number): number {
  if (!Number.isFinite(value)) return MIN_CELL_SIZE;
  return Math.min(MAX_CELL_SIZE, Math.max(MIN_CELL_SIZE, Math.round(value)));
}

/** Largest square size that shows the whole chart inside the given viewport. */
export function fitCellSize(
  width: number,
  height: number,
  viewportWidth: number,
  viewportHeight: number,
): number {
  if (viewportWidth <= 0 || viewportHeight <= 0) return MIN_CELL_SIZE;
  if (width <= 0 || height <= 0) return MIN_CELL_SIZE;
  return clampCellSize(
    Math.floor(Math.min(viewportWidth / width, viewportHeight / height)),
  );
}

export function normalizeHex(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/.exec(trimmed);
  if (!match) return null;
  const digits = match[1];
  if (digits.length === 3) {
    return `#${digits[0]}${digits[0]}${digits[1]}${digits[1]}${digits[2]}${digits[2]}`;
  }
  return `#${digits}`;
}

export function createPattern(
  width: number,
  height: number,
  palette: string[] = DEFAULT_PALETTE,
): Pattern {
  const w = clampGrid(width);
  const h = clampGrid(height);
  return {
    width: w,
    height: h,
    palette: [...palette],
    cells: new Array<Cell>(w * h).fill(null),
  };
}

export function cellIndex(pattern: Pattern, x: number, y: number): number {
  return y * pattern.width + x;
}

export function isInside(pattern: Pattern, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < pattern.width && y < pattern.height;
}

export function getCell(pattern: Pattern, x: number, y: number): Cell {
  if (!isInside(pattern, x, y)) return null;
  return pattern.cells[cellIndex(pattern, x, y)];
}

function sameCell(a: Cell, b: Cell): boolean {
  if (a === null || b === null) return a === b;
  return a.color === b.color && a.type === b.type;
}

/** Returns the original pattern when nothing changes so undo history stays clean. */
export function setCell(
  pattern: Pattern,
  x: number,
  y: number,
  cell: Cell,
): Pattern {
  if (!isInside(pattern, x, y)) return pattern;
  const index = cellIndex(pattern, x, y);
  if (sameCell(pattern.cells[index], cell)) return pattern;
  const cells = [...pattern.cells];
  cells[index] = cell;
  return { ...pattern, cells };
}

export function fillArea(
  pattern: Pattern,
  x: number,
  y: number,
  cell: Cell,
): Pattern {
  if (!isInside(pattern, x, y)) return pattern;
  const target = getCell(pattern, x, y);
  if (sameCell(target, cell)) return pattern;

  const cells = [...pattern.cells];
  const stack: Array<[number, number]> = [[x, y]];
  const seen = new Set<number>([cellIndex(pattern, x, y)]);

  while (stack.length > 0) {
    const [cx, cy] = stack.pop()!;
    cells[cellIndex(pattern, cx, cy)] = cell;

    const neighbors: Array<[number, number]> = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ];
    for (const [nx, ny] of neighbors) {
      if (!isInside(pattern, nx, ny)) continue;
      const index = cellIndex(pattern, nx, ny);
      if (seen.has(index)) continue;
      if (!sameCell(pattern.cells[index], target)) continue;
      seen.add(index);
      stack.push([nx, ny]);
    }
  }

  return { ...pattern, cells };
}

/** Resize from the top-left corner, keeping any stitches that still fit. */
export function resizePattern(
  pattern: Pattern,
  width: number,
  height: number,
): Pattern {
  const w = clampGrid(width);
  const h = clampGrid(height);
  if (w === pattern.width && h === pattern.height) return pattern;

  const cells = new Array<Cell>(w * h).fill(null);
  const copyWidth = Math.min(w, pattern.width);
  const copyHeight = Math.min(h, pattern.height);
  for (let y = 0; y < copyHeight; y += 1) {
    for (let x = 0; x < copyWidth; x += 1) {
      cells[y * w + x] = pattern.cells[y * pattern.width + x];
    }
  }

  return { ...pattern, width: w, height: h, cells };
}

export function clearPattern(pattern: Pattern): Pattern {
  return {
    ...pattern,
    cells: new Array<Cell>(pattern.width * pattern.height).fill(null),
  };
}

export interface StitchCount {
  color: string;
  colorIndex: number;
  full: number;
  half: number;
  total: number;
}

export function countStitches(pattern: Pattern): StitchCount[] {
  const counts = new Map<number, StitchCount>();
  for (const cell of pattern.cells) {
    if (!cell) continue;
    const existing = counts.get(cell.color) ?? {
      color: pattern.palette[cell.color] ?? "#000000",
      colorIndex: cell.color,
      full: 0,
      half: 0,
      total: 0,
    };
    if (cell.type === "full") existing.full += 1;
    else existing.half += 1;
    existing.total += 1;
    counts.set(cell.color, existing);
  }
  return [...counts.values()].sort(
    (a, b) => b.total - a.total || a.colorIndex - b.colorIndex,
  );
}

export function totalStitches(pattern: Pattern): number {
  return pattern.cells.reduce((sum: number, cell) => (cell ? sum + 1 : sum), 0);
}

export interface FinishedSize {
  widthIn: number;
  heightIn: number;
  widthCm: number;
  heightCm: number;
}

/** Aida "count" is stitches per inch, so the math is just a division. */
export function finishedSize(pattern: Pattern, count: number): FinishedSize {
  const safeCount = count > 0 ? count : 14;
  const widthIn = pattern.width / safeCount;
  const heightIn = pattern.height / safeCount;
  return {
    widthIn,
    heightIn,
    widthCm: widthIn * 2.54,
    heightCm: heightIn * 2.54,
  };
}

export function formatSize(size: FinishedSize): string {
  const round = (value: number) => value.toFixed(1);
  return `${round(size.widthIn)} × ${round(size.heightIn)} in (${round(size.widthCm)} × ${round(size.heightCm)} cm)`;
}

function tokenFor(cell: Cell): string {
  if (!cell) return "_";
  return `${TYPE_TO_CODE[cell.type]}${cell.color}`;
}

/**
 * Compact, URL-safe run-length format:
 * `1~width~height~hex,hex~token*count.token*count`
 */
export function encodePattern(pattern: Pattern): string {
  const runs: string[] = [];
  let currentToken: string | null = null;
  let runLength = 0;

  const flush = () => {
    if (currentToken === null) return;
    runs.push(runLength > 1 ? `${currentToken}*${runLength}` : currentToken);
  };

  for (const cell of pattern.cells) {
    const token = tokenFor(cell);
    if (token === currentToken) {
      runLength += 1;
      continue;
    }
    flush();
    currentToken = token;
    runLength = 1;
  }
  flush();

  const palette = pattern.palette.map((hex) => hex.replace("#", "")).join(",");
  return [
    PATTERN_VERSION,
    pattern.width,
    pattern.height,
    palette,
    runs.join("."),
  ].join("~");
}

function parseToken(token: string, paletteSize: number): Cell {
  if (token === "_") return null;
  const type = CODE_TO_TYPE[token[0]];
  if (!type) return null;
  const color = Number.parseInt(token.slice(1), 10);
  if (!Number.isInteger(color) || color < 0 || color >= paletteSize)
    return null;
  return { color, type };
}

export function decodePattern(encoded: string): Pattern | null {
  if (!encoded) return null;
  const parts = encoded.trim().split("~");
  if (parts.length !== 5) return null;

  const [versionRaw, widthRaw, heightRaw, paletteRaw, runsRaw] = parts;
  if (Number.parseInt(versionRaw, 10) !== PATTERN_VERSION) return null;

  const width = Number.parseInt(widthRaw, 10);
  const height = Number.parseInt(heightRaw, 10);
  if (!Number.isInteger(width) || !Number.isInteger(height)) return null;
  if (width < MIN_GRID || width > MAX_GRID) return null;
  if (height < MIN_GRID || height > MAX_GRID) return null;

  const palette: string[] = [];
  for (const raw of paletteRaw.split(",")) {
    const hex = normalizeHex(raw);
    if (!hex) return null;
    palette.push(hex);
  }
  if (palette.length === 0) return null;

  const cells: Cell[] = [];
  if (runsRaw.length > 0) {
    for (const run of runsRaw.split(".")) {
      const [token, countRaw] = run.split("*");
      const count = countRaw === undefined ? 1 : Number.parseInt(countRaw, 10);
      if (!Number.isInteger(count) || count < 1) return null;
      const cell = parseToken(token, palette.length);
      for (let i = 0; i < count; i += 1) cells.push(cell);
      if (cells.length > width * height) return null;
    }
  }
  if (cells.length !== width * height) return null;

  return { width, height, palette, cells };
}
