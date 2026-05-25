import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 同一Wi-Fi内のスマホから `npm run dev` にアクセスするときに必要
  allowedDevOrigins: ["192.168.3.170"],
};

export default nextConfig;
