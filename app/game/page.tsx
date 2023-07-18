"use client";

import { useRef } from "react";
import Terminal from "./components/Terminal";

interface TerminalHandle {
  write: (text: string) => void;
}

function Game() {
  const terminalRef = useRef<TerminalHandle>();

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
