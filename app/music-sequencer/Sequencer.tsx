"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryParam } from "../../hooks/useQueryParams";
import { Beat, NUM_STEPS, defaultBeat, encodeBeat, decodeBeat } from "./util";

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
const OCTAVES = [4, 5];
const SYNTH_NOTES = OCTAVES.flatMap((oct) =>
  NOTE_NAMES.map((n) => `${n}${oct}`),
);
const DRUMS = ["Kick", "Snare", "Hat"];

function noteToFrequency(note: string): number {
  const match = note.match(/([A-G]#?)(\d)/);
  if (!match) return 440;
  const [, name, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);
  const semitone = NOTE_NAMES.indexOf(name);
  const midi = (octave + 1) * 12 + semitone;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const NOTE_FREQUENCIES = SYNTH_NOTES.map(noteToFrequency);

export default function Sequencer() {
  const [encodedBeat, setEncodedBeat] = useQueryParam({
    key: "beat",
    defaultValue: encodeBeat(defaultBeat),
    serialize: (v: string) => v,
    deserialize: (v: string | null) => v || encodeBeat(defaultBeat),
  });

  const [beat, setBeat] = useState<Beat>(() => decodeBeat(encodedBeat));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showJson, setShowJson] = useState(false);
  const [jsonText, setJsonText] = useState("");

  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    setJsonText(JSON.stringify(beat, null, 2));
    setEncodedBeat(encodeBeat(beat));
  }, [beat, setEncodedBeat]);

  function getCtx(): AudioContext {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ||
        // @ts-ignore
        window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  }

  const playNote = useCallback((freq: number) => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }, []);

  const playDrum = useCallback((name: string) => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (name === "Kick") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
    } else if (name === "Snare") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(200, ctx.currentTime);
    } else {
      osc.type = "square";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
    }
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }, []);

  const toggleSynth = (noteIndex: number, step: number) => {
    setBeat((prev) => {
      const synth = prev.synth.map((row) => row.slice());
      synth[noteIndex][step] = !synth[noteIndex][step];
      return { ...prev, synth };
    });
  };

  const toggleDrum = (drumIndex: number, step: number) => {
    setBeat((prev) => {
      const drums = prev.drums.map((row) => row.slice());
      drums[drumIndex][step] = !drums[drumIndex][step];
      return { ...prev, drums };
    });
  };

  useEffect(() => {
    if (!isPlaying) return;
    const interval = (60 / beat.bpm / 4) * 1000;
    const id = setInterval(() => {
      setCurrentStep((s) => (s + 1) % NUM_STEPS);
    }, interval);
    return () => clearInterval(id);
  }, [isPlaying, beat.bpm]);

  useEffect(() => {
    if (!isPlaying) return;
    beat.synth.forEach((row, noteIndex) => {
      if (row[currentStep]) {
        playNote(NOTE_FREQUENCIES[noteIndex]);
      }
    });
    beat.drums.forEach((row, drumIndex) => {
      if (row[currentStep]) {
        playDrum(DRUMS[drumIndex]);
      }
    });
  }, [currentStep, isPlaying, beat, playNote, playDrum]);

  useEffect(() => {
    const keyMap: Record<string, number> = {
      a: 0,
      w: 1,
      s: 2,
      e: 3,
      d: 4,
      f: 5,
      t: 6,
      g: 7,
      y: 8,
      h: 9,
      u: 10,
      j: 11,
    };
    const handler = (e: KeyboardEvent) => {
      const idx = keyMap[e.key];
      if (idx !== undefined) {
        playNote(NOTE_FREQUENCIES[idx]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [playNote]);

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonText) as Beat;
      setBeat(parsed);
    } catch {
      alert("Invalid JSON");
    }
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Music Sequencer</h1>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsPlaying((p) => !p)}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          {isPlaying ? "Stop" : "Play"}
        </button>
        <label className="flex items-center gap-1">
          BPM:
          <input
            type="number"
            value={beat.bpm}
            onChange={(e) =>
              setBeat((prev) => ({ ...prev, bpm: Number(e.target.value) }))
            }
            className="w-20 border p-1 rounded"
          />
        </label>
        <button
          onClick={copyUrl}
          className="px-3 py-1 bg-gray-600 text-white rounded"
        >
          Copy URL
        </button>
        <button
          onClick={() => setShowJson((s) => !s)}
          className="px-3 py-1 bg-gray-600 text-white rounded"
        >
          {showJson ? "Hide JSON" : "Show JSON"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse">
          <tbody>
            {beat.synth.map((row, noteIndex) => (
              <tr key={noteIndex}>
                <td className="pr-2 text-right text-xs text-gray-600">
                  {SYNTH_NOTES[noteIndex]}
                </td>
                {row.map((active, step) => (
                  <td
                    key={step}
                    onClick={() => toggleSynth(noteIndex, step)}
                    className={`w-6 h-6 border cursor-pointer ${
                      active ? "bg-blue-500" : "bg-white"
                    } ${
                      isPlaying && step === currentStep
                        ? "border-yellow-400"
                        : ""
                    }`}
                  ></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse mt-4">
          <tbody>
            {beat.drums.map((row, drumIndex) => (
              <tr key={drumIndex}>
                <td className="pr-2 text-right text-xs text-gray-600">
                  {DRUMS[drumIndex]}
                </td>
                {row.map((active, step) => (
                  <td
                    key={step}
                    onClick={() => toggleDrum(drumIndex, step)}
                    className={`w-6 h-6 border cursor-pointer ${
                      active ? "bg-green-500" : "bg-white"
                    } ${
                      isPlaying && step === currentStep
                        ? "border-yellow-400"
                        : ""
                    }`}
                  ></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showJson && (
        <div className="space-y-2">
          <textarea
            className="w-full h-40 border p-2 font-mono text-sm"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
          />
          <button
            onClick={applyJson}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            Update From JSON
          </button>
        </div>
      )}
    </div>
  );
}
