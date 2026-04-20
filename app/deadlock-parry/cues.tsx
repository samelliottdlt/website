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

function SynthesizedWindupVisual() {
  // Deliberately empty: this trainer is meant to build audio-cue reaction,
  // not visual reaction. The parent panel intentionally does not change
  // during windup.
  return null;
}

export const synthesizedCuePack: CuePack = {
  name: "Synthesized (placeholder)",
  description:
    "Web Audio-synthesized cues. Safe for public deploy (no game assets).",

  playWindup(durationMs) {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const duration = durationMs / 1000;

    // Layer 1: rising filtered noise "whoosh" (air movement of a heavy swing).
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(350, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(2600, now + duration);
    noiseFilter.Q.value = 4;

    const noiseGain = ctx.createGain();
    // Fast attack to an audible floor, swell through the wind-up, peak near end.
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.15, now + 0.04);
    noiseGain.gain.linearRampToValueAtTime(0.45, now + duration * 0.9);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // Layer 2: rising sawtooth "charge" tone, slightly detuned for thickness.
    const charge1 = ctx.createOscillator();
    charge1.type = "sawtooth";
    charge1.frequency.setValueAtTime(90, now);
    charge1.frequency.exponentialRampToValueAtTime(260, now + duration);

    const charge2 = ctx.createOscillator();
    charge2.type = "sawtooth";
    charge2.detune.value = 12;
    charge2.frequency.setValueAtTime(90, now);
    charge2.frequency.exponentialRampToValueAtTime(260, now + duration);

    const chargeFilter = ctx.createBiquadFilter();
    chargeFilter.type = "lowpass";
    chargeFilter.frequency.setValueAtTime(600, now);
    chargeFilter.frequency.exponentialRampToValueAtTime(1600, now + duration);
    chargeFilter.Q.value = 8;

    const chargeGain = ctx.createGain();
    chargeGain.gain.setValueAtTime(0.0001, now);
    chargeGain.gain.exponentialRampToValueAtTime(0.1, now + 0.05);
    chargeGain.gain.linearRampToValueAtTime(0.28, now + duration * 0.9);
    chargeGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    charge1.connect(chargeFilter);
    charge2.connect(chargeFilter);
    chargeFilter.connect(chargeGain);
    chargeGain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
    charge1.start(now);
    charge1.stop(now + duration);
    charge2.start(now);
    charge2.stop(now + duration);

    return {
      stop: () => {
        try {
          noise.stop();
        } catch {
          /* already stopped */
        }
        try {
          charge1.stop();
        } catch {
          /* already stopped */
        }
        try {
          charge2.stop();
        } catch {
          /* already stopped */
        }
      },
    };
  },

  playConnect() {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Sub thump: low sine with a quick pitch drop for that "weight" feeling.
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.setValueAtTime(160, now);
    sub.frequency.exponentialRampToValueAtTime(45, now + 0.18);
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.exponentialRampToValueAtTime(0.8, now + 0.008);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    sub.connect(subGain);
    subGain.connect(ctx.destination);

    // Crunchy body: short burst of low-passed noise for the impact texture.
    const bufSize = Math.floor(ctx.sampleRate * 0.25);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * 0.8;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.setValueAtTime(1400, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(200, now + 0.2);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.45, now + 0.005);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    sub.start(now);
    sub.stop(now + 0.35);
    noise.start(now);
    noise.stop(now + 0.25);
  },

  playParrySuccess() {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Bright noise transient — the "tink" attack of metal-on-metal.
    const bufSize = Math.floor(ctx.sampleRate * 0.08);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.value = 4500;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.5, now + 0.002);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // Inharmonic partials — a cluster of high sine tones gives the metallic
    // "clang" ringing that a simple oscillator sweep can't fake.
    const partials = [2100, 3180, 4700, 6250, 7800];
    const clangGain = ctx.createGain();
    clangGain.gain.setValueAtTime(0.0001, now);
    clangGain.gain.exponentialRampToValueAtTime(0.35, now + 0.005);
    clangGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    clangGain.connect(ctx.destination);

    const oscs: OscillatorNode[] = [];
    partials.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      // Slight downward shimmer.
      osc.frequency.exponentialRampToValueAtTime(freq * 0.97, now + 0.55);
      const pGain = ctx.createGain();
      const amp = 0.9 / (i + 1);
      pGain.gain.setValueAtTime(amp, now);
      pGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55 - i * 0.05);
      osc.connect(pGain);
      pGain.connect(clangGain);
      osc.start(now);
      osc.stop(now + 0.6);
      oscs.push(osc);
    });

    noise.start(now);
    noise.stop(now + 0.08);
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
  /**
   * CuePack used when any asset is missing (e.g. gitignored local-only files
   * not present in production). Defaults to `synthesizedCuePack`.
   */
  fallback?: CuePack;
};

export function createAssetCuePack(opts: AssetCuePackOptions): CuePack {
  const fallback = opts.fallback ?? synthesizedCuePack;
  const availability = new Map<string, boolean>();

  const probe = (src: string): void => {
    if (typeof window === "undefined") return;
    if (availability.has(src)) return;
    fetch(src, { method: "HEAD" })
      .then((res) => availability.set(src, res.ok))
      .catch(() => availability.set(src, false));
  };
  probe(opts.windupAudioSrc);
  probe(opts.connectAudioSrc);
  probe(opts.parryAudioSrc);
  if (opts.windupVisualSrc) probe(opts.windupVisualSrc);

  const isAvailable = (src: string): boolean => availability.get(src) === true;

  const play = (src: string): HTMLAudioElement => {
    const audio = new Audio(src);
    audio.play().catch(() => {
      /* autoplay may be blocked until first interaction; the Start button covers that. */
    });
    return audio;
  };

  // Compute these once — makeVisualFromSrc creates a React component, and
  // doing so inside render trips react-hooks/static-components.
  const srcVisual = opts.windupVisualSrc
    ? makeVisualFromSrc(opts.windupVisualSrc)
    : null;

  // createAssetCuePack is called exactly once at module load (to initialize
  // the exported `cuePack`), so this component is defined once — not on every
  // render.
  const Visual: React.ComponentType<WindupVisualProps> = (props) => {
    // Re-evaluate availability at render time (probe may have resolved).
    const V =
      opts.WindupVisual ??
      (srcVisual && opts.windupVisualSrc && isAvailable(opts.windupVisualSrc)
        ? srcVisual
        : fallback.WindupVisual);
    return <V {...props} />;
  };
  Visual.displayName = "AssetWindupVisual";

  return {
    name: opts.name,
    description: opts.description,
    playWindup(durationMs) {
      if (!isAvailable(opts.windupAudioSrc)) {
        return fallback.playWindup(durationMs);
      }
      const audio = play(opts.windupAudioSrc);
      return {
        stop: () => {
          audio.pause();
          audio.currentTime = 0;
        },
      };
    },
    playConnect: () => {
      if (!isAvailable(opts.connectAudioSrc)) {
        fallback.playConnect();
        return;
      }
      void play(opts.connectAudioSrc);
    },
    playParrySuccess: () => {
      if (!isAvailable(opts.parryAudioSrc)) {
        fallback.playParrySuccess();
        return;
      }
      void play(opts.parryAudioSrc);
    },
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

// Active pack uses real Deadlock audio when available under
// /public/deadlock-parry/ (see .gitignore — these are local-only assets). In
// production / any environment where the files are missing, each cue
// gracefully falls back to `synthesizedCuePack` via the HEAD probe in
// `createAssetCuePack`. The windup visual is always synthesized (no shipped
// imagery).
export const cuePack: CuePack = createAssetCuePack({
  name: "Deadlock (local assets)",
  description:
    "Real in-game audio. Files must be present under /public/deadlock-parry/; otherwise falls back to synthesized cues.",
  windupAudioSrc: "/deadlock-parry/alert.mp3",
  connectAudioSrc: "/deadlock-parry/fail.mp3",
  parryAudioSrc: "/deadlock-parry/parry.mp3",
});
