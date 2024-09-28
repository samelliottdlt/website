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
};

// Merge MDX config with Next.js config
module.exports = withMDX(nextConfig);
