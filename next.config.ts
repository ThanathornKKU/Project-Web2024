import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // ✅ ใช้ Dynamic Routing แทน Static Export
  distDir: 'dist',
  images: {
    domains: ["lh3.googleusercontent.com", "www.shutterstock.com"], // ✅ เพิ่ม Shutterstock
  },
  eslint: {
    ignoreDuringBuilds: true, // ปิด ESLint
  },
  typescript: {
    ignoreBuildErrors: true, // ปิด TypeScript Checking
  },
};

export default nextConfig;
