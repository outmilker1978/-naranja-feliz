import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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
