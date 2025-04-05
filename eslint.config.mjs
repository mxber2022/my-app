/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Ignores ESLint errors during builds
    ignoreDuringBuilds: true,
  },
  // Other config options if needed
};

module.exports = nextConfig;
