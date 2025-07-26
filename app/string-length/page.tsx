"use client";

import { Suspense } from "react";
import { formatUtf8ByteSize } from "../../lib/utf8";
import { useQueryParam, stringParam } from "../../hooks/useQueryParams";

function StringLengthChecker() {
  const [text, setText] = useQueryParam(stringParam("text", "héllo ✅"));

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">UTF-8 Length Checker</h1>
      <div className="space-y-4">
        <div>
          <label className="block font-medium mb-2" htmlFor="text-input">
            Text:
          </label>
          <textarea
            id="text-input"
            className="w-full border rounded p-2 h-40"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text here"
          />
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <div>Length: {text.length.toLocaleString()} characters</div>
          <div>UTF-8 Size: {formatUtf8ByteSize(text)}</div>
        </div>
      </div>
    </div>
  );
}

export default function StringLengthPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">UTF-8 Length Checker</h1>
          <div>Loading...</div>
        </div>
      }
    >
      <StringLengthChecker />
    </Suspense>
  );
}
