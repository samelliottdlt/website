"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cuePack, type CueHandle } from "./cues";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import {
  DEFAULT_SETTINGS,
  ParrySettings,
  RoundOutcome,
  makeOutcome,
  randomDelayMs,
} from "./util";

type Phase = "idle" | "waiting" | "windup" | "resolved";

type Stats = {
  parries: number;
  hits: number;
  tooEarly: number;
  reactionMsSum: number;
};

const initialStats: Stats = {
  parries: 0,
  hits: 0,
  tooEarly: 0,
  reactionMsSum: 0,
};

const RESOLVED_DISPLAY_MS = 900;

export default function DeadlockParryTrainer() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [sessionActive, setSessionActive] = useState(false);
  const [settings, setSettings] = useState<ParrySettings>(DEFAULT_SETTINGS);
  const [minDelayMs, setMinDelayMs] = useState(800);
  const [maxDelayMs, setMaxDelayMs] = useState(2800);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [lastOutcome, setLastOutcome] = useState<RoundOutcome | null>(null);
  const [showWindupVisual, setShowWindupVisual] = useState(false);
  const [bestReactionMs, setBestReactionMs] = useLocalStorage<number | null>(
    "deadlock-parry:best-reaction-ms",
    null,
  );
  const [isNewBest, setIsNewBest] = useState(false);

  const windupStartRef = useRef<number | null>(null);
  const windupHandleRef = useRef<CueHandle | null>(null);
  const waitingTimeoutRef = useRef<number | null>(null);
  const connectTimeoutRef = useRef<number | null>(null);
  const nextRoundTimeoutRef = useRef<number | null>(null);
  const phaseRef = useRef<Phase>("idle");
  const sessionActiveRef = useRef(false);
  const minDelayRef = useRef(minDelayMs);
  const maxDelayRef = useRef(maxDelayMs);
  const settingsRef = useRef(settings);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    sessionActiveRef.current = sessionActive;
  }, [sessionActive]);
  useEffect(() => {
    minDelayRef.current = minDelayMs;
  }, [minDelayMs]);
  useEffect(() => {
    maxDelayRef.current = maxDelayMs;
  }, [maxDelayMs]);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const clearTimers = () => {
    if (waitingTimeoutRef.current !== null) {
      window.clearTimeout(waitingTimeoutRef.current);
      waitingTimeoutRef.current = null;
    }
    if (connectTimeoutRef.current !== null) {
      window.clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    if (nextRoundTimeoutRef.current !== null) {
      window.clearTimeout(nextRoundTimeoutRef.current);
      nextRoundTimeoutRef.current = null;
    }
  };

  const stopWindupCue = () => {
    windupHandleRef.current?.stop();
    windupHandleRef.current = null;
  };

  const recordOutcome = useCallback(
    (outcome: RoundOutcome) => {
      setLastOutcome(outcome);
      setStats((prev) => {
        if (outcome.kind === "parried") {
          return {
            ...prev,
            parries: prev.parries + 1,
            reactionMsSum: prev.reactionMsSum + outcome.reactionMs,
          };
        }
        if (outcome.kind === "too-early") {
          return { ...prev, tooEarly: prev.tooEarly + 1 };
        }
        return { ...prev, hits: prev.hits + 1 };
      });
      if (outcome.kind === "parried") {
        const rounded = Math.round(outcome.reactionMs);
        if (bestReactionMs === null || rounded < bestReactionMs) {
          setBestReactionMs(rounded);
          setIsNewBest(true);
        } else {
          setIsNewBest(false);
        }
      } else {
        setIsNewBest(false);
      }
    },
    [bestReactionMs, setBestReactionMs],
  );

  // Schedule one round. Reads session parameters from refs so the scheduler
  // doesn't need to be re-created when sliders move. The self-reference via
  // `scheduleRoundRef` avoids a TDZ cycle inside the useCallback.
  const scheduleRoundRef = useRef<() => void>(() => {});
  const scheduleRound = useCallback(() => {
    if (!sessionActiveRef.current) return;
    clearTimers();
    stopWindupCue();
    setLastOutcome(null);
    setIsNewBest(false);
    setPhase("waiting");

    const delay = randomDelayMs(minDelayRef.current, maxDelayRef.current);
    waitingTimeoutRef.current = window.setTimeout(() => {
      if (!sessionActiveRef.current) return;
      const snap = settingsRef.current;
      windupStartRef.current = performance.now();
      // Roll once per round whether to show the visual — the trainer's goal
      // is audio reaction, so a configurable fraction of rounds must stay
      // silent-to-the-eyes.
      setShowWindupVisual(
        Math.random() * 100 < (snap.visualChancePercent ?? 100),
      );
      setPhase("windup");
      windupHandleRef.current = cuePack.playWindup(snap.windupDurationMs);

      connectTimeoutRef.current = window.setTimeout(() => {
        if (phaseRef.current !== "windup") return;
        stopWindupCue();
        cuePack.playConnect();
        setPhase("resolved");
        recordOutcome(makeOutcome({ pressed: false }, 0, snap));
        if (sessionActiveRef.current) {
          nextRoundTimeoutRef.current = window.setTimeout(
            () => scheduleRoundRef.current(),
            RESOLVED_DISPLAY_MS,
          );
        }
      }, snap.windupDurationMs);
    }, delay);
  }, [recordOutcome]);
  useEffect(() => {
    scheduleRoundRef.current = scheduleRound;
  }, [scheduleRound]);

  const startSession = useCallback(() => {
    if (sessionActiveRef.current) return;
    setSessionActive(true);
    sessionActiveRef.current = true;
    scheduleRound();
  }, [scheduleRound]);

  const stopSession = useCallback(() => {
    setSessionActive(false);
    sessionActiveRef.current = false;
    clearTimers();
    stopWindupCue();
    setPhase("idle");
  }, []);

  const toggleSession = useCallback(() => {
    if (sessionActiveRef.current) stopSession();
    else startSession();
  }, [startSession, stopSession]);

  const handleParryPress = useCallback(() => {
    const current = phaseRef.current;
    const scheduleNext = () => {
      if (sessionActiveRef.current) {
        nextRoundTimeoutRef.current = window.setTimeout(
          scheduleRound,
          RESOLVED_DISPLAY_MS,
        );
      }
    };

    if (current === "waiting") {
      clearTimers();
      setPhase("resolved");
      recordOutcome({ kind: "too-early", reactionMs: 0 });
      scheduleNext();
      return;
    }
    if (current !== "windup" || windupStartRef.current === null) return;

    clearTimers();
    stopWindupCue();
    const pressTime = performance.now();
    const outcome = makeOutcome(
      { pressed: true, pressTimeMs: pressTime },
      windupStartRef.current,
      settingsRef.current,
    );
    setPhase("resolved");
    if (outcome.kind === "parried") cuePack.playParrySuccess();
    recordOutcome(outcome);
    scheduleNext();
  }, [recordOutcome, scheduleRound]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (e.key === " " || e.code === "Space") {
        // Ignore when typing in form controls so spacebar retains normal
        // behavior inside inputs.
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        toggleSession();
        return;
      }

      if (e.key === "f" || e.key === "F") {
        const current = phaseRef.current;
        if (current === "waiting" || current === "windup") {
          e.preventDefault();
          handleParryPress();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleParryPress, toggleSession]);

  useEffect(() => {
    return () => {
      clearTimers();
      stopWindupCue();
    };
  }, []);

  const resetStats = () => {
    setStats(initialStats);
    setLastOutcome(null);
    setIsNewBest(false);
  };

  const resetBestTime = () => {
    setBestReactionMs(null);
    setIsNewBest(false);
  };

  const totalRounds = stats.parries + stats.hits + stats.tooEarly;
  const accuracy =
    totalRounds === 0 ? 0 : Math.round((stats.parries / totalRounds) * 100);
  const avgReaction =
    stats.parries === 0 ? 0 : Math.round(stats.reactionMsSum / stats.parries);

  const outcomeLabel = (() => {
    if (!lastOutcome) return "";
    if (lastOutcome.kind === "parried") {
      const ms = Math.round(lastOutcome.reactionMs);
      return isNewBest
        ? `🏆 New best! Parried in ${ms}ms`
        : `✅ Parried in ${ms}ms`;
    }
    if (lastOutcome.kind === "too-early") return `⚠️ Too early`;
    return "💥 Got hit";
  })();

  const WindupVisual = cuePack.WindupVisual;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Deadlock Parry Trainer</h1>
      <p className="text-sm text-gray-600 mb-4">
        Press <kbd className="px-1 py-0.5 bg-gray-200 rounded">Space</kbd> to
        start or stop a session. Press{" "}
        <kbd className="px-1 py-0.5 bg-gray-200 rounded">F</kbd> the moment you
        hear the heavy-melee wind-up. Cue pack:{" "}
        <span className="font-medium">{cuePack.name}</span>
        {cuePack.description ? ` — ${cuePack.description}` : null}
      </p>

      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <label className="flex flex-col">
          <span className="font-medium">
            Wind-up duration: {settings.windupDurationMs}ms
          </span>
          <input
            type="range"
            min={300}
            max={1500}
            step={50}
            value={settings.windupDurationMs}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                windupDurationMs: Number(e.target.value),
                parryWindowMs: Math.min(
                  s.parryWindowMs,
                  Number(e.target.value),
                ),
              }))
            }
          />
        </label>
        <label className="flex flex-col">
          <span className="font-medium">
            Parry window: {settings.parryWindowMs}ms
          </span>
          <input
            type="range"
            min={100}
            max={settings.windupDurationMs}
            step={25}
            value={settings.parryWindowMs}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                parryWindowMs: Number(e.target.value),
              }))
            }
          />
        </label>
        <label className="flex flex-col">
          <span className="font-medium">
            Visual cue chance: {settings.visualChancePercent ?? 100}%
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={settings.visualChancePercent ?? 100}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                visualChancePercent: Number(e.target.value),
              }))
            }
          />
          <span className="text-xs text-gray-500">
            How often the burning-fist visual plays with the audio. Lower = more
            audio-only rounds.
          </span>
        </label>
        <label className="flex flex-col sm:col-span-2">
          <span className="font-medium">
            Delay range: {minDelayMs}–{maxDelayMs}ms
          </span>
          <div className="flex gap-2">
            <input
              type="number"
              className="border rounded p-1 w-full"
              min={0}
              value={minDelayMs}
              onChange={(e) => setMinDelayMs(Number(e.target.value))}
            />
            <input
              type="number"
              className="border rounded p-1 w-full"
              min={minDelayMs}
              value={maxDelayMs}
              onChange={(e) =>
                setMaxDelayMs(Math.max(minDelayMs, Number(e.target.value)))
              }
            />
          </div>
        </label>
      </div>

      <div
        className={`relative h-48 rounded-lg border-2 overflow-hidden flex items-center justify-center text-xl font-semibold transition-colors duration-100 ${
          phase === "waiting" || phase === "windup"
            ? "bg-yellow-50 border-yellow-300 text-yellow-900"
            : phase === "resolved"
              ? lastOutcome?.kind === "parried"
                ? "bg-green-100 border-green-400 text-green-900"
                : lastOutcome?.kind === "too-early"
                  ? "bg-orange-100 border-orange-400 text-orange-900"
                  : "bg-red-100 border-red-400 text-red-900"
              : "bg-gray-50 border-gray-300 text-gray-700"
        }`}
        aria-live="polite"
      >
        {phase === "idle" && "Press Start (or Space) to begin"}
        {(phase === "waiting" || phase === "windup") && "Stay alert…"}
        {phase === "windup" && showWindupVisual && (
          <WindupVisual durationMs={settings.windupDurationMs} />
        )}
        {phase === "resolved" && outcomeLabel}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={toggleSession}
          className={`px-4 py-2 rounded text-white ${
            sessionActive
              ? "bg-red-600 hover:bg-red-700"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {sessionActive ? "Stop (Space)" : "Start (Space)"}
        </button>
        <button
          onClick={handleParryPress}
          disabled={phase !== "waiting" && phase !== "windup"}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Parry (F)
        </button>
        <button
          onClick={resetStats}
          className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
        >
          Reset stats
        </button>
        <button
          onClick={resetBestTime}
          disabled={bestReactionMs === null}
          className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          Reset best
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
        <Stat label="Parries" value={stats.parries} />
        <Stat label="Hits" value={stats.hits} />
        <Stat label="Too early" value={stats.tooEarly} />
        <Stat label="Accuracy" value={`${accuracy}%`} />
        <Stat label="Avg reaction" value={`${avgReaction}ms`} />
        <Stat
          label="Best reaction"
          value={bestReactionMs === null ? "—" : `${bestReactionMs}ms`}
        />
        <Stat label="Rounds" value={totalRounds} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border rounded p-2 bg-white">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
