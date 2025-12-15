const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    ],
  },
  webpack: (config) => {
    // Resolve the shared package
    config.resolve.alias = {
      ...config.resolve.alias,
      '@book-app/shared': path.resolve(__dirname, '../shared'),
    }
    
    // Allow importing TypeScript files from shared
    config.resolve.extensions.push('.ts', '.tsx')
    
    return config
  },
}

module.exports = nextConfig

