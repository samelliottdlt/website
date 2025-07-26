# WebAssembly Integration with Rust

This project includes WebAssembly (WASM) support using Rust and wasm-pack, allowing high-performance code to run in the browser.

## Prerequisites

- [Rust](https://rustup.rs/) (rustc, cargo, rustup)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/) (automatically installed by build script)

## Structure

```
wasm/                   # Rust WASM project
├── Cargo.toml         # Rust dependencies and configuration
├── src/
│   ├── lib.rs         # Main WASM library with exported functions
│   └── utils.rs       # Utility functions and initialization
public/wasm/           # Generated WASM files (after build)
├── website-wasm.wasm  # Compiled WebAssembly binary
├── website-wasm.js    # JavaScript bindings
└── website-wasm.d.ts  # TypeScript definitions
hooks/useWasm.ts       # React hook for WASM integration
```

## Available Functions

The WASM module exports the following functions:

### Text Analysis
- `greet(name: string)` - Returns a greeting message
- `utf8_byte_count(text: string)` - Count UTF-8 bytes in text
- `unicode_char_count(text: string)` - Count Unicode characters
- `analyze_string(text: string)` - Complete text analysis

### Mathematical Functions
- `fibonacci(n: number)` - Calculate Fibonacci number
- `factorial(n: bigint)` - Calculate factorial
- `is_prime(n: bigint)` - Check if number is prime
- `generate_primes(limit: bigint)` - Generate primes up to limit
- `hash_string(input: string)` - Simple hash function

### Performance Testing
- `performance_test(iterations: number)` - Benchmark computation

## Building WASM

### Quick Build
```bash
npm run build:wasm
```

### Development with Auto-rebuild
```bash
npm run dev:wasm
```

### Manual Build
```bash
cd wasm
wasm-pack build --target web --out-dir ../public/wasm --out-name website-wasm
```

## Usage in React

### Using the Hook
```typescript
import { useWasm } from '../hooks/useWasm';

function MyComponent() {
  const { wasm, loading, error } = useWasm();

  if (loading) return <div>Loading WASM...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!wasm) return <div>WASM not available</div>;

  return (
    <div>
      <p>{wasm.greet('World')}</p>
      <p>Fibonacci(10): {wasm.fibonacci(10).toString()}</p>
    </div>
  );
}
```

### Direct Import (Advanced)
```typescript
// Only works after WASM files are built
import init, { analyze_string } from '/wasm/website-wasm.js';

async function useWasmDirectly() {
  await init(); // Initialize the WASM module
  const result = analyze_string('Hello, World!');
  console.log(result);
}
```

## Error Handling

The `useWasm` hook provides comprehensive error handling:

- **Loading State**: Shows when WASM is being loaded
- **Error State**: Captures and displays any loading errors
- **Fallback**: Use JavaScript implementations when WASM fails
- **Browser Compatibility**: Checks for WebAssembly support

## Performance Considerations

### When to Use WASM
- CPU-intensive computations
- Mathematical operations
- String processing at scale
- Algorithms that benefit from Rust's performance

### When to Use JavaScript
- Simple operations
- DOM manipulation
- Small computations
- One-time calculations

## Browser Compatibility

WebAssembly is supported in:
- Chrome 57+
- Firefox 52+
- Safari 11+
- Edge 16+

The hook automatically detects support and falls back gracefully.

## Development Tips

### Debugging WASM
1. Use `console_log!` macro in Rust for debugging
2. Enable panic hooks for better error messages
3. Use browser devtools to inspect WASM modules

### Optimizing Build Size
1. Use `wee_alloc` for smaller binaries (enabled by default)
2. Optimize for size: `wasm-pack build --target web -- --release`
3. Remove unused features from Cargo.toml

### Adding New Functions
1. Add function to `wasm/src/lib.rs` with `#[wasm_bindgen]`
2. Update TypeScript types in `hooks/useWasm.ts`
3. Rebuild with `npm run build:wasm`

## Troubleshooting

### WASM Not Loading
- Check that files exist in `public/wasm/`
- Verify Next.js is serving files correctly
- Check browser console for errors

### Build Failures
- Ensure Rust and wasm-pack are installed
- Check Cargo.toml for dependency issues
- Clear target directory: `cd wasm && cargo clean`

### Type Errors
- Rebuild WASM to generate fresh TypeScript definitions
- Check that types in `useWasm.ts` match exported functions
- Use `@ts-ignore` for dynamic imports if needed

## Example Implementation

See `/app/rust-performance-eval/page.tsx` for a complete example that demonstrates:

- WASM integration with React
- Performance comparison between Rust and JavaScript
- Mathematical computation benchmarks
- String analysis comparisons
- Error handling and fallbacks
- Real-time performance evaluation
