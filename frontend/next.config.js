/** @type {import('next').NextConfig} */

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,

  // Handle images with basePath
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
