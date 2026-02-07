import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',  // Critical for Netlify
  images: {
    unoptimized: true,   // Disable Image Optimization API (not needed on Netlify)
  },
};

export default nextConfig;
