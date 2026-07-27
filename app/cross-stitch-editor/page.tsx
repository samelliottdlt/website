import { Suspense } from "react";
import type { Metadata } from "next";
import CrossStitchEditor from "./Editor";

export const metadata: Metadata = {
  title: "Cross Stitch Editor",
  description:
    "Design cross stitch charts in your browser: full and half stitches, floss counts, and shareable patterns.",
  openGraph: {
    title: "Cross Stitch Editor",
    description:
      "Design cross stitch charts in your browser: full and half stitches, floss counts, and shareable patterns.",
  },
};

export default function CrossStitchEditorPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <CrossStitchEditor />
    </Suspense>
  );
}
