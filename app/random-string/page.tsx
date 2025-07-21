"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef, Suspense } from "react";

const DEFAULT_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const DEFAULT_LENGTH = 32;
const MAX_LENGTH = 1000000; // 1 million character limit
const CHUNK_SIZE = 10000; // Size of chunks for long string generation
const PRESET_LENGTHS = [32, 100, 1000, 10000, 100000, 1000000];

function RandomStringGenerator() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial values from URL params
  const urlLength = Number(searchParams.get("length")) || DEFAULT_LENGTH;
  const urlAllowOverLimit = searchParams.get("allowOverLimit") === "true";
  
  // Initialize states with URL values
  const [length, setLength] = useState(urlLength);
  const [charset, setCharset] = useState(DEFAULT_CHARSET);
  const [result, setResult] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [allowOverLimit, setAllowOverLimit] = useState(urlAllowOverLimit);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const generateButtonRef = useRef<HTMLButtonElement>(null);

  const generateStringWithLength = useCallback(async (targetLength: number) => {
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
      const actualLength = allowOverLimit ? targetLength : Math.min(targetLength, MAX_LENGTH);
      
      // For very long strings, generate in chunks to prevent UI blocking
      if (actualLength > CHUNK_SIZE) {
        let str = "";
        const chunkSize = CHUNK_SIZE;
        
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
  }, [charset, allowOverLimit]);

  const generateString = useCallback(async () => {
    return generateStringWithLength(length);
  }, [generateStringWithLength, length]);

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

  const getUtf8ByteSize = useCallback((str: string) => {
    return new Blob([str]).size;
  }, []);

  const generateWithPresetLength = useCallback((presetLength: number) => {
    setLength(presetLength);
    // Trigger generation with the specific length
    generateStringWithLength(presetLength);
  }, [generateStringWithLength]);

  const handleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLength = Number(e.target.value) || 0;
    if (allowOverLimit) {
      setLength(newLength);
    } else {
      setLength(Math.min(newLength, MAX_LENGTH));
    }
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
    // Only update URL if values have actually changed from URL params
    const currentUrlLength = Number(searchParams.get("length")) || DEFAULT_LENGTH;
    const currentUrlAllowOverLimit = searchParams.get("allowOverLimit") === "true";
    
    if (length !== currentUrlLength || allowOverLimit !== currentUrlAllowOverLimit) {
      const params = new URLSearchParams();
      params.set("length", length.toString());
      if (allowOverLimit) {
        params.set("allowOverLimit", "true");
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [length, allowOverLimit, router, searchParams]);

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
            max={allowOverLimit ? undefined : MAX_LENGTH}
            value={length}
            onChange={handleLengthChange}
            className="border rounded p-1 w-32"
            disabled={isGenerating}
          />
          <span className="ml-2 text-sm text-gray-600">
            {allowOverLimit ? "(no limit)" : `(max: ${MAX_LENGTH.toLocaleString()})`}
          </span>
          {length > MAX_LENGTH && !allowOverLimit && (
            <div className="mt-1 text-sm text-amber-600">
              ⚠️ Length exceeds recommended limit. Enable &quot;Allow Over Limit&quot; below to proceed.
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <input
            id="allow-over-limit"
            type="checkbox"
            checked={allowOverLimit}
            onChange={(e) => setAllowOverLimit(e.target.checked)}
            disabled={isGenerating}
            className="rounded"
          />
          <label htmlFor="allow-over-limit" className="text-sm">
            <span className="font-medium">Allow Over Limit</span>
            <span className="text-gray-600 ml-1">
              (⚠️ Very large strings may cause browser performance issues)
            </span>
          </label>
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
            disabled={isGenerating || (length > MAX_LENGTH && !allowOverLimit)}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isGenerating ? "Generating..." : "Generate"}
          </button>
          <span className="text-sm text-gray-600 self-center">
            (Ctrl/Cmd + Enter)
          </span>
        </div>
        
        <div>
          <label className="block font-medium mb-2">Quick Generate:</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_LENGTHS.map((presetLength) => (
              <button
                key={presetLength}
                type="button"
                onClick={() => generateWithPresetLength(presetLength)}
                disabled={isGenerating || (presetLength > MAX_LENGTH && !allowOverLimit)}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {presetLength.toLocaleString()}
                {presetLength > MAX_LENGTH && !allowOverLimit && (
                  <span className="ml-1 text-amber-600">🔒</span>
                )}
              </button>
            ))}
          </div>
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
            <div className="text-sm text-gray-600 mt-1 space-y-1">
              <div>Length: {result.length.toLocaleString()} characters</div>
              <div>UTF-8 Size: {getUtf8ByteSize(result).toLocaleString()} bytes</div>
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
