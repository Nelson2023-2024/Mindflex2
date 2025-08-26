import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Move allowedDevOrigins here, directly under nextConfig
  allowedDevOrigins: ['http://192.168.80.1:3000'],

  // Any other experimental flags would still go inside 'experimental'
  experimental: {
    // For example, if you were using 'appDir' in an older version, it would be here:
    // appDir: true,
  },
  /* other config options here */
};

export default nextConfig;