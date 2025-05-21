import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/emi-calculator',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
