import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        // Service worker must always be revalidated, otherwise a stale nf-v2 SW
        // keeps controlling pages and kills /api/storage media fetches.
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    // Local public assets don't need remotePatterns. All storage-backed images
    // are served same-origin through our /api/storage proxy, so no remote
    // hostname allowlist is required for them.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 400, 640, 768, 828, 1080, 1200, 1920, 2560],
    imageSizes: [64, 96, 128, 256, 384, 512],
  },
};

export default nextConfig;
