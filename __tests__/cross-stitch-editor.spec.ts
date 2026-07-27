import { describe, expect, test } from "@jest/globals";
import {
  MAX_CELL_SIZE,
  MAX_GRID,
  MIN_CELL_SIZE,
  MIN_GRID,
  clampCellSize,
  clampGrid,
  countStitches,
  createPattern,
  decodePattern,
  encodePattern,
  fillArea,
  finishedSize,
  fitCellSize,
  getCell,
  normalizeHex,
  resizePattern,
  setCell,
  totalStitches,
} from "../app/cross-stitch-editor/util";
import { guideOffsets } from "../app/cross-stitch-editor/render";

describe("cross stitch pattern model", () => {
  test("creates an empty clamped grid", () => {
    const pattern = createPattern(1000, 2);
    expect(pattern.width).toBe(MAX_GRID);
    expect(pattern.height).toBe(MIN_GRID);
    expect(pattern.cells).toHaveLength(MAX_GRID * MIN_GRID);
    expect(totalStitches(pattern)).toBe(0);
  });

  test("clampGrid handles invalid numbers", () => {
    expect(clampGrid(Number.NaN)).toBe(MIN_GRID);
    expect(clampGrid(10.4)).toBe(10);
  });

  test("clampCellSize stays within the zoom range", () => {
    expect(clampCellSize(Number.NaN)).toBe(MIN_CELL_SIZE);
    expect(clampCellSize(0)).toBe(MIN_CELL_SIZE);
    expect(clampCellSize(1000)).toBe(MAX_CELL_SIZE);
    expect(clampCellSize(19.6)).toBe(20);
  });

  test("fitCellSize picks the tighter axis and stays in range", () => {
    // 400px wide viewport over 25 squares, 200px tall over 25 squares.
    expect(fitCellSize(25, 25, 400, 200)).toBe(8);
    expect(fitCellSize(25, 25, 200, 400)).toBe(8);
    expect(fitCellSize(10, 10, 1000, 1000)).toBe(MAX_CELL_SIZE);
    expect(fitCellSize(120, 120, 100, 100)).toBe(MIN_CELL_SIZE);
    expect(fitCellSize(25, 25, 0, 0)).toBe(MIN_CELL_SIZE);
    expect(fitCellSize(25, 25, -50, 300)).toBe(MIN_CELL_SIZE);
  });

  test("setCell is immutable and ignores no-op writes", () => {
    const pattern = createPattern(5, 5);
    const stitched = setCell(pattern, 1, 2, { color: 3, type: "full" });
    expect(stitched).not.toBe(pattern);
    expect(getCell(pattern, 1, 2)).toBeNull();
    expect(getCell(stitched, 1, 2)).toEqual({ color: 3, type: "full" });
    expect(setCell(stitched, 1, 2, { color: 3, type: "full" })).toBe(stitched);
    expect(setCell(pattern, -1, 0, { color: 0, type: "full" })).toBe(pattern);
  });

  test("fillArea only floods matching connected cells", () => {
    let pattern = createPattern(4, 4);
    for (let y = 0; y < 4; y += 1) {
      pattern = setCell(pattern, 1, y, { color: 1, type: "full" });
    }
    const filled = fillArea(pattern, 0, 0, { color: 0, type: "full" });

    expect(getCell(filled, 0, 0)).toEqual({ color: 0, type: "full" });
    expect(getCell(filled, 0, 3)).toEqual({ color: 0, type: "full" });
    expect(getCell(filled, 1, 0)).toEqual({ color: 1, type: "full" });
    expect(getCell(filled, 2, 0)).toBeNull();
    expect(getCell(filled, 3, 3)).toBeNull();
    expect(fillArea(pattern, 1, 1, { color: 1, type: "full" })).toBe(pattern);
  });

  test("resize keeps the top-left stitches", () => {
    let pattern = createPattern(6, 6);
    pattern = setCell(pattern, 0, 0, { color: 2, type: "half-up" });
    pattern = setCell(pattern, 5, 5, { color: 2, type: "full" });

    const smaller = resizePattern(pattern, 4, 4);
    expect(smaller.cells).toHaveLength(16);
    expect(getCell(smaller, 0, 0)).toEqual({ color: 2, type: "half-up" });

    const bigger = resizePattern(smaller, 8, 8);
    expect(getCell(bigger, 0, 0)).toEqual({ color: 2, type: "half-up" });
    expect(getCell(bigger, 7, 7)).toBeNull();
  });

  test("counts stitches per color, busiest first", () => {
    let pattern = createPattern(4, 4);
    pattern = setCell(pattern, 0, 0, { color: 1, type: "full" });
    pattern = setCell(pattern, 1, 0, { color: 0, type: "full" });
    pattern = setCell(pattern, 2, 0, { color: 0, type: "half-down" });

    const counts = countStitches(pattern);
    expect(counts).toHaveLength(2);
    expect(counts[0]).toMatchObject({
      colorIndex: 0,
      full: 1,
      half: 1,
      total: 2,
    });
    expect(counts[1]).toMatchObject({ colorIndex: 1, full: 1, half: 0 });
    expect(totalStitches(pattern)).toBe(3);
  });

  test("finished size divides by the aida count", () => {
    const size = finishedSize(createPattern(28, 14), 14);
    expect(size.widthIn).toBe(2);
    expect(size.heightIn).toBe(1);
    expect(size.widthCm).toBeCloseTo(5.08);
    expect(finishedSize(createPattern(14, 14), 0).widthIn).toBe(1);
  });
});

describe("normalizeHex", () => {
  test("accepts short and long hex with or without a hash", () => {
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
    expect(normalizeHex("ff0000")).toBe("#ff0000");
    expect(normalizeHex(" #FF00AA ")).toBe("#ff00aa");
  });

  test("rejects anything else", () => {
    expect(normalizeHex("red")).toBeNull();
    expect(normalizeHex("#ff00")).toBeNull();
  });
});

describe("pattern serialization", () => {
  test("round-trips a pattern", () => {
    let pattern = createPattern(5, 4, ["#1c1c1c", "#ffffff"]);
    pattern = setCell(pattern, 0, 0, { color: 1, type: "full" });
    pattern = setCell(pattern, 1, 0, { color: 1, type: "full" });
    pattern = setCell(pattern, 4, 3, { color: 0, type: "half-up" });

    const encoded = encodePattern(pattern);
    expect(encoded).toBe("1~5~4~1c1c1c,ffffff~f1*2._*17.u0");
    expect(decodePattern(encoded)).toEqual(pattern);
  });

  test("encodes an empty grid as a single run", () => {
    const pattern = createPattern(4, 4, ["#000000"]);
    expect(encodePattern(pattern)).toBe("1~4~4~000000~_*16");
  });

  test("rejects malformed codes", () => {
    expect(decodePattern("")).toBeNull();
    expect(decodePattern("1~4~4~000000")).toBeNull();
    expect(decodePattern("2~4~4~000000~_*16")).toBeNull();
    expect(decodePattern("1~4~4~notahex~_*16")).toBeNull();
    expect(decodePattern("1~4~4~000000~_*15")).toBeNull();
    expect(decodePattern("1~4~4~000000~_*20")).toBeNull();
    expect(decodePattern("1~2~2~000000~_*4")).toBeNull();
    expect(decodePattern("1~4~4~000000~f9*16")).toEqual(
      createPattern(4, 4, ["#000000"]),
    );
  });
});

describe("guideOffsets", () => {
  test("includes the far edge so every block is closed", () => {
    expect(guideOffsets(30, 10)).toEqual([0, 10, 20, 30]);
  });

  test("closes a partial trailing block", () => {
    expect(guideOffsets(25, 10)).toEqual([0, 10, 20, 25]);
  });

  test("handles per-square lines and degenerate input", () => {
    expect(guideOffsets(3, 1)).toEqual([0, 1, 2, 3]);
    expect(guideOffsets(0, 10)).toEqual([]);
    expect(guideOffsets(10, 0)).toEqual([]);
  });
});
