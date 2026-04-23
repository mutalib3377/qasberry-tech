// next.config.mjs
// Next.js configuration for Qasberry.
// Phase 1: basic config with image domains.
// Security headers and CSP are added in Phase 6.

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from these external domains
  images: {
    remotePatterns: [
      {
        // Cloudinary — course thumbnails and community images
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        // Clerk — user profile images
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        // Clerk legacy images
        protocol: 'https',
        hostname: 'images.clerk.dev',
      },
    ],
  },

  // Required for Prisma with Next.js 14
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
}

export default nextConfig
