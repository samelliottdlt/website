import { Suspense } from "react";
import Sequencer from "./Sequencer";

export default function MusicSequencerPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <Sequencer />
    </Suspense>
  );
}
