/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Conditionally configure static export for Hostinger shared webhosting
  ...(process.env.BUILD_TARGET === 'hostinger' ? {
    output: 'export',
    images: {
      unoptimized: true,
    },
  } : {}),
};

module.exports = nextConfig;
