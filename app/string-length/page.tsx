"use client";

import { useState } from "react";
import { formatUtf8ByteSize, utf8ByteCount } from "../../lib/utf8";

export default function StringLengthPage() {
  const [text, setText] = useState("");

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">UTF-8 Length Checker</h1>
      <textarea
        className="w-full border rounded p-2 h-40"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text here"
      />
      <div className="text-sm text-gray-600 space-y-1">
        <div>Length: {text.length.toLocaleString()} characters</div>
        <div>UTF-8 Bytes: {utf8ByteCount(text).toLocaleString()}</div>
        <div>UTF-8 Size: {formatUtf8ByteSize(text)}</div>
      </div>
    </div>
  );
}
