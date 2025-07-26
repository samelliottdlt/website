'use client';

import { useState, useEffect } from 'react';
import { useWasm, type StringAnalysis } from '../../hooks/useWasm';

export default function RustPerformanceEvalPage() {
  const [text, setText] = useState('Hello, World! 🌍🦀 This is a performance test comparing Rust WebAssembly with JavaScript!');
  const [analysis, setAnalysis] = useState<StringAnalysis | null>(null);
  const [jsAnalysis, setJsAnalysis] = useState<StringAnalysis | null>(null);
  const [computeTest, setComputeTest] = useState<{
    wasmTime: number;
    jsTime: number;
  } | null>(null);
  const [memoryTest, setMemoryTest] = useState<{
    wasmTime: number;
    jsTime: number;
  } | null>(null);
  const [fibonacciTest, setFibonacciTest] = useState<{
    wasmTime: number;
    jsTime: number;
    result: string;
  } | null>(null);
  
  const { wasm, loading, error } = useWasm();

  // JavaScript fallback functions for comparison
  const analyzeStringJS = (text: string): StringAnalysis => {
    return {
      byte_count: new TextEncoder().encode(text).length,
      char_count: [...text].length, // Use spread operator to count actual Unicode characters
      word_count: text.split(/\s+/).filter(word => word.length > 0).length,
      line_count: Math.max(1, text.split('\n').length),
    };
  };

  const computeTestJS = (iterations: number): number => {
    const start = performance.now();
    let result = 0;
    for (let i = 0; i < iterations; i++) {
      // Pure integer operations equivalent to Rust version
      let temp = i;
      for (let j = 0; j < 10; j++) {
        temp = temp * temp + 1;
        temp = temp % 1000000; // Prevent overflow
        temp = temp + i;
        temp = temp ^ (temp >> 16); // Bit manipulation
      }
      result += temp;
    }
    const end = performance.now();
    console.log(`JS compute test completed with result: ${result}`);
    return end - start;
  };

  const memoryIntensiveTestJS = (size: number): number => {
    const start = performance.now();
    
    // Create and manipulate large arrays
    const data: number[] = new Array(size);
    
    // Fill with computed values
    for (let i = 0; i < size; i++) {
      data[i] = i * 17 + 13;
    }
    
    // Perform operations on the array
    let sum = 0;
    for (let i = 0; i < size; i++) {
      sum += data[i];
      if (i > 0) {
        sum += data[i - 1];
      }
    }
    
    const end = performance.now();
    console.log(`JS memory test completed: ${size} elements, sum: ${sum}`);
    return end - start;
  };

  const fibonacciJS = (n: number): bigint => {
    if (n <= 1) {
      return BigInt(n);
    }
    
    let a = 0n;
    let b = 1n;
    
    for (let i = 2; i <= n; i++) {
      const temp = a + b;
      a = b;
      b = temp;
    }
    
    return b;
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

  const runComputeTest = async () => {
    if (!wasm) return;

    const iterations = 100000;
    
    // Run WASM test
    const wasmTime = wasm.compute_test(iterations);
    
    // Run JS test
    const jsTime = computeTestJS(iterations);
    
    setComputeTest({ wasmTime, jsTime });
  };

  const runMemoryTest = async () => {
    if (!wasm) return;

    const size = 100000; // Array size
    
    // Run WASM test
    const wasmTime = wasm.memory_intensive_test(size);
    
    // Run JS test
    const jsTime = memoryIntensiveTestJS(size);
    
    setMemoryTest({ wasmTime, jsTime });
  };

  const runFibonacciTest = async () => {
    if (!wasm) return;

    const n = 45; // Larger number for more noticeable performance difference
    const iterations = 100; // Run multiple times for better timing accuracy

    // Run WASM test with multiple iterations
    const wasmStart = performance.now();
    let wasmResult;
    for (let i = 0; i < iterations; i++) {
      wasmResult = wasm.fibonacci(n);
    }
    const wasmEnd = performance.now();
    const wasmTime = wasmEnd - wasmStart;

    // Run JS test with multiple iterations
    const jsStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      fibonacciJS(n); // We only need the timing
    }
    const jsEnd = performance.now();
    const jsTime = jsEnd - jsStart;

    setFibonacciTest({
      wasmTime,
      jsTime,
      result: wasmResult ? wasmResult.toString() : '',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Rust Performance Evaluation
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Comparing Rust WebAssembly performance with JavaScript 🦀⚡
        </p>
        <p className="text-sm text-gray-500">
          This exploration demonstrates WebAssembly integration with Next.js and compares 
          performance between Rust-compiled WASM and native JavaScript implementations.
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
            Performance comparisons will use JavaScript-only implementations
          </p>
        </div>
      )}

      {/* Performance Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col h-full">
          <div className="flex-grow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Pure Compute Test
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Integer arithmetic and bit operations (100k iterations)
            </p>
          </div>
          
          <div className="mt-auto">
            <button
              onClick={runComputeTest}
              disabled={!wasm || loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer text-white px-4 py-2 rounded-md font-medium mb-4 w-full"
            >
              Run Compute Test
            </button>

            <div className="min-h-[140px]">
              {computeTest && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Rust WASM:</span>
                    <span className="font-mono font-semibold text-green-600">
                      {computeTest.wasmTime.toFixed(2)}ms
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">JavaScript:</span>
                    <span className="font-mono font-semibold text-blue-600">
                      {computeTest.jsTime.toFixed(2)}ms
                    </span>
                  </div>
                  <div className="flex justify-between items-center font-semibold border-t pt-2">
                    <span className="text-gray-800">Speed improvement:</span>
                    <span className={`font-mono ${
                      computeTest.wasmTime < computeTest.jsTime 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {(computeTest.jsTime / computeTest.wasmTime).toFixed(2)}x
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col h-full">
          <div className="flex-grow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Memory Operations Test
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Array creation and manipulation (100k elements)
            </p>
          </div>
          
          <div className="mt-auto">
            <button
              onClick={runMemoryTest}
              disabled={!wasm || loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer text-white px-4 py-2 rounded-md font-medium mb-4 w-full"
            >
              Run Memory Test
            </button>

            <div className="min-h-[140px]">
              {memoryTest && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Rust WASM:</span>
                    <span className="font-mono font-semibold text-green-600">
                      {memoryTest.wasmTime.toFixed(2)}ms
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">JavaScript:</span>
                    <span className="font-mono font-semibold text-blue-600">
                      {memoryTest.jsTime.toFixed(2)}ms
                    </span>
                  </div>
                  <div className="flex justify-between items-center font-semibold border-t pt-2">
                    <span className="text-gray-800">Speed improvement:</span>
                    <span className={`font-mono ${
                      memoryTest.wasmTime < memoryTest.jsTime 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {(memoryTest.jsTime / memoryTest.wasmTime).toFixed(2)}x
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col h-full">
          <div className="flex-grow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Fibonacci Calculation Test
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Compare algorithm performance (Fibonacci 45, 100 iterations)
            </p>
          </div>
          
          <div className="mt-auto">
            <button
              onClick={runFibonacciTest}
              disabled={!wasm || loading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer text-white px-4 py-2 rounded-md font-medium mb-4 w-full"
            >
              Run Fibonacci Test
            </button>

            <div className="min-h-[140px]">
              {fibonacciTest && (
                <div className="mt-4 space-y-2">
                  <div className="text-xs text-gray-500 mb-2">
                    Result: {fibonacciTest.result.slice(0, 20)}...
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Rust WASM:</span>
                    <span className="font-mono font-semibold text-green-600">
                      {fibonacciTest.wasmTime.toFixed(3)}ms
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">JavaScript:</span>
                    <span className="font-mono font-semibold text-blue-600">
                      {fibonacciTest.jsTime.toFixed(3)}ms
                    </span>
                  </div>
                  <div className="flex justify-between items-center font-semibold border-t pt-2">
                    <span className="text-gray-800">Speed improvement:</span>
                    <span className={`font-mono ${
                      fibonacciTest.wasmTime < fibonacciTest.jsTime 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {fibonacciTest.jsTime > 0 
                        ? (fibonacciTest.jsTime / fibonacciTest.wasmTime).toFixed(2) + 'x'
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* String Analysis Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          String Analysis Comparison
        </h2>
        <p className="text-gray-600 text-sm mb-4">
          Compare string processing performance between Rust and JavaScript
        </p>

        <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-2">
          Enter text to analyze:
        </label>
        <textarea
          id="text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y mb-4"
          placeholder="Type or paste your text here..."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* WASM Results */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">🦀</span>
              Rust WebAssembly
            </h3>
            {wasm && analysis ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">UTF-8 Bytes:</span>
                  <span className="font-mono font-semibold">{analysis.byte_count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Characters:</span>
                  <span className="font-mono font-semibold">{analysis.char_count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Words:</span>
                  <span className="font-mono font-semibold">{analysis.word_count}</span>
                </div>
                <div className="flex justify-between text-sm">
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
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">⚡</span>
              JavaScript
            </h3>
            {jsAnalysis && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">UTF-8 Bytes:</span>
                  <span className="font-mono font-semibold">{jsAnalysis.byte_count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Characters:</span>
                  <span className="font-mono font-semibold">{jsAnalysis.char_count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Words:</span>
                  <span className="font-mono font-semibold">{jsAnalysis.word_count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Lines:</span>
                  <span className="font-mono font-semibold">{jsAnalysis.line_count}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional WASM Functions Demo */}
      {wasm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Additional Rust Functions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Logging</h3>
              <p className="text-sm text-gray-600 mb-2">
                {wasm.greet('Explorer')}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Prime Check</h3>
              <p className="text-sm text-gray-600 mb-2">
                Is 97 prime? {wasm.is_prime(BigInt(97)) ? '✅ Yes' : '❌ No'}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Hash Function</h3>
              <p className="text-xs text-gray-600 mb-2 font-mono">
                Hash: {wasm.hash_string('Hello').toString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
