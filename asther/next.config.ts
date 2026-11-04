import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  experimental: { serverActions: { bodySizeLimit: "3mb" } },
  async headers() {
    const origin = process.env.CORS_ORIGIN?.trim();
    const cors =
      origin && origin !== "*"
        ? [
            { key: "Access-Control-Allow-Origin", value: origin },
            {
              key: "Access-Control-Allow-Methods",
              value: "GET,POST,DELETE,OPTIONS",
            },
            {
              key: "Access-Control-Allow-Headers",
              value: "Content-Type,Authorization",
            },
            { key: "Vary", value: "Origin" },
          ]
        : [];
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      ...(cors.length ? [{ source: "/api/chat/:path*", headers: cors }] : []),
    ];
  },
};
export default nextConfig;
