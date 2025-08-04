"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryParam } from "../../hooks/useQueryParams";
import { 
  Beat, 
  NUM_STEPS, 
  defaultBeat, 
  encodeBeat, 
  decodeBeat, 
  beatToCompact, 
  compactToBeat,
  SCALE_NAMES,
  ROOT_NOTES,
  ScaleName,
  getScaleNotes,
  transposeBeatToScale
} from "./util";

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
  const [playingNotes, setPlayingNotes] = useState<Set<string>>(new Set());
   const [urlCopied, setUrlCopied] = useState(false);
  
  // Initialize scale settings from the loaded beat
  const [selectedScale, setSelectedScale] = useState<ScaleName>(() => {
    const loadedBeat = decodeBeat(encodedBeat);
    return loadedBeat.scale || "chromatic";
  });
  const [rootNote, setRootNote] = useState(() => {
    const loadedBeat = decodeBeat(encodedBeat);
    return loadedBeat.rootNote || "C";
  });

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Get the notes that should be visible based on selected scale
  const visibleNoteIndices = getScaleNotes(rootNote, selectedScale) || [];

  // Handler for scale changes with transposition
  const handleScaleChange = (newScale: ScaleName) => {
    const transposedBeat = transposeBeatToScale(beat, rootNote, newScale);
    const updatedBeat = { ...transposedBeat, scale: newScale };
    setBeat(updatedBeat);
    setSelectedScale(newScale);
  };

  // Handler for root note changes with transposition
  const handleRootNoteChange = (newRootNote: string) => {
    const transposedBeat = transposeBeatToScale(beat, newRootNote, selectedScale);
    const updatedBeat = { ...transposedBeat, rootNote: newRootNote };
    setBeat(updatedBeat);
    setRootNote(newRootNote);
  };

  useEffect(() => {
    // Use compact format for JSON display
    const compactBeat = beatToCompact(beat);
    setJsonText(JSON.stringify(compactBeat, null, 2));
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

  const playNote = useCallback((freq: number, noteIndex?: number, step?: number) => {
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

    // Add visual feedback for playing notes - include step for specificity
    if (noteIndex !== undefined && step !== undefined) {
      const noteKey = `synth-${noteIndex}-${step}`;
      setPlayingNotes(prev => new Set(prev).add(noteKey));
      setTimeout(() => {
        setPlayingNotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(noteKey);
          return newSet;
        });
      }, 200); // Show for 200ms
    }
  }, []);

  const playDrum = useCallback((name: string, drumIndex?: number, step?: number) => {
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

    // Add visual feedback for playing drums - include step for specificity
    if (drumIndex !== undefined && step !== undefined) {
      const drumKey = `drum-${drumIndex}-${step}`;
      setPlayingNotes(prev => new Set(prev).add(drumKey));
      setTimeout(() => {
        setPlayingNotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(drumKey);
          return newSet;
        });
      }, 200); // Show for 200ms
    }
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
        playNote(NOTE_FREQUENCIES[noteIndex], noteIndex, currentStep);
      }
    });
    beat.drums.forEach((row, drumIndex) => {
      if (row[currentStep]) {
        playDrum(DRUMS[drumIndex], drumIndex, currentStep);
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
        playNote(NOTE_FREQUENCIES[idx]); // No visual feedback for keyboard notes
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [playNote]);

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      
      let newBeat: Beat;
      // Check if it's already a compact format
      if (parsed.synth && Array.isArray(parsed.synth) && 
          (parsed.synth.length === 0 || typeof parsed.synth[0] === 'number')) {
        // It's compact format, convert to full Beat
        newBeat = compactToBeat(parsed);
      } else {
        // It's full Beat format, use as-is
        newBeat = parsed as Beat;
      }
      
      setBeat(newBeat);
      
      // Update UI state to match the loaded beat
      if (newBeat.rootNote) {
        setRootNote(newBeat.rootNote);
      }
      if (newBeat.scale) {
        setSelectedScale(newBeat.scale);
      }
    } catch {
      alert("Invalid JSON");
    }
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setUrlCopied(true);
      // Reset the feedback after 2 seconds
      setTimeout(() => {
        setUrlCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
      // You could add error feedback here if needed
    }
  };

  const clearGrid = () => {
    setBeat((prev) => ({
      ...prev,
      synth: Array.from({ length: 24 }, () => Array(NUM_STEPS).fill(false)), // 24 notes for 2 octaves
      drums: Array.from({ length: 3 }, () => Array(NUM_STEPS).fill(false)),
      // Preserve scale settings when clearing
      rootNote: prev.rootNote || "C",
      scale: prev.scale || "chromatic",
    }));
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-center">Music Sequencer</h1>
      
      {/* Scale Selection */}
      <div className="flex justify-center">
        <div className="flex flex-wrap items-center justify-center gap-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <label htmlFor="root-note" className="text-sm font-medium">
              Root Note:
            </label>
            <select
              id="root-note"
              value={rootNote}
              onChange={(e) => handleRootNoteChange(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              {ROOT_NOTES.map((note) => (
                <option key={note} value={note}>
                  {note}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-3">
            <label htmlFor="scale" className="text-sm font-medium">
              Scale:
            </label>
            <select
              id="scale"
              value={selectedScale}
              onChange={(e) => handleScaleChange(e.target.value as ScaleName)}
              className="border rounded px-2 py-1 text-sm"
            >
              {Object.entries(SCALE_NAMES).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="text-xs text-gray-600">
            {selectedScale === "chromatic" 
              ? "Showing all notes" 
              : `Showing ${visibleNoteIndices.length} notes in ${SCALE_NAMES[selectedScale]} scale`
            }
          </div>
        </div>
      </div>

      {/* Transport Controls */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <button
          onClick={() => setIsPlaying((p) => !p)}
          className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 transition-colors duration-150"
        >
          {isPlaying ? "Stop" : "Play"}
        </button>
        <label className="flex items-center gap-2">
          BPM:
          <input
            type="number"
            value={beat.bpm}
            onChange={(e) =>
              setBeat((prev) => ({ ...prev, bpm: Number(e.target.value) }))
            }
            className="w-24 border p-2 rounded"
          />
        </label>
        <button
          onClick={copyUrl}
          className={`px-4 py-2 text-white rounded cursor-pointer transition-colors duration-200 ${
            urlCopied 
              ? "bg-green-600 hover:bg-green-700" 
              : "bg-gray-600 hover:bg-gray-700"
          }`}
        >
          {urlCopied ? "Copied!" : "Copy URL"}
        </button>
        <button
          onClick={() => setShowJson((s) => !s)}
          className="px-4 py-2 bg-gray-600 text-white rounded cursor-pointer hover:bg-gray-700 transition-colors duration-150"
        >
          {showJson ? "Hide JSON" : "Show JSON"}
        </button>
        <button
          onClick={clearGrid}
          className="px-4 py-2 bg-red-600 text-white rounded cursor-pointer hover:bg-red-700 transition-colors duration-150"
        >
          Clear
        </button>
      </div>

      {/* Synth Grid */}
      <div>
        <h3 className="text-xl font-semibold mb-3 text-center">Synth Notes</h3>
        <div className="flex justify-center">
          <div className="overflow-x-auto">
            <table className="border-collapse">
            <tbody>
              {visibleNoteIndices.map((noteIndex) => {
                const row = beat.synth[noteIndex];
                return (
                  <tr key={noteIndex} className="group">
                    <td className="pr-3 text-right text-sm font-medium text-gray-700 group-hover:text-blue-600 group-hover:font-bold transition-colors duration-150 min-w-[3rem]">
                      {SYNTH_NOTES[noteIndex]}
                    </td>
                    {row.map((active, step) => {
                      const isCurrentStep = isPlaying && step === currentStep;
                      const isPlayingNote = playingNotes.has(`synth-${noteIndex}-${step}`);
                      
                      return (
                        <td
                          key={step}
                          onClick={() => toggleSynth(noteIndex, step)}
                          className={`w-10 h-10 border-2 cursor-pointer transition-all duration-150 hover:border-blue-400 hover:shadow-md ${
                            active ? "bg-blue-500 hover:bg-blue-600" : "bg-white hover:bg-blue-50"
                          } ${
                            isCurrentStep
                              ? "border-orange-400 shadow-lg bg-orange-100"
                              : "border-gray-300"
                          } ${
                            isPlayingNote && active
                              ? "bg-yellow-300 ring-2 ring-yellow-400"
                              : ""
                          }`}
                        ></td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Drum Grid */}
      <div>
        <h3 className="text-xl font-semibold mb-3 text-center">Drums</h3>
        <div className="flex justify-center">
          <div className="overflow-x-auto">
            <table className="border-collapse">
            <tbody>
              {beat.drums.map((row, drumIndex) => (
                <tr key={drumIndex} className="group">
                  <td className="pr-3 text-right text-sm font-medium text-gray-700 group-hover:text-green-600 group-hover:font-bold transition-colors duration-150 min-w-[3rem]">
                    {DRUMS[drumIndex]}
                  </td>
                  {row.map((active, step) => {
                    const isCurrentStep = isPlaying && step === currentStep;
                    const isPlayingDrum = playingNotes.has(`drum-${drumIndex}-${step}`);
                    
                    return (
                      <td
                        key={step}
                        onClick={() => toggleDrum(drumIndex, step)}
                        className={`w-10 h-10 border-2 cursor-pointer transition-all duration-150 hover:border-green-400 hover:shadow-md ${
                          active ? "bg-green-500 hover:bg-green-600" : "bg-white hover:bg-green-50"
                        } ${
                          isCurrentStep
                            ? "border-orange-400 shadow-lg bg-orange-100"
                            : "border-gray-300"
                        } ${
                          isPlayingDrum && active
                            ? "bg-yellow-300 ring-2 ring-yellow-400"
                            : ""
                        }`}
                      ></td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
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
            className="px-3 py-1 bg-blue-600 text-white rounded cursor-pointer"
          >
            Update From JSON
          </button>
        </div>
      )}
    </div>
  );
}
