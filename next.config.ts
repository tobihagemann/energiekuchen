import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  output: 'export',
  devIndicators: false,
};

export default nextConfig;
