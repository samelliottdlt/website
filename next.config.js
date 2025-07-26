const withMDX = require("@next/mdx")({
  extension: /\.mdx?$/,
});

const nextConfig = {
  // Support MDX files as pages:
  pageExtensions: ["md", "mdx", "tsx", "ts", "jsx", "js"],
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // WASM support
  webpack: (config) => {
    // Add WASM support - using asyncWebAssembly for better performance
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Handle .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    // Resolve .wasm files properly
    config.resolve.extensions.push('.wasm');

    return config;
  },
  // Ensure static files are properly served
  async headers() {
    return [
      {
        source: "/wasm/:path*",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

// Merge MDX config with Next.js config
module.exports = withMDX(nextConfig);
