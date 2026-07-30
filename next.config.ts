import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: ".next-production",
  output: "export",
  poweredByHeader: false,
  trailingSlash: true,
  experimental: {
    globalNotFound: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    unoptimized: true,
  },
};

export default nextConfig;
