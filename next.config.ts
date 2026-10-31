import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.0.0.140"],
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;