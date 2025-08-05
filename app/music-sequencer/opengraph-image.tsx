import { ImageResponse } from "next/og";
import { decodeBeat } from "./util";

export const runtime = "edge";
export const revalidate = 2592000; // 30 days
export const alt = "Music Sequencer thumbnail";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image(props: {
  params?: { [key: string]: string | string[] };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  // Handle case where searchParams might be undefined
  const beatParam = typeof props.searchParams?.beat === 'string' ? props.searchParams.beat : null;
  let beat = decodeBeat(beatParam);
  
  // Check if all drums are inactive and provide a default pattern for better visualization
  const hasAnyActiveDrums = beat.drums.some(row => row.some(active => active));
  if (!hasAnyActiveDrums) {
    // Create a simple default pattern that looks good in social previews
    beat = {
      ...beat,
      drums: beat.drums.map((row, drumIndex) => 
        row.map((_, step) => {
          // Create an engaging pattern:
          if (drumIndex === 0) return step % 4 === 0; // Kick drum every 4 steps
          if (drumIndex === 1) return step % 8 === 4; // Snare on the offbeat
          if (drumIndex === 2) return step % 2 === 1; // Hi-hat on odd steps
          if (drumIndex === 3) return step % 16 === 8; // Open hi-hat occasionally
          return false;
        })
      )
    };
  }

  const square = 28; // Slightly larger squares for better visibility
  const gap = 3; // Slightly larger gap

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 32,
          background: "linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)", // Subtle gradient
          color: "#fff",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px",
        }}
      >
        <div style={{ 
          fontSize: 64, 
          marginBottom: 30,
          fontWeight: "bold",
          background: "linear-gradient(90deg, #22c55e, #10b981)",
          backgroundClip: "text",
          color: "transparent",
        }}>
          Music Sequencer
        </div>
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap,
          padding: "20px",
          borderRadius: "12px",
          background: "rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          {beat.drums.map((row, rowIndex) => (
            <div
              key={rowIndex}
              style={{
                display: "flex",
                flexDirection: "row",
                gap,
              }}
            >
              {row.map((active, step) => (
                <div
                  key={step}
                  style={{
                    width: square,
                    height: square,
                    borderRadius: 4,
                    background: active 
                      ? "#22c55e" 
                      : "rgba(255,255,255,0.1)",
                    border: active 
                      ? "2px solid #16a34a" 
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
