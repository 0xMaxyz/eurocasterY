/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: "eurocaster_next",
  assetPrefix: "eurocaster_next",
  rewrites() {
    return [
      { source: "/eurocaster_next/_next/:path*", destination: "/_next/:path*" },
    ];
  },
};

export default nextConfig;
