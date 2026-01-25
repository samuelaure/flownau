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
};

export default nextConfig;
