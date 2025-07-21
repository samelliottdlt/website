"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef, Suspense } from "react";

const DEFAULT_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const DEFAULT_LENGTH = 32;
const MAX_LENGTH = 1000000; // 1 million character limit

function RandomStringGenerator() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialLength = Math.min(Number(searchParams.get("length")) || DEFAULT_LENGTH, MAX_LENGTH);
  const [length, setLength] = useState(initialLength);
  const [charset, setCharset] = useState(DEFAULT_CHARSET);
  const [result, setResult] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const generateButtonRef = useRef<HTMLButtonElement>(null);

  const generateString = useCallback(async () => {
    // Cancel any ongoing generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setIsGenerating(true);
    setResult("");

    try {
      const chars = charset || DEFAULT_CHARSET;
      const actualLength = Math.min(length, MAX_LENGTH);
      
      // For very long strings, generate in chunks to prevent UI blocking
      if (actualLength > 10000) {
        let str = "";
        const chunkSize = 10000;
        
        for (let chunk = 0; chunk < Math.ceil(actualLength / chunkSize); chunk++) {
          if (controller.signal.aborted) {
            throw new Error("Generation cancelled");
          }
          
          const currentChunkSize = Math.min(chunkSize, actualLength - chunk * chunkSize);
          let chunkStr = "";
          
          for (let i = 0; i < currentChunkSize; i++) {
            chunkStr += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          
          str += chunkStr;
          
          // Yield control back to the browser to prevent blocking
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        if (!controller.signal.aborted) {
          setResult(str);
        }
      } else {
        // For shorter strings, generate all at once
        let str = "";
        for (let i = 0; i < actualLength; i++) {
          str += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setResult(str);
      }
    } catch (error) {
      if (error instanceof Error && error.message !== "Generation cancelled") {
        console.error("Error generating string:", error);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [length, charset]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 2000);
    }
  }, [result]);

  const handleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLength = Math.min(Number(e.target.value) || 0, MAX_LENGTH);
    setLength(newLength);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      generateString();
    }
  }, [generateString]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

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
            max={MAX_LENGTH}
            value={length}
            onChange={handleLengthChange}
            className="border rounded p-1 w-32"
            disabled={isGenerating}
          />
          <span className="ml-2 text-sm text-gray-600">
            (max: {MAX_LENGTH.toLocaleString()})
          </span>
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
            disabled={isGenerating}
          />
        </div>
        <div className="flex gap-2">
          <button
            ref={generateButtonRef}
            type="button"
            onClick={generateString}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isGenerating ? "Generating..." : "Generate"}
          </button>
          <span className="text-sm text-gray-600 self-center">
            (Ctrl/Cmd + Enter)
          </span>
        </div>
        
        {result && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Generated String:</span>
              <button
                onClick={copyToClipboard}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                {copyStatus === "copied" ? "Copied!" : copyStatus === "error" ? "Error" : "Copy"}
              </button>
            </div>
            <div className="border rounded p-3 bg-gray-50 max-h-64 overflow-auto">
              <p className="break-all whitespace-pre-wrap font-mono text-sm">
                {result}
              </p>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Length: {result.length.toLocaleString()} characters
            </div>
          </div>
        )}
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
