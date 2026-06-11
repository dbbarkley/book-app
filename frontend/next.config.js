const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'covers.openlibrary.org',
        pathname: '/b/**',
      },
      {
        protocol: 'http',
        hostname: 'covers.openlibrary.org',
        pathname: '/b/**',
      },
      {
        protocol: 'https',
        hostname: 'books.google.com',
        pathname: '/books/**',
      },
      {
        protocol: 'http',
        hostname: 'books.google.com',
        pathname: '/books/**',
      },
      {
        protocol: 'https',
        hostname: '**.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'prodimage.images-bn.com',
      },
      {
        protocol: 'http',
        hostname: 'prodimage.images-bn.com',
      },
      {
        protocol: 'https',
        hostname: 'www.barnesandnoble.com',
      },
      {
        protocol: 'https',
        hostname: '**.media-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'images-na.ssl-images-amazon.com',
      },
      {
        protocol: 'https',
        hostname: '**.nyt.com',
      },
      {
        protocol: 'https',
        hostname: 'images.isbndb.com',
      },
      {
        protocol: 'https',
        hostname: 'images.penguinrandomhouse.com',
      },
      {
        protocol: 'http',
        hostname: 'images.penguinrandomhouse.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.hardcover.app',
      },
    ],
  },
  webpack: (config, { dev }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@book-app/shared': path.resolve(__dirname, '../shared'),
    }
    config.resolve.extensions.push('.ts', '.tsx')

    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }

    return config
  },
}

module.exports = nextConfig

