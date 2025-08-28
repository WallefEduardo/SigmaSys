import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix chunk loading issues
  webpack: (config, { dev }) => {
    if (dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: {
              minChunks: 1,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },
  // Disable strict mode temporarily to avoid double rendering issues
  reactStrictMode: false,
  // Add experimental features for better stability
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
