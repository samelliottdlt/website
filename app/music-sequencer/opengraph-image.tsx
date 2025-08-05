import { ImageResponse } from "next/og";
import { decodeBeat, NUM_STEPS } from "./util";

export const runtime = "edge";
export const revalidate = 2592000; // 30 days (60 * 60 * 24 * 30)
export const alt = "Music Sequencer thumbnail";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image({
  searchParams,
}: {
  searchParams: { beat?: string };
}) {
  const beat = decodeBeat(searchParams.beat ?? null);

  const square = 24;
  const gap = 2;

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 32,
          background: "#000",
          color: "#fff",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 72, marginBottom: 40 }}>Music Sequencer</div>
        <div style={{ display: "flex", flexDirection: "column", gap }}>
          {beat.drums.map((row, rowIndex) => (
            <div
              key={rowIndex}
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${NUM_STEPS}, ${square}px)`,
                gap,
              }}
            >
              {row.map((active, step) => (
                <div
                  key={step}
                  style={{
                    width: square,
                    height: square,
                    borderRadius: 2,
                    background: active ? "#22c55e" : "#1e1e1e",
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
