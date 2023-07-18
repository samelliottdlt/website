"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";

interface TerminalHandle {
  write: (text: string) => void;
}

function Game() {
  const terminalRef = useRef<TerminalHandle>();
  const Terminal = dynamic(() => import("./components/Terminal"), {
    ssr: false,
  });

  const handleClick = () => {
    terminalRef.current?.write("Button clicked\n");
  };

  return (
    <div>
      <h1>Game</h1>
      <div>
        <Terminal ref={terminalRef} />
        <button onClick={handleClick}>Click Me</button>
      </div>
    </div>
  );
}

export default Game;
