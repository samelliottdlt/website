"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { COUNTERS, type Hero, type Item, tierWeight } from "./data";

// Deadlock teams are 6v6, so any selection beyond 6 enemies can't reflect a
// real game and is almost certainly a stale chip the user forgot to clear.
const TEAM_SIZE = 6;

type Mode = "game" | "lane" | "problem";

type Hit = { hero: Hero; tier: number; problem: boolean };

type ItemAggregate = {
  item: Item;
  score: number;
  problemScore: number;
  hits: Hit[];
};

function aggregate(
  selectedHeroes: ReadonlySet<Hero>,
  problem: ReadonlySet<Hero>,
): ItemAggregate[] {
  const map = new Map<Item, ItemAggregate>();
  for (const entry of COUNTERS) {
    if (!selectedHeroes.has(entry.hero)) continue;
    const isProblem = problem.has(entry.hero);
    entry.tiers.forEach((item, idx) => {
      const weight = tierWeight(idx);
      const existing = map.get(item);
      const hit: Hit = { hero: entry.hero, tier: idx, problem: isProblem };
      if (existing) {
        existing.score += weight;
        if (isProblem) existing.problemScore += weight;
        existing.hits.push(hit);
      } else {
        map.set(item, {
          item,
          score: weight,
          problemScore: isProblem ? weight : 0,
          hits: [hit],
        });
      }
    });
  }
  return Array.from(map.values()).sort((a, b) => {
    // Problem coverage breaks ties first — items that hit problem heroes
    // surface above equally-scored items that don't.
    if (b.score !== a.score) return b.score - a.score;
    if (b.problemScore !== a.problemScore)
      return b.problemScore - a.problemScore;
    if (b.hits.length !== a.hits.length) return b.hits.length - a.hits.length;
    return a.item.localeCompare(b.item);
  });
}

const TIER_DOT = ["bg-emerald-500", "bg-amber-500", "bg-rose-500"];
const TIER_LABEL = ["T1", "T2", "T3"];

const MODES: { id: Mode; label: string; emoji: string }[] = [
  { id: "game", label: "Game", emoji: "🎯" },
  { id: "lane", label: "Lane", emoji: "🛣️" },
  { id: "problem", label: "Problem", emoji: "⚠️" },
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default function DeadlockCountersPage() {
  const [game, setGame] = useState<Set<Hero>>(new Set());
  const [lane, setLane] = useState<Set<Hero>>(new Set());
  const [problem, setProblem] = useState<Set<Hero>>(new Set());
  const [mode, setMode] = useState<Mode>("game");
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Auto-focus search on mount so the user can type immediately during
  // the loading screen — every second counts.
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return COUNTERS;
    return COUNTERS.filter((c) => normalize(c.hero).includes(q));
  }, [query]);

  const toggle = (hero: Hero, m: Mode) => {
    if (m === "game") {
      setGame((prev) => {
        const next = new Set(prev);
        if (next.has(hero)) {
          next.delete(hero);
          // Removing from game also clears derived flags.
          setLane((p) => {
            if (!p.has(hero)) return p;
            const n = new Set(p);
            n.delete(hero);
            return n;
          });
          setProblem((p) => {
            if (!p.has(hero)) return p;
            const n = new Set(p);
            n.delete(hero);
            return n;
          });
        } else {
          next.add(hero);
        }
        return next;
      });
      return;
    }
    const setter = m === "lane" ? setLane : setProblem;
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(hero)) {
        next.delete(hero);
      } else {
        next.add(hero);
        // Marking lane/problem implies the hero is on the enemy team.
        setGame((g) => {
          if (g.has(hero)) return g;
          const n = new Set(g);
          n.add(hero);
          return n;
        });
      }
      return next;
    });
  };

  const clearAll = () => {
    setGame(new Set());
    setLane(new Set());
    setProblem(new Set());
    setQuery("");
    searchRef.current?.focus();
  };

  const clearLane = () => {
    setLane(new Set());
    searchRef.current?.focus();
  };

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault();
      toggle(filtered[0].hero, mode);
      setQuery("");
    } else if (e.key === "Escape") {
      setQuery("");
    }
  };

  const gameAgg = useMemo(() => aggregate(game, problem), [game, problem]);
  const laneAgg = useMemo(() => aggregate(lane, problem), [lane, problem]);

  // Auto-focus the search input on any click within the page so the user can
  // immediately keep typing. Guards:
  //   - skip on coarse pointers (touch) so we don't pop a virtual keyboard
  //     every time the user taps a hero chip
  //   - skip if the click target is already inside an editable element
  //   - skip if the user has an active text selection (preserves copy/paste)
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (target.closest("input, textarea, [contenteditable='true']")) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(pointer: coarse)").matches
    ) {
      return;
    }
    const selection = window.getSelection?.();
    if (selection && selection.toString().length > 0) return;
    searchRef.current?.focus();
  };

  return (
    <div className="min-h-full text-sm" onClick={handleContainerClick}>
      <div className="p-2 sm:p-3 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-2 gap-2">
          <h1 className="text-base sm:text-lg font-bold leading-none">
            Deadlock Counters
          </h1>
          <button
            onClick={clearAll}
            disabled={game.size === 0 && query === ""}
            className="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-40"
          >
            Clear
          </button>
        </div>

        <div className="flex gap-1 mb-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id);
                searchRef.current?.focus();
              }}
              className={
                "flex-1 px-2 py-1 text-xs rounded border transition-colors " +
                (mode === m.id
                  ? m.id === "game"
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : m.id === "lane"
                      ? "bg-amber-500 border-amber-500 text-white"
                      : "bg-rose-600 border-rose-600 text-white"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100")
              }
              title={`Click heroes to toggle ${m.label.toLowerCase()}`}
            >
              <span className="mr-1">{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>

        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearchKey}
          placeholder="Type to filter, Enter to add top match…"
          className="w-full px-2 py-1 mb-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />

        {game.size > TEAM_SIZE && (
          <div
            role="alert"
            className="mb-2 px-2 py-1.5 text-xs rounded border border-amber-400 bg-amber-50 text-amber-900"
          >
            ⚠️ {game.size} enemies selected — a Deadlock team only has{" "}
            {TEAM_SIZE}. Clear stale picks for accurate rankings.
          </div>
        )}

        {/*
          Natural-width chips with flex-wrap. The scroll container reserves
          scrollbar space via `scrollbar-gutter: stable` in the root layout,
          so the chip row's available width stays constant regardless of
          whether the page has overflowed vertically yet.
        */}
        <div className="flex flex-wrap gap-1 mb-3">
          {filtered.map(({ hero }) => {
            const inGame = game.has(hero);
            const inLane = lane.has(hero);
            const isProblem = problem.has(hero);
            return (
              <button
                key={hero}
                onClick={() => toggle(hero, mode)}
                className={
                  "relative px-2 py-1 rounded-full border text-xs leading-none transition-colors ring-2 ring-offset-1 " +
                  (inGame
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100") +
                  (inLane ? " ring-amber-400" : " ring-transparent")
                }
              >
                {hero}
                <span
                  aria-hidden={!isProblem}
                  aria-label={isProblem ? "problem" : undefined}
                  className={
                    "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white transition-opacity " +
                    (isProblem ? "opacity-100" : "opacity-0")
                  }
                />
              </button>
            );
          })}
          {filtered.length === 0 && (
            <span className="text-xs text-gray-500 italic">
              No heroes match
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <CounterList
            title="Good for lane"
            accent="amber"
            aggregated={laneAgg}
            empty="Mark lane heroes (🛣️ mode) to see lane items."
            action={
              lane.size > 0
                ? {
                    label: "Clear lane",
                    onClick: clearLane,
                    title:
                      "Clear lane selections (e.g. when laning phase ends)",
                  }
                : undefined
            }
          />
          <CounterList
            title="Good for game"
            accent="indigo"
            aggregated={gameAgg}
            empty="Add enemies (🎯 mode) to see ranked items."
          />
        </div>
      </div>
    </div>
  );
}

function CounterList({
  title,
  accent,
  aggregated,
  empty,
  action,
}: {
  title: string;
  accent: "amber" | "indigo";
  aggregated: ItemAggregate[];
  empty: string;
  action?: { label: string; onClick: () => void; title?: string };
}) {
  const accentText = accent === "amber" ? "text-amber-600" : "text-indigo-600";
  return (
    <section>
      <div className="flex items-center justify-between mb-1 gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </h2>
        {action && (
          <button
            onClick={action.onClick}
            title={action.title}
            className="px-2 py-0.5 text-[10px] rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
          >
            {action.label}
          </button>
        )}
      </div>
      {aggregated.length === 0 ? (
        <p className="text-xs text-gray-500">{empty}</p>
      ) : (
        <ul className="space-y-1">
          {aggregated.map(({ item, score, problemScore, hits }) => {
            const ordered = [...hits].sort((a, b) => {
              // Problem hits float to the front so problem coverage is
              // visually obvious at a glance.
              if (a.problem !== b.problem) return a.problem ? -1 : 1;
              return a.tier - b.tier;
            });
            return (
              <li
                key={item}
                className={
                  "flex items-start gap-2 rounded border px-2 py-1.5 " +
                  (problemScore > 0
                    ? "border-rose-300 bg-rose-50"
                    : "border-gray-200 bg-white")
                }
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold truncate">{item}</span>
                    <span className="text-[10px] text-gray-500 shrink-0">
                      {hits.length} hero{hits.length === 1 ? "" : "es"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ordered.map(({ hero, tier, problem: isProblem }) => (
                      <span
                        key={hero}
                        className={
                          "inline-flex items-center gap-1 text-[10px] rounded px-1.5 py-0.5 " +
                          (isProblem
                            ? "bg-rose-200 text-rose-900 font-semibold"
                            : "bg-gray-100")
                        }
                        title={`${hero} — ${TIER_LABEL[tier]}${isProblem ? " (problem)" : ""}`}
                      >
                        <span
                          className={
                            "w-1.5 h-1.5 rounded-full " +
                            (TIER_DOT[tier] ?? "bg-gray-400")
                          }
                        />
                        {hero}
                      </span>
                    ))}
                  </div>
                </div>
                <div
                  className={`text-base font-bold tabular-nums shrink-0 ${accentText}`}
                >
                  {score}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
