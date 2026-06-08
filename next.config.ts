import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 同一Wi-Fi内のスマホから `npm run dev` にアクセスするときに必要
  allowedDevOrigins: ["192.168.3.170"],
  async headers() {
    return [
      {
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
