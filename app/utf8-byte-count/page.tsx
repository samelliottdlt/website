'use client';

import { useState, useEffect } from 'react';
import { useWasm, type StringAnalysis } from '../../hooks/useWasm';

export default function Utf8ByteCountPage() {
  const [text, setText] = useState('Hello, World! 🌍🦀');
  const [analysis, setAnalysis] = useState<StringAnalysis | null>(null);
  const [jsAnalysis, setJsAnalysis] = useState<StringAnalysis | null>(null);
  const [performanceComparison, setPerformanceComparison] = useState<{
    wasmTime: number;
    jsTime: number;
  } | null>(null);
  
  const { wasm, loading, error } = useWasm();

  // JavaScript fallback functions for comparison
  const analyzeStringJS = (text: string): StringAnalysis => {
    return {
      byte_count: new TextEncoder().encode(text).length,
      char_count: text.length,
      word_count: text.split(/\s+/).filter(word => word.length > 0).length,
      line_count: Math.max(1, text.split('\n').length),
    };
  };

  const performanceTestJS = (iterations: number): number => {
    const start = performance.now();
    let sum = 0;
    for (let i = 0; i < iterations; i++) {
      sum += Math.sin(i) * Math.cos(i) * Math.tan(i);
    }
    const end = performance.now();
    // Use sum to prevent optimization
    console.log(`JS computation completed with sum: ${sum}`);
    return end - start;
  };

  useEffect(() => {
    if (wasm && text) {
      try {
        const wasmResult = wasm.analyze_string(text);
        setAnalysis(wasmResult);
      } catch (err) {
        console.error('WASM analysis failed:', err);
      }
    }

    // Always compute JS version for comparison
    const jsResult = analyzeStringJS(text);
    setJsAnalysis(jsResult);
  }, [wasm, text]);

  const runPerformanceTest = async () => {
    if (!wasm) return;

    const iterations = 100000;
    
    // Run WASM test
    const wasmTime = wasm.performance_test(iterations);
    
    // Run JS test
    const jsTime = performanceTestJS(iterations);
    
    setPerformanceComparison({ wasmTime, jsTime });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          UTF-8 Byte Counter
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          A text analysis tool powered by WebAssembly and Rust 🦀
        </p>
        <p className="text-sm text-gray-500">
          Enter text below to see detailed character, byte, word, and line counts. 
          This tool demonstrates WebAssembly integration with Next.js.
        </p>
      </div>

      {/* WASM Loading State */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <p className="text-blue-800">Loading WebAssembly module...</p>
          </div>
        </div>
      )}

      {/* WASM Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 font-medium mb-2">WebAssembly Error</h3>
          <p className="text-red-600 text-sm">{error}</p>
          <p className="text-red-500 text-xs mt-2">
            Falling back to JavaScript implementation
          </p>
        </div>
      )}

      {/* Input Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-2">
          Enter text to analyze:
        </label>
        <textarea
          id="text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
          placeholder="Type or paste your text here..."
        />
      </div>

      {/* Results Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* WASM Results */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🦀</span>
            WebAssembly Results
          </h2>
          {wasm && analysis ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">UTF-8 Bytes:</span>
                <span className="font-mono font-semibold">{analysis.byte_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Characters:</span>
                <span className="font-mono font-semibold">{analysis.char_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Words:</span>
                <span className="font-mono font-semibold">{analysis.word_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lines:</span>
                <span className="font-mono font-semibold">{analysis.line_count}</span>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">
              {loading ? 'Loading...' : 'WebAssembly not available'}
            </div>
          )}
        </div>

        {/* JavaScript Results */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">⚡</span>
            JavaScript Results
          </h2>
          {jsAnalysis && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">UTF-8 Bytes:</span>
                <span className="font-mono font-semibold">{jsAnalysis.byte_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Characters:</span>
                <span className="font-mono font-semibold">{jsAnalysis.char_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Words:</span>
                <span className="font-mono font-semibold">{jsAnalysis.word_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lines:</span>
                <span className="font-mono font-semibold">{jsAnalysis.line_count}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Performance Comparison */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Performance Comparison
        </h2>
        <p className="text-gray-600 text-sm mb-4">
          Run a performance test to compare WebAssembly vs JavaScript execution speed
        </p>
        
        <button
          onClick={runPerformanceTest}
          disabled={!wasm || loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium mb-4"
        >
          Run Performance Test
        </button>

        {performanceComparison && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">WebAssembly (100k operations):</span>
              <span className="font-mono font-semibold">
                {performanceComparison.wasmTime.toFixed(2)}ms
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">JavaScript (100k operations):</span>
              <span className="font-mono font-semibold">
                {performanceComparison.jsTime.toFixed(2)}ms
              </span>
            </div>
            <div className="flex justify-between items-center font-semibold">
              <span className="text-gray-800">Speed improvement:</span>
              <span className={`font-mono ${
                performanceComparison.wasmTime < performanceComparison.jsTime 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {(performanceComparison.jsTime / performanceComparison.wasmTime).toFixed(2)}x
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Additional WASM Functions Demo */}
      {wasm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            More WebAssembly Functions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Greeting</h3>
              <p className="text-sm text-gray-600 mb-2">
                {wasm.greet('Developer')}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Fibonacci(20)</h3>
              <p className="text-sm text-gray-600 mb-2 font-mono">
                {wasm.fibonacci(20).toString()}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Is 97 Prime?</h3>
              <p className="text-sm text-gray-600 mb-2">
                {wasm.is_prime(BigInt(97)) ? 'Yes ✅' : 'No ❌'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Technical Details */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">Technical Implementation</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• WebAssembly module compiled from Rust using wasm-pack</li>
          <li>• Custom React hook for WASM module loading and state management</li>
          <li>• Fallback to JavaScript implementation when WASM is unavailable</li>
          <li>• Performance comparison between WASM and JavaScript execution</li>
          <li>• UTF-8 aware byte counting using Rust&apos;s native string handling</li>
        </ul>
      </div>
    </div>
  );
}
