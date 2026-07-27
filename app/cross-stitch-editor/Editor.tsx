"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { classNames } from "../../lib/util";
import { FABRIC_COLORS, GUIDE_STEP, renderPattern } from "./render";
import {
  Cell,
  DEFAULT_PALETTE,
  FLOSS_COLORS,
  MAX_CELL_SIZE,
  MAX_GRID,
  MIN_CELL_SIZE,
  MIN_GRID,
  Pattern,
  StitchType,
  clampCellSize,
  clampGrid,
  clearPattern,
  countStitches,
  createPattern,
  decodePattern,
  encodePattern,
  fillArea,
  finishedSize,
  fitCellSize,
  formatSize,
  getCell,
  normalizeHex,
  resizePattern,
  setCell,
  totalStitches,
} from "./util";

type Tool = "stitch" | "erase" | "fill" | "pick";

const STORAGE_KEY = "cross-stitch-editor:pattern";
// Three 10-square guide blocks per side reads as a clean 3x3 chart on load.
const DEFAULT_SIZE = 3 * GUIDE_STEP;
const MAX_HISTORY = 50;

const TOOLS: Array<{ id: Tool; label: string; hint: string; key: string }> = [
  { id: "stitch", label: "Stitch", hint: "Draw crosses (B)", key: "b" },
  { id: "erase", label: "Unpick", hint: "Remove stitches (E)", key: "e" },
  { id: "fill", label: "Fill", hint: "Flood fill an area (G)", key: "g" },
  { id: "pick", label: "Pick", hint: "Copy a stitch's floss (I)", key: "i" },
];

const STITCH_TYPES: Array<{ id: StitchType; label: string; glyph: string }> = [
  { id: "full", label: "Full cross", glyph: "✕" },
  { id: "half-up", label: "Half /", glyph: "╱" },
  { id: "half-down", label: "Half \\", glyph: "╲" },
];

const AIDA_COUNTS = [11, 14, 16, 18, 22];

export default function CrossStitchEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [pattern, setPattern] = useState<Pattern>(() =>
    createPattern(DEFAULT_SIZE, DEFAULT_SIZE),
  );
  const [past, setPast] = useState<Pattern[]>([]);
  const [future, setFuture] = useState<Pattern[]>([]);

  const [tool, setTool] = useState<Tool>("stitch");
  const [stitchType, setStitchType] = useState<StitchType>("full");
  const [colorIndex, setColorIndex] = useState(0);

  const [manualCellSize, setManualCellSize] = useState(20);
  const [autoFit, setAutoFit] = useState(true);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [fabricColor, setFabricColor] = useState(FABRIC_COLORS[1].hex);
  const [aidaCount, setAidaCount] = useState(14);

  const [hovered, setHovered] = useState<{ x: number; y: number } | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [importCode, setImportCode] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const strokeStartedRef = useRef(false);
  const initializedRef = useRef(false);
  // Mirrors `pattern` so rapid pointer events never read a stale render.
  const patternRef = useRef(pattern);

  const applyPattern = useCallback(
    (next: Pattern | ((prev: Pattern) => Pattern), recordHistory: boolean) => {
      const prev = patternRef.current;
      const resolved = typeof next === "function" ? next(prev) : next;
      if (resolved === prev) return;
      if (recordHistory) {
        setPast((history) => [...history, prev].slice(-MAX_HISTORY));
        setFuture([]);
      }
      patternRef.current = resolved;
      setPattern(resolved);
    },
    [],
  );

  const commit = useCallback(
    (next: Pattern | ((prev: Pattern) => Pattern)) => {
      applyPattern(next, true);
    },
    [applyPattern],
  );

  // Load a shared pattern from the URL, otherwise the last local autosave.
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const shared = searchParams.get("p");
    const fromUrl = shared ? decodePattern(shared) : null;
    if (fromUrl) {
      applyPattern(fromUrl, false);
      return;
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const restored = stored ? decodePattern(stored) : null;
      if (restored) applyPattern(restored, false);
    } catch {
      // Ignore unavailable or corrupt storage and keep the blank pattern.
    }
  }, [applyPattern, searchParams]);

  useEffect(() => {
    if (!initializedRef.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, encodePattern(pattern));
    } catch {
      // Storage can be full or blocked; autosave is best effort.
    }
  }, [pattern]);

  // Measure the scroll area so "fit" can size squares to the visible space.
  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    const measure = () => {
      setViewport({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    // ResizeObserver reports the initial size as soon as it observes.
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const fittedCellSize = useMemo(
    () =>
      fitCellSize(
        pattern.width,
        pattern.height,
        // Leave room for the wrapper padding so nothing hides under the edge.
        viewport.width - 24,
        viewport.height - 24,
      ),
    [pattern.width, pattern.height, viewport.width, viewport.height],
  );

  // Derived rather than stored so fitting never fights the manual zoom state.
  const cellSize =
    autoFit && viewport.width > 0 && viewport.height > 0
      ? fittedCellSize
      : manualCellSize;

  const setZoom = useCallback((next: number) => {
    setAutoFit(false);
    setManualCellSize(clampCellSize(next));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ratio = window.devicePixelRatio || 1;
    const width = pattern.width * cellSize;
    const height = pattern.height * cellSize;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    renderPattern(ctx, pattern, {
      cellSize,
      showGrid,
      showGuides,
      fabricColor,
    });
  }, [pattern, cellSize, showGrid, showGuides, fabricColor]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const current = patternRef.current;
    setPast(past.slice(0, -1));
    setFuture([current, ...future].slice(0, MAX_HISTORY));
    patternRef.current = previous;
    setPattern(previous);
  }, [future, past]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    const current = patternRef.current;
    setFuture(future.slice(1));
    setPast([...past, current].slice(-MAX_HISTORY));
    patternRef.current = next;
    setPattern(next);
  }, [future, past]);

  const cellFromEvent = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((event.clientX - rect.left) / cellSize);
      const y = Math.floor((event.clientY - rect.top) / cellSize);
      if (x < 0 || y < 0 || x >= pattern.width || y >= pattern.height) {
        return null;
      }
      return { x, y };
    },
    [cellSize, pattern.width, pattern.height],
  );

  const applyTool = useCallback(
    (x: number, y: number, erase: boolean) => {
      if (tool === "pick") {
        const existing = getCell(patternRef.current, x, y);
        if (existing) {
          setColorIndex(existing.color);
          setStitchType(existing.type);
          setTool("stitch");
        }
        return;
      }

      const value: Cell =
        erase || tool === "erase"
          ? null
          : { color: colorIndex, type: stitchType };

      const mutate = (prev: Pattern) =>
        tool === "fill"
          ? fillArea(prev, x, y, value)
          : setCell(prev, x, y, value);

      // A whole drag collapses into a single undo step.
      applyPattern(mutate, !strokeStartedRef.current);
      strokeStartedRef.current = true;
    },
    [applyPattern, colorIndex, stitchType, tool],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const cell = cellFromEvent(event);
    if (!cell) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    strokeStartedRef.current = false;
    applyTool(cell.x, cell.y, event.button === 2 || event.shiftKey);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const cell = cellFromEvent(event);
    setHovered((prev) => {
      if (!cell) return prev === null ? prev : null;
      if (prev && prev.x === cell.x && prev.y === cell.y) return prev;
      return cell;
    });
    if (!drawingRef.current || !cell || tool === "fill" || tool === "pick") {
      return;
    }
    applyTool(cell.x, cell.y, event.shiftKey || (event.buttons & 2) !== 0);
  };

  const endStroke = () => {
    drawingRef.current = false;
    strokeStartedRef.current = false;
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) === true
      ) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const toolMatch = TOOLS.find((entry) => entry.key === event.key);
      if (toolMatch) {
        setTool(toolMatch.id);
        return;
      }
      const digit = Number.parseInt(event.key, 10);
      if (Number.isInteger(digit) && digit >= 1 && digit <= 9) {
        const index = digit - 1;
        if (index < pattern.palette.length) setColorIndex(index);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pattern.palette.length, redo, undo]);

  const counts = useMemo(() => countStitches(pattern), [pattern]);
  const total = useMemo(() => totalStitches(pattern), [pattern]);
  const size = useMemo(
    () => finishedSize(pattern, aidaCount),
    [pattern, aidaCount],
  );

  const flash = useCallback((message: string) => {
    setStatus(message);
    window.setTimeout(() => setStatus(null), 2500);
  }, []);

  const handleAddColor = (hex: string) => {
    const normalized = normalizeHex(hex);
    if (!normalized) return;
    const existing = pattern.palette.indexOf(normalized);
    if (existing >= 0) {
      setColorIndex(existing);
      return;
    }
    commit((prev) => ({ ...prev, palette: [...prev.palette, normalized] }));
    setColorIndex(pattern.palette.length);
  };

  const handleEditColor = (index: number, hex: string) => {
    const normalized = normalizeHex(hex);
    if (!normalized) return;
    commit((prev) => {
      const palette = [...prev.palette];
      palette[index] = normalized;
      return { ...prev, palette };
    });
  };

  const handleResize = (width: number, height: number) => {
    commit((prev) => resizePattern(prev, width, height));
  };

  const handleShare = async () => {
    const code = encodePattern(pattern);
    const url = `${window.location.origin}${window.location.pathname}?p=${encodeURIComponent(code)}`;
    router.replace(`?p=${encodeURIComponent(code)}`, { scroll: false });
    try {
      await navigator.clipboard.writeText(url);
      flash("Share link copied to clipboard.");
    } catch {
      flash("Link is in the address bar; copying was blocked.");
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(encodePattern(pattern));
      flash("Pattern code copied.");
    } catch {
      flash("Copying was blocked by the browser.");
    }
  };

  const handleImport = () => {
    const imported = decodePattern(importCode);
    if (!imported) {
      flash("That pattern code could not be read.");
      return;
    }
    commit(imported);
    setColorIndex(0);
    setImportCode("");
    flash("Pattern imported.");
  };

  const handleExportPng = () => {
    const exportCellSize = 20;
    const canvas = document.createElement("canvas");
    canvas.width = pattern.width * exportCellSize;
    canvas.height = pattern.height * exportCellSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderPattern(ctx, pattern, {
      cellSize: exportCellSize,
      showGrid,
      showGuides,
      fabricColor,
    });

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `cross-stitch-${pattern.width}x${pattern.height}.png`;
    link.click();
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 pb-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Cross Stitch Editor</h1>
        <p className="text-gray-600">
          Pixel art, but every square is a stitch. Draw full crosses or half
          stitches, keep an eye on your floss counts, and share the chart with a
          link.
        </p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {TOOLS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                title={entry.hint}
                aria-pressed={tool === entry.id}
                onClick={() => setTool(entry.id)}
                className={classNames(
                  "rounded border px-3 py-1.5 text-sm font-medium",
                  tool === entry.id
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
                )}
              >
                {entry.label}
              </button>
            ))}
            <span className="mx-1 h-6 w-px bg-gray-300" aria-hidden="true" />
            {STITCH_TYPES.map((entry) => (
              <button
                key={entry.id}
                type="button"
                title={entry.label}
                aria-pressed={stitchType === entry.id}
                onClick={() => {
                  setStitchType(entry.id);
                  setTool("stitch");
                }}
                className={classNames(
                  "rounded border px-3 py-1.5 text-sm",
                  stitchType === entry.id
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
                )}
              >
                <span aria-hidden="true">{entry.glyph}</span>
                <span className="sr-only">{entry.label}</span>
              </button>
            ))}
            <span className="mx-1 h-6 w-px bg-gray-300" aria-hidden="true" />
            <button
              type="button"
              onClick={undo}
              disabled={past.length === 0}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={future.length === 0}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Redo
            </button>
            <button
              type="button"
              onClick={() => commit((prev) => clearPattern(prev))}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
          </div>

          <div
            ref={viewportRef}
            className="relative h-[60vh] min-h-80 w-full overflow-auto overscroll-contain rounded border border-gray-300 bg-gray-100"
          >
            <div className="flex h-max min-h-full w-max min-w-full items-center justify-center p-3">
              <canvas
                ref={canvasRef}
                role="img"
                aria-label={`Cross stitch chart, ${pattern.width} by ${pattern.height} squares, ${total} stitches`}
                className="block shrink-0 touch-none select-none shadow-sm"
                style={{ cursor: tool === "pick" ? "copy" : "crosshair" }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={endStroke}
                onPointerCancel={endStroke}
                onPointerLeave={() => {
                  endStroke();
                  setHovered(null);
                }}
                onContextMenu={(event) => event.preventDefault()}
              />
            </div>
          </div>

          <p className="text-sm text-gray-600">
            {hovered
              ? `Square ${hovered.x + 1}, ${hovered.y + 1}`
              : "Drag to stitch. Hold Shift or right-click to unpick."}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <span>Zoom</span>
              <button
                type="button"
                aria-label="Zoom out"
                onClick={() => setZoom(cellSize - 2)}
                disabled={cellSize <= MIN_CELL_SIZE}
                className="h-8 w-8 rounded border border-gray-300 bg-white text-base leading-none text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                −
              </button>
              <input
                type="range"
                aria-label="Square size in pixels"
                min={MIN_CELL_SIZE}
                max={MAX_CELL_SIZE}
                value={cellSize}
                onChange={(event) => setZoom(Number(event.target.value))}
              />
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() => setZoom(cellSize + 2)}
                disabled={cellSize >= MAX_CELL_SIZE}
                className="h-8 w-8 rounded border border-gray-300 bg-white text-base leading-none text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                +
              </button>
              <span className="w-14 tabular-nums text-gray-500">
                {cellSize} px
              </span>
              <button
                type="button"
                aria-pressed={autoFit}
                onClick={() => {
                  if (autoFit) {
                    setManualCellSize(cellSize);
                    setAutoFit(false);
                  } else {
                    setAutoFit(true);
                  }
                }}
                className={classNames(
                  "rounded border px-2 py-1 text-sm",
                  autoFit
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
                )}
              >
                Fit
              </button>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(event) => setShowGrid(event.target.checked)}
              />
              Grid
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showGuides}
                onChange={(event) => setShowGuides(event.target.checked)}
              />
              {GUIDE_STEP}-square guides
            </label>
            <label className="flex items-center gap-2">
              Fabric
              <select
                value={fabricColor}
                onChange={(event) => setFabricColor(event.target.value)}
                className="rounded border border-gray-300 px-2 py-1"
              >
                {FABRIC_COLORS.map((fabric) => (
                  <option key={fabric.hex} value={fabric.hex}>
                    {fabric.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="flex w-full flex-col gap-6 lg:max-w-sm">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Floss</h2>
            <div className="flex flex-wrap gap-2">
              {pattern.palette.map((hex, index) => (
                <div
                  key={`${hex}-${index}`}
                  className="flex flex-col items-center"
                >
                  <button
                    type="button"
                    aria-label={`Use color ${index + 1} (${hex})`}
                    aria-pressed={colorIndex === index}
                    onClick={() => {
                      setColorIndex(index);
                      setTool("stitch");
                    }}
                    className={classNames(
                      "h-9 w-9 rounded border-2",
                      colorIndex === index
                        ? "border-indigo-600 ring-2 ring-indigo-200"
                        : "border-gray-300",
                    )}
                    style={{ backgroundColor: hex }}
                  />
                  <input
                    type="color"
                    aria-label={`Edit color ${index + 1}`}
                    value={hex}
                    onChange={(event) =>
                      handleEditColor(index, event.target.value)
                    }
                    className="mt-1 h-4 w-9 cursor-pointer border-0 bg-transparent p-0"
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                Add color
                <input
                  type="color"
                  aria-label="Add a color to the palette"
                  defaultValue="#7a3fb5"
                  onBlur={(event) => handleAddColor(event.target.value)}
                  className="h-8 w-10 cursor-pointer border border-gray-300 bg-transparent p-0"
                />
              </label>
              <select
                aria-label="Add a floss color by DMC number"
                defaultValue=""
                onChange={(event) => {
                  if (!event.target.value) return;
                  handleAddColor(event.target.value);
                  event.target.value = "";
                }}
                className="rounded border border-gray-300 px-2 py-1 text-sm"
              >
                <option value="">DMC shortcut…</option>
                {FLOSS_COLORS.map((floss) => (
                  <option key={floss.code} value={floss.hex}>
                    {floss.code} — {floss.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  commit((prev) => ({ ...prev, palette: [...DEFAULT_PALETTE] }))
                }
                className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
              >
                Reset palette
              </button>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Canvas</h2>
            <div className="flex flex-wrap items-end gap-3 text-sm text-gray-700">
              <label className="flex flex-col gap-1">
                Width
                <input
                  type="number"
                  min={MIN_GRID}
                  max={MAX_GRID}
                  value={pattern.width}
                  onChange={(event) =>
                    handleResize(
                      clampGrid(Number(event.target.value)),
                      pattern.height,
                    )
                  }
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                />
              </label>
              <label className="flex flex-col gap-1">
                Height
                <input
                  type="number"
                  min={MIN_GRID}
                  max={MAX_GRID}
                  value={pattern.height}
                  onChange={(event) =>
                    handleResize(
                      pattern.width,
                      clampGrid(Number(event.target.value)),
                    )
                  }
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                />
              </label>
              <label className="flex flex-col gap-1">
                Aida count
                <select
                  value={aidaCount}
                  onChange={(event) => setAidaCount(Number(event.target.value))}
                  className="rounded border border-gray-300 px-2 py-1"
                >
                  {AIDA_COUNTS.map((count) => (
                    <option key={count} value={count}>
                      {count} ct
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="text-sm text-gray-600">
              Finished size: {formatSize(size)}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Stitch count</h2>
            <p className="text-sm text-gray-600">{total} stitches total</p>
            {counts.length === 0 ? (
              <p className="text-sm text-gray-500">Nothing stitched yet.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-500">
                    <th className="py-1 font-medium">Color</th>
                    <th className="py-1 font-medium">Full</th>
                    <th className="py-1 font-medium">Half</th>
                    <th className="py-1 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {counts.map((entry) => (
                    <tr
                      key={entry.colorIndex}
                      className="border-t border-gray-200"
                    >
                      <td className="py-1">
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block h-4 w-4 rounded border border-gray-300"
                            style={{ backgroundColor: entry.color }}
                          />
                          {entry.color}
                        </span>
                      </td>
                      <td className="py-1">{entry.full}</td>
                      <td className="py-1">{entry.half}</td>
                      <td className="py-1">{entry.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Save and share</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Copy share link
              </button>
              <button
                type="button"
                onClick={handleCopyCode}
                className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Copy pattern code
              </button>
              <button
                type="button"
                onClick={handleExportPng}
                className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Download PNG
              </button>
            </div>
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Import a pattern code
              <textarea
                value={importCode}
                onChange={(event) => setImportCode(event.target.value)}
                rows={3}
                className="rounded border border-gray-300 px-2 py-1 font-mono text-xs"
                placeholder="1~25~25~1c1c1c,ffffff~_*625"
              />
            </label>
            <button
              type="button"
              onClick={handleImport}
              disabled={importCode.trim().length === 0}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Import
            </button>
            <p aria-live="polite" className="min-h-5 text-sm text-green-700">
              {status}
            </p>
            <p className="text-xs text-gray-500">
              Your work autosaves in this browser. Shortcuts: B/E/G/I for tools,
              1-9 for colors, Ctrl/Cmd+Z to undo.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
