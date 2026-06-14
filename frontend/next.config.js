/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Cloudflare Pages requires output to be compatible with Edge Runtime
  // When using next-on-pages, it automatically configures target environments.
};

module.exports = nextConfig;
