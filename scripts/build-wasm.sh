#!/bin/bash

# Build script for WebAssembly
echo "Building WebAssembly module..."

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "wasm-pack is not installed. Installing..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Build the WASM module
cd wasm
wasm-pack build --target bundler --out-dir ./pkg --out-name website-wasm

echo "WebAssembly build complete!"
echo "Generated files:"
echo "  - wasm/pkg/website-wasm.wasm (binary)"
echo "  - wasm/pkg/website-wasm.js (JS bindings)"
echo "  - wasm/pkg/website-wasm.d.ts (TypeScript definitions)"

# Make the built files available for Next.js
echo "WASM module ready for use in Next.js!"
