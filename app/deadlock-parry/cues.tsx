import type { ReactNode } from "react";

/**
 * A CuePack encapsulates *everything* needed to present a heavy-melee parry
 * scenario to the player. Swap the exported `cuePack` (or change which pack
 * is re-exported below) to substitute real in-game audio and visuals without
 * touching page logic.
 *
 * Design contract:
 * - `playWindup` is invoked when the wind-up begins. It MUST return a handle
 *   whose `stop()` is safe to call at any time (e.g. when the player parries
 *   before the swing connects).
 * - `playConnect` fires when the heavy connects (i.e. the player failed to
 *   parry in time).
 * - `playParrySuccess` fires on a successful parry.
 * - `WindupVisual` is a React component rendered inside the trainer's cue
 *   panel while the wind-up is active. It receives the expected wind-up
 *   duration in ms so it can time its own animation.
 */
export type CuePack = {
  /** Short human name, shown in the picker. */
  name: string;
  /** Optional longer description / attribution line. */
  description?: string;
  playWindup: (durationMs: number) => CueHandle;
  playConnect: () => void;
  playParrySuccess: () => void;
  WindupVisual: React.ComponentType<WindupVisualProps>;
};

export type CueHandle = {
  stop: () => void;
};

export type WindupVisualProps = {
  durationMs: number;
};

/* -------------------------------------------------------------------------- */
/*  Synthesized pack (default; no in-game assets, safe for public deploy).    */
/* -------------------------------------------------------------------------- */

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedCtx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    sharedCtx = new AC();
  }
  if (sharedCtx.state === "suspended") {
    void sharedCtx.resume();
  }
  return sharedCtx;
}

function SynthesizedWindupVisual({ durationMs }: WindupVisualProps) {
  return (
    <div
      className="absolute inset-0 rounded-lg bg-red-500 animate-pulse flex items-center justify-center text-white text-xl font-bold"
      style={{ animationDuration: `${Math.max(120, durationMs / 4)}ms` }}
    >
      PARRY NOW!
    </div>
  );
}

export const synthesizedCuePack: CuePack = {
  name: "Synthesized (placeholder)",
  description:
    "Web Audio-synthesized cues. Safe for public deploy (no game assets).",

  playWindup(durationMs) {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const duration = durationMs / 1000;

    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

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

    return {
      stop: () => {
        try {
          noise.stop();
        } catch {
          /* already stopped */
        }
      },
    };
  },

  playConnect() {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
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
  },

  playParrySuccess() {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
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
  },

  WindupVisual: SynthesizedWindupVisual,
};

/* -------------------------------------------------------------------------- */
/*  Asset-file pack factory. Use this to wire up real in-game audio/visuals.  */
/*                                                                            */
/*  Example (drop real files into /public/deadlock-parry/):                   */
/*                                                                            */
/*    import { createAssetCuePack } from "./cues";                            */
/*    export const cuePack = createAssetCuePack({                             */
/*      name: "Deadlock",                                                     */
/*      windupAudioSrc: "/deadlock-parry/windup.ogg",                         */
/*      connectAudioSrc: "/deadlock-parry/connect.ogg",                       */
/*      parryAudioSrc:   "/deadlock-parry/parry.ogg",                         */
/*      windupVisualSrc: "/deadlock-parry/windup.webm", // video or image     */
/*    });                                                                     */
/*                                                                            */
/*  If you want a fully custom visual (shader, canvas, styled div, etc.),     */
/*  pass `WindupVisual` directly instead of `windupVisualSrc`.                */
/* -------------------------------------------------------------------------- */

export type AssetCuePackOptions = {
  name: string;
  description?: string;
  windupAudioSrc: string;
  connectAudioSrc: string;
  parryAudioSrc: string;
  /** Image URL (png/webp/gif) or video URL (webm/mp4). Auto-detected by extension. */
  windupVisualSrc?: string;
  /** Take over the visual completely; ignores windupVisualSrc if provided. */
  WindupVisual?: React.ComponentType<WindupVisualProps>;
};

export function createAssetCuePack(opts: AssetCuePackOptions): CuePack {
  const play = (src: string): HTMLAudioElement => {
    const audio = new Audio(src);
    audio.play().catch(() => {
      /* autoplay may be blocked until first interaction; the Start button covers that. */
    });
    return audio;
  };

  const Visual: React.ComponentType<WindupVisualProps> =
    opts.WindupVisual ?? makeVisualFromSrc(opts.windupVisualSrc);

  return {
    name: opts.name,
    description: opts.description,
    playWindup() {
      const audio = play(opts.windupAudioSrc);
      return {
        stop: () => {
          audio.pause();
          audio.currentTime = 0;
        },
      };
    },
    playConnect: () => void play(opts.connectAudioSrc),
    playParrySuccess: () => void play(opts.parryAudioSrc),
    WindupVisual: Visual,
  };
}

function makeVisualFromSrc(
  src: string | undefined,
): React.ComponentType<WindupVisualProps> {
  if (!src) return SynthesizedWindupVisual;

  const isVideo = /\.(webm|mp4|mov)(\?|$)/i.test(src);
  if (isVideo) {
    const VideoVisual = (): ReactNode => (
      <video
        src={src}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover rounded-lg"
      />
    );
    VideoVisual.displayName = "VideoWindupVisual";
    return VideoVisual;
  }

  const ImageVisual = (): ReactNode => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Heavy melee wind-up"
      className="absolute inset-0 w-full h-full object-cover rounded-lg"
    />
  );
  ImageVisual.displayName = "ImageWindupVisual";
  return ImageVisual;
}

/* -------------------------------------------------------------------------- */
/*  Active cue pack — swap this export to change what the trainer uses.       */
/* -------------------------------------------------------------------------- */

// To substitute real in-game assets, replace the line below with e.g.:
//   export const cuePack = createAssetCuePack({ ... });
// or import and re-export your own implementation of the CuePack interface.
export const cuePack: CuePack = synthesizedCuePack;
