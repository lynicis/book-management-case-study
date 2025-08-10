import { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites: async () => {
    return [
      {
        source: "/metrics",
        destination: "/api/metrics",
      },
    ];
  },
  output: "standalone",
};

export default nextConfig;
