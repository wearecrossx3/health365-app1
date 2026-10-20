/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The Health365 phone app, served on the web (iPhone users can
  // "Add to Home Screen"). Files live in public/m/.
  async rewrites() {
    return [{ source: "/m", destination: "/m/index.html" }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
