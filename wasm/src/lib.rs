mod utils;

use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// Import the `console.log` function from the browser for debugging
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Define a macro to make console.log usage easier
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

// Basic greeting function
#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! Greetings from Rust and WebAssembly 🦀", name)
}

// Fast fibonacci calculation (useful for performance demos)
#[wasm_bindgen]
pub fn fibonacci(n: u32) -> u64 {
    if n <= 1 {
        return n as u64;
    }
    
    let mut a = 0u64;
    let mut b = 1u64;
    
    for _ in 2..=n {
        let temp = a + b;
        a = b;
        b = temp;
    }
    
    b
}

// Prime number checker (good for CPU-intensive operations)
#[wasm_bindgen]
pub fn is_prime(n: u64) -> bool {
    if n < 2 {
        return false;
    }
    if n == 2 {
        return true;
    }
    if n % 2 == 0 {
        return false;
    }
    
    let sqrt_n = (n as f64).sqrt() as u64;
    for i in (3..=sqrt_n).step_by(2) {
        if n % i == 0 {
            return false;
        }
    }
    
    true
}

// Generate prime numbers up to n
#[wasm_bindgen]
pub fn generate_primes(limit: u64) -> Vec<u64> {
    let mut primes = Vec::new();
    
    for i in 2..=limit {
        if is_prime(i) {
            primes.push(i);
        }
    }
    
    primes
}

// Calculate factorial
#[wasm_bindgen]
pub fn factorial(n: u64) -> u64 {
    if n <= 1 {
        1
    } else {
        n * factorial(n - 1)
    }
}

// More complex example: Calculate hash of a string (simple djb2 hash)
#[wasm_bindgen]
pub fn hash_string(input: &str) -> u64 {
    let mut hash = 5381u64;
    
    for byte in input.bytes() {
        hash = hash.wrapping_mul(33).wrapping_add(byte as u64);
    }
    
    hash
}

// UTF-8 byte count (perfect for your website's utility theme!)
#[wasm_bindgen]
pub fn utf8_byte_count(text: &str) -> usize {
    text.len()
}

// Count actual Unicode characters (different from byte count)
#[wasm_bindgen]
pub fn unicode_char_count(text: &str) -> usize {
    text.chars().count()
}

// Advanced string analysis
#[wasm_bindgen]
pub struct StringAnalysis {
    pub byte_count: usize,
    pub char_count: usize,
    pub word_count: usize,
    pub line_count: usize,
}

#[wasm_bindgen]
impl StringAnalysis {
    #[wasm_bindgen(constructor)]
    pub fn new() -> StringAnalysis {
        StringAnalysis {
            byte_count: 0,
            char_count: 0,
            word_count: 0,
            line_count: 0,
        }
    }
}

#[wasm_bindgen]
pub fn analyze_string(text: &str) -> StringAnalysis {
    StringAnalysis {
        byte_count: text.len(),
        char_count: text.chars().count(),
        word_count: text.split_whitespace().count(),
        line_count: text.lines().count().max(1), // At least 1 line even if empty
    }
}

// Pure integer arithmetic performance test (no JS boundary crossings)
#[wasm_bindgen]
pub fn compute_test(iterations: u32) -> f64 {
    let start = js_sys::Date::now();
    
    let mut result = 0i64;
    for i in 0..iterations {
        // Pure integer operations that stay entirely in WASM
        let mut temp = i as i64;
        for _ in 0..10 {
            temp = temp * temp + 1;
            temp = temp % 1000000; // Prevent overflow
            temp = temp + i as i64;
            temp = temp ^ (temp >> 16); // Bit manipulation
        }
        result = result.wrapping_add(temp);
    }
    
    let end = js_sys::Date::now();
    console_log!("WASM compute test completed: {} iterations, result: {}", iterations, result);
    
    end - start
}

// Memory-intensive test that favors WASM (direct memory access)
#[wasm_bindgen]
pub fn memory_intensive_test(size: u32) -> f64 {
    let start = js_sys::Date::now();
    
    // Create and manipulate large arrays
    let mut data: Vec<i32> = Vec::with_capacity(size as usize);
    
    // Fill with computed values
    for i in 0..size {
        data.push((i * 17 + 13) as i32);
    }
    
    // Perform operations on the array
    let mut sum = 0i64;
    for i in 0..size as usize {
        sum += data[i] as i64;
        if i > 0 {
            sum += data[i - 1] as i64;
        }
    }
    
    let end = js_sys::Date::now();
    console_log!("WASM memory test completed: {} elements, sum: {}", size, sum);
    
    end - start
}
