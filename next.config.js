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
  webpack: (config, { isServer }) => {
    // Add WASM support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      syncWebAssembly: true,
    };

    // Handle .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    // Resolve wasm-pack generated files
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    // Don't run WASM on the server side for now
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push(({ request }, callback) => {
        if (request.endsWith('.wasm')) {
          return callback(null, `commonjs ${request}`);
        }
        callback();
      });
    }

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
