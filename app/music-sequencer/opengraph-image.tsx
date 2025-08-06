import { ImageResponse } from "next/og";

export const runtime = "edge";
export const revalidate = 2592000; // 30 days
export const alt = "Music Sequencer thumbnail";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

// Note: In Next.js App Router, opengraph-image files don't receive searchParams
// This is a known limitation. The image will show default empty grids.
// For dynamic opengraph images based on URL params, consider using a regular API route
// that generates images instead of the opengraph-image convention.

export default async function Image() {
  // Create a more compact static beat pattern for opengraph
  const beat = {
    bpm: 120,
    // Reduce synth to just a few key rows for better visibility
    synth: Array(8)
      .fill(null)
      .map((_, rowIndex) =>
        Array(16)
          .fill(false)
          .map((_, step) => {
            // Create a simple but visible melody pattern
            if (rowIndex === 1) return step === 0 || step === 8; // Root note
            if (rowIndex === 3) return step === 4 || step === 12; // Fifth
            if (rowIndex === 5)
              return step === 2 || step === 6 || step === 10 || step === 14; // Rhythm
            if (rowIndex === 7) return step === 7 || step === 15; // Accent
            return false;
          }),
      ),
    // Keep the drum pattern but make it more prominent
    drums: [
      // Kick drum - strong pattern
      Array(16)
        .fill(false)
        .map(
          (_, step) => step === 0 || step === 4 || step === 8 || step === 12,
        ),
      // Snare - backbeat
      Array(16)
        .fill(false)
        .map((_, step) => step === 4 || step === 12),
      // Hi-hat - consistent rhythm
      Array(16)
        .fill(false)
        .map((_, step) => step % 2 === 1),
    ],
    rootNote: "C",
    scale: "major",
  };

  const square = 20; // Smaller squares for better fit
  const gap = 2; // Smaller gap

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 32,
          background: "linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)",
          color: "#fff",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px",
          gap: "30px",
        }}
      >
        {/* Synth Grid - Top */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap,
            padding: "20px",
            borderRadius: "12px",
            background: "rgba(59, 130, 246, 0.1)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
          }}
        >
          {beat.synth.map((row: boolean[], rowIndex: number) => (
            <div
              key={rowIndex}
              style={{
                display: "flex",
                flexDirection: "row",
                gap,
              }}
            >
              {row.map((active: boolean, step: number) => (
                <div
                  key={step}
                  style={{
                    width: square,
                    height: square,
                    borderRadius: 3,
                    background: active ? "#3b82f6" : "rgba(255,255,255,0.1)",
                    border: active
                      ? "1px solid #2563eb"
                      : "1px solid rgba(255,255,255,0.05)",
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Drum Grid - Bottom */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap,
            padding: "20px",
            borderRadius: "12px",
            background: "rgba(34, 197, 94, 0.1)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
          }}
        >
          {beat.drums.map((row: boolean[], rowIndex: number) => (
            <div
              key={rowIndex}
              style={{
                display: "flex",
                flexDirection: "row",
                gap,
              }}
            >
              {row.map((active: boolean, step: number) => (
                <div
                  key={step}
                  style={{
                    width: square,
                    height: square,
                    borderRadius: 3,
                    background: active ? "#22c55e" : "rgba(255,255,255,0.1)",
                    border: active
                      ? "1px solid #16a34a"
                      : "1px solid rgba(255,255,255,0.05)",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
