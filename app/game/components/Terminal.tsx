"use client";

import React, {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Terminal as xtermTeminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

const Terminal = forwardRef((props, ref) => {
  const terminalRef = useRef(null);
  const term = useRef<xtermTeminal>(new xtermTeminal());
  const fitAddon = useRef(new FitAddon());

  useEffect(() => {
    if (terminalRef.current) {
      term.current.loadAddon(fitAddon.current);
      term.current.open(terminalRef.current);
      fitAddon.current.fit();
    }

    return () => {
      if (term.current) {
        term.current.dispose(); // Dispose the terminal instance on unmount
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    write: (text: string) => {
      term.current?.write(text);
    },
  }));

  return <div ref={terminalRef} style={{ width: "100%", height: "100%" }} />;
});

Terminal.displayName = "Terminal";

export default Terminal;
