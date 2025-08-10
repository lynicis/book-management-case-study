import { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites: async () => {
    return [
      {
        source: "/metrics",
        destination: "/api/metrics",
      },
      {
        source: "/health",
        destination: "/api/health",
      },
    ];
  },
  output: "standalone",
};

export default nextConfig;
