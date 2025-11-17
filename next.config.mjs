/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export since we're using Clerk (requires server-side features)
  // output: 'export', // REMOVED - incompatible with Clerk
  // distDir: './dist', // REMOVED - use Next.js default .next directory
  eslint: {
    ignoreDuringBuilds: true, // Skip ESLint during build
  },
  images: {
    unoptimized: true, // Since we were using static export, keeping this for now
  },
}

export default nextConfig
