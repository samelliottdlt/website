import { Suspense } from "react";
import type { Metadata } from "next";
import Sequencer from "./Sequencer";

export const metadata: Metadata = {
  title: "Music Sequencer",
  description: "Compose beats in your browser with a simple step sequencer.",
  openGraph: {
    title: "Music Sequencer",
    description: "Compose beats in your browser with a simple step sequencer.",
  },
};

export default function MusicSequencerPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <Sequencer />
    </Suspense>
  );
}
