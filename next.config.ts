import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  output: 'export',
  devIndicators: false,
  agentRules: false,
};

export default nextConfig;
