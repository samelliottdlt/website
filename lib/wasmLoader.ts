/**
 * Custom WASM loader for Next.js compatibility
 * This wrapper handles the async initialization of the WASM module
 */

let wasmModule: any = null;
let initPromise: Promise<any> | null = null;

export async function loadWasm() {
  // Return cached module if already loaded
  if (wasmModule) {
    return wasmModule;
  }

  // Return existing promise if already loading
  if (initPromise) {
    return initPromise;
  }

  // Start loading the WASM module
  initPromise = (async () => {
    try {
      // Import the wasm-pack generated module
      const wasm = await import('../wasm/pkg/website-wasm.js');
      
      // Initialize with the WASM binary
      // The bundler target expects us to pass the wasm file directly
      const wasmBinary = await import('../wasm/pkg/website-wasm_bg.wasm');
      await wasm.default(wasmBinary.default);
      
      wasmModule = wasm;
      return wasm;
    } catch (error) {
      // Reset promises on error so we can retry
      initPromise = null;
      wasmModule = null;
      throw error;
    }
  })();

  return initPromise;
}

// Export individual functions with proper error handling
export async function initWasm() {
  const wasm = await loadWasm();
  return wasm;
}

// Helper to check if WASM is supported
export function isWasmSupported(): boolean {
  return (
    typeof WebAssembly !== 'undefined' &&
    typeof WebAssembly.instantiate === 'function'
  );
}
