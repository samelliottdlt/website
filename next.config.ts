import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Game of the Year artwork from the RAWG API.
    remotePatterns: [new URL("https://media.rawg.io/media/**")],
  },
  experimental: {
    // This project aliases the `typescript` dependency to the TypeScript 6
    // compatibility package (`@typescript/typescript6`) while using the
    // TypeScript 7 native compiler for the standalone `tsc` CLI. Next.js 16.3
    // enabled `useTypeScriptCli` by default, which shells out to
    // `typescript/bin/tsc` — a binary the compatibility package does not
    // provide (it exposes `bin/tsc6`). Opt back into the TypeScript compiler
    // API, which the compatibility package does provide, so `next build` can
    // type check without a standard `tsc` binary.
    useTypeScriptCli: false,
  },
};

export default nextConfig;
