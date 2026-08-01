import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable filesystem caching in development to prevent OneDrive file-locking ENOENT corruption
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
