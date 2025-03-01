import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'dist',
  images: {
    domains: ["lh3.googleusercontent.com", "www.shutterstock.com"], // ✅ เพิ่ม Shutterstock
  },
};

export default nextConfig;
