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
  // A burning swirl around a fist — a bright white-yellow core, rotating
  // orange/yellow ring flames, radial flame tongues and outflying sparks.
  // Timings scale with the wind-up length so the burn intensifies alongside
  // the audio cue.
  const spinFast = `${Math.max(500, Math.round(durationMs * 0.75))}ms`;
  const spinSlow = `${Math.max(800, Math.round(durationMs * 1.4))}ms`;
  const flickerDur = `${Math.max(220, Math.round(durationMs / 4))}ms`;

  const flameCount = 10;
  const flames = Array.from({ length: flameCount }, (_, i) => ({
    deg: (360 / flameCount) * i,
    delay: (i * 53) % 260,
  }));

  const sparkCount = 14;
  const sparks = Array.from({ length: sparkCount }, (_, i) => ({
    deg: (137 * i) % 360, // golden-angle scattering keeps them non-uniform
    distance: 46 + ((i * 7) % 28),
    delay: (i * 91) % 600,
    size: 4 + (i % 3) * 2,
  }));

  // Ring-shaped reveal for the conic swirls so they read as flame halos,
  // not filled disks.
  const ringMask =
    "radial-gradient(circle, transparent 28%, black 38%, black 78%, transparent 96%)";
  const ringMaskOuter =
    "radial-gradient(circle, transparent 34%, black 46%, black 84%, transparent 100%)";

  const swirlInner =
    "conic-gradient(from 0deg, rgba(253,224,71,0) 0deg, rgba(251,146,60,0) 30deg, rgba(249,115,22,0.85) 80deg, rgba(253,224,71,0.95) 120deg, rgba(255,255,255,0.95) 150deg, rgba(253,224,71,0.95) 180deg, rgba(249,115,22,0.85) 230deg, rgba(251,146,60,0) 300deg, rgba(253,224,71,0) 360deg)";
  const swirlOuter =
    "conic-gradient(from 180deg, transparent 0deg, rgba(234,88,12,0) 40deg, rgba(251,146,60,0.75) 100deg, rgba(253,224,71,0.9) 160deg, rgba(251,146,60,0.75) 220deg, rgba(234,88,12,0) 300deg, transparent 360deg)";

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      aria-hidden="true"
    >
      <div className="relative flex h-40 w-40 items-center justify-center">
        {/* Outer heat glow */}
        <div
          className="absolute inset-0 -m-10 rounded-full bg-orange-500/60 blur-3xl animate-pulse"
          style={{ animationDuration: flickerDur }}
        />
        {/* Mid ember glow */}
        <div
          className="absolute inset-0 -m-4 rounded-full bg-yellow-300/70 blur-2xl animate-pulse"
          style={{ animationDuration: flickerDur, animationDelay: "60ms" }}
        />
        {/* Inner swirl ring */}
        <div
          className="absolute inset-0 rounded-full animate-spin mix-blend-screen"
          style={{
            background: swirlInner,
            animationDuration: spinFast,
            maskImage: ringMask,
            WebkitMaskImage: ringMask,
          }}
        />
        {/* Outer counter-rotating swirl ring */}
        <div
          className="absolute inset-0 rounded-full animate-spin mix-blend-screen"
          style={{
            background: swirlOuter,
            animationDuration: spinSlow,
            animationDirection: "reverse",
            maskImage: ringMaskOuter,
            WebkitMaskImage: ringMaskOuter,
          }}
        />
        {/* Flame tongues, slowly rotating together with individual flicker */}
        <div
          className="absolute inset-0 animate-spin"
          style={{ animationDuration: spinSlow }}
        >
          {flames.map(({ deg, delay }) => (
            <span
              key={deg}
              className="absolute left-1/2 top-1/2 h-14 w-3 rounded-full animate-pulse"
              style={{
                transform: `translate(-50%, -100%) rotate(${deg}deg) translateY(-2.25rem)`,
                transformOrigin: "50% 100%",
                background:
                  "linear-gradient(to top, rgba(249,115,22,0) 0%, rgba(249,115,22,0.9) 15%, rgba(253,224,71,0.95) 60%, rgba(255,255,255,0.95) 100%)",
                filter: "blur(1px)",
                animationDuration: flickerDur,
                animationDelay: `${delay}ms`,
              }}
            />
          ))}
        </div>
        {/* Sparks flying outward */}
        {sparks.map(({ deg, distance, delay, size }, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full bg-yellow-200 animate-ping"
            style={{
              width: size,
              height: size,
              transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-${distance}%)`,
              boxShadow:
                "0 0 8px rgba(253,224,71,0.95), 0 0 14px rgba(249,115,22,0.7)",
              animationDuration: `${Math.max(600, Math.round(durationMs / 2))}ms`,
              animationDelay: `${delay}ms`,
            }}
          />
        ))}
        {/* Bright hot core */}
        <div
          className="absolute rounded-full animate-pulse"
          style={{
            width: "4.25rem",
            height: "4.25rem",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(253,224,71,0.9) 35%, rgba(249,115,22,0.55) 70%, rgba(234,88,12,0) 100%)",
            filter: "blur(2px)",
            animationDuration: flickerDur,
          }}
        />
        {/* Fist on top of the blaze */}
        <span
          className="relative text-6xl"
          style={{
            filter:
              "drop-shadow(0 0 10px rgba(253,224,71,0.9)) drop-shadow(0 0 18px rgba(249,115,22,0.85))",
          }}
        >
          👊
        </span>
      </div>
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

  // Preload each audio asset into a template HTMLAudioElement at module load.
  // Browsers won't actually fetch until something forces them to — we nudge
  // that along with `.load()`. For playback we clone the template so
  // overlapping plays don't stomp each other's currentTime.
  const templates = new Map<string, HTMLAudioElement>();
  const preload = (src: string): void => {
    if (typeof window === "undefined") return;
    if (templates.has(src)) return;
    const a = new Audio();
    a.preload = "auto";
    a.src = src;
    try {
      a.load();
    } catch {
      /* ignore */
    }
    templates.set(src, a);
  };
  preload(opts.windupAudioSrc);
  preload(opts.connectAudioSrc);
  preload(opts.parryAudioSrc);

  const play = (src: string): HTMLAudioElement => {
    const template = templates.get(src);
    // Clone via the already-fetched source so we inherit the buffered data
    // rather than starting a fresh network request.
    const audio = template
      ? (template.cloneNode(true) as HTMLAudioElement)
      : new Audio(src);
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
