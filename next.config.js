/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
  },
  // Allow embedding as a library
  transpilePackages: ['lucide-react'],
};

module.exports = nextConfig;