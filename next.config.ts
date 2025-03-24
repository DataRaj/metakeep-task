import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ignoreDuringBuilds: true,
  eslint: {
    ignoreDuringBuilds: true,
  }
  /* config options here */
};

export default nextConfig;
