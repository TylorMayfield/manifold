import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed output: "export" for Electron app - we need dynamic rendering
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Removed distDir and assetPrefix for Electron app
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig;
