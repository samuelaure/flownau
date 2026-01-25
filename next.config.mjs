/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Allow Remotion to fetch assets from R2
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Skip checks during build (handled by CI) to speed up Docker build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
