import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: ["@eventure/shared"],
  async rewrites() {
    return [
      {
        source: "/",
        has: [{ type: "host", value: "presentation.eventure.cloud" }],
        destination: "/presentation",
      },
    ];
  },
};

export default nextConfig;
