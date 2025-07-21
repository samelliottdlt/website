"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";

const DEFAULT_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const DEFAULT_LENGTH = 32;

function RandomStringGenerator() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialLength = Number(searchParams.get("length")) || DEFAULT_LENGTH;
  const [length, setLength] = useState(initialLength);
  const [charset, setCharset] = useState(DEFAULT_CHARSET);
  const [result, setResult] = useState("");

  const generateString = useCallback(() => {
    const chars = charset || DEFAULT_CHARSET;
    let str = "";
    for (let i = 0; i < length; i++) {
      str += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setResult(str);
  }, [length, charset]);

  useEffect(() => {
    generateString();
  }, [generateString]);

  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("length", length.toString());
    router.replace(`?${params.toString()}`);
  }, [length, router, searchParams]);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Random String Generator</h1>
      <div className="space-y-4">
        <div>
          <label className="mr-2 font-medium" htmlFor="length-input">
            Length:
          </label>
          <input
            id="length-input"
            type="number"
            min="1"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="border rounded p-1 w-24"
          />
        </div>
        <div>
          <label className="mr-2 font-medium" htmlFor="charset-input">
            Character Set:
          </label>
          <input
            id="charset-input"
            type="text"
            value={charset}
            onChange={(e) => setCharset(e.target.value)}
            className="border rounded p-1 w-full"
          />
        </div>
        <button
          type="button"
          onClick={generateString}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Generate
        </button>
        <p className="mt-4 break-all whitespace-pre-wrap">{result}</p>
      </div>
    </div>
  );
}

export default function RandomStringPage() {
  return (
    <Suspense fallback={<div className="p-4 max-w-2xl mx-auto"><h1 className="text-2xl font-bold mb-4">Random String Generator</h1><div>Loading...</div></div>}>
      <RandomStringGenerator />
    </Suspense>
  );
}
