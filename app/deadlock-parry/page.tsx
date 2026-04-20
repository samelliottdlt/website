"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CueMode,
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

function playWindupSound(ctx: AudioContext, durationMs: number) {
  const now = ctx.currentTime;
  const duration = durationMs / 1000;

  // Noise through a rising low-pass to simulate a heavy wind-up swoosh.
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(300, now);
  filter.frequency.exponentialRampToValueAtTime(1800, now + duration);
  filter.Q.value = 6;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.35, now + duration * 0.8);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start(now);
  noise.stop(now + duration);
}

function playConnectSound(ctx: AudioContext) {
  const now = ctx.currentTime;
  // Low sine thud.
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(50, now + 0.25);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.6, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.3);
}

function playParrySound(ctx: AudioContext) {
  const now = ctx.currentTime;
  // Bright metallic ding.
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(2200, now + 0.08);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.25);
}

export default function DeadlockParryTrainer() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [cueMode, setCueMode] = useState<CueMode>("both");
  const [settings, setSettings] = useState<ParrySettings>(DEFAULT_SETTINGS);
  const [minDelayMs, setMinDelayMs] = useState(800);
  const [maxDelayMs, setMaxDelayMs] = useState(2800);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [lastOutcome, setLastOutcome] = useState<RoundOutcome | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const windupStartRef = useRef<number | null>(null);
  const waitingTimeoutRef = useRef<number | null>(null);
  const connectTimeoutRef = useRef<number | null>(null);
  const phaseRef = useRef<Phase>("idle");

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const ensureAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioCtxRef.current = new AC();
    }
    if (audioCtxRef.current.state === "suspended") {
      void audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const clearTimers = () => {
    if (waitingTimeoutRef.current !== null) {
      window.clearTimeout(waitingTimeoutRef.current);
      waitingTimeoutRef.current = null;
    }
    if (connectTimeoutRef.current !== null) {
      window.clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
  };

  const recordOutcome = useCallback((outcome: RoundOutcome) => {
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
  }, []);

  const startRound = useCallback(() => {
    const ctx = ensureAudio();
    clearTimers();
    setLastOutcome(null);
    setPhase("waiting");

    const delay = randomDelayMs(minDelayMs, maxDelayMs);
    waitingTimeoutRef.current = window.setTimeout(() => {
      windupStartRef.current = performance.now();
      setPhase("windup");

      if (cueMode !== "visual") {
        playWindupSound(ctx, settings.windupDurationMs);
      }

      connectTimeoutRef.current = window.setTimeout(() => {
        if (phaseRef.current === "windup") {
          if (cueMode !== "visual") playConnectSound(ctx);
          setPhase("resolved");
          recordOutcome(makeOutcome({ pressed: false }, 0, settings));
        }
      }, settings.windupDurationMs);
    }, delay);
  }, [cueMode, ensureAudio, maxDelayMs, minDelayMs, recordOutcome, settings]);

  const handleParryPress = useCallback(() => {
    const current = phaseRef.current;
    if (current === "waiting") {
      clearTimers();
      setPhase("resolved");
      recordOutcome({ kind: "too-early", reactionMs: 0 });
      return;
    }
    if (current !== "windup" || windupStartRef.current === null) return;

    clearTimers();
    const pressTime = performance.now();
    const outcome = makeOutcome(
      { pressed: true, pressTimeMs: pressTime },
      windupStartRef.current,
      settings,
    );
    setPhase("resolved");
    if (outcome.kind === "parried") {
      const ctx = ensureAudio();
      if (cueMode !== "visual") playParrySound(ctx);
    }
    recordOutcome(outcome);
  }, [cueMode, ensureAudio, recordOutcome, settings]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
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
  }, [handleParryPress]);

  useEffect(() => {
    return () => {
      clearTimers();
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  const resetStats = () => {
    setStats(initialStats);
    setLastOutcome(null);
  };

  const totalRounds = stats.parries + stats.hits + stats.tooEarly;
  const accuracy =
    totalRounds === 0 ? 0 : Math.round((stats.parries / totalRounds) * 100);
  const avgReaction =
    stats.parries === 0 ? 0 : Math.round(stats.reactionMsSum / stats.parries);

  const showVisual = cueMode !== "audio" && phase === "windup";

  const outcomeLabel = (() => {
    if (!lastOutcome) return "";
    if (lastOutcome.kind === "parried")
      return `✅ Parried in ${Math.round(lastOutcome.reactionMs)}ms`;
    if (lastOutcome.kind === "too-early") return `⚠️ Too early`;
    return "💥 Got hit";
  })();

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Deadlock Parry Trainer</h1>
      <p className="text-sm text-gray-600 mb-4">
        Press <kbd className="px-1 py-0.5 bg-gray-200 rounded">F</kbd> as soon
        as you detect the heavy melee wind-up. Synthesized audio cues — no
        in-game assets are used.
      </p>

      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <label className="flex flex-col">
          <span className="font-medium">Cues</span>
          <select
            className="border rounded p-1"
            value={cueMode}
            onChange={(e) => setCueMode(e.target.value as CueMode)}
          >
            <option value="both">Audio + Visual</option>
            <option value="audio">Audio only</option>
            <option value="visual">Visual only</option>
          </select>
        </label>
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
        className={`relative h-48 rounded-lg border-2 flex items-center justify-center text-xl font-semibold transition-colors duration-100 ${
          showVisual
            ? "bg-red-500 border-red-700 text-white animate-pulse"
            : phase === "waiting"
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
        {phase === "idle" && "Press Start to begin"}
        {phase === "waiting" && "Stay alert…"}
        {phase === "windup" && (showVisual ? "PARRY NOW!" : "🔊 listen…")}
        {phase === "resolved" && outcomeLabel}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={startRound}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          {phase === "idle" || phase === "resolved" ? "Start round" : "Restart"}
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
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
        <Stat label="Parries" value={stats.parries} />
        <Stat label="Hits" value={stats.hits} />
        <Stat label="Too early" value={stats.tooEarly} />
        <Stat label="Accuracy" value={`${accuracy}%`} />
        <Stat label="Avg reaction" value={`${avgReaction}ms`} />
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
