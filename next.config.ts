import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Electron packaging
  output: "standalone",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Optimize for production
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,
  
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      electron: false,
    };
    
    // Externalize modules that shouldn't be bundled
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        // Externalize Electron only
        config.externals.push('electron');
      }
    }
    
    return config;
  },
};

export default nextConfig;
