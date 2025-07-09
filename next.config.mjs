const nextConfig = {
  output: 'export',
  distDir: './dist',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  eslint: {
    ignoreDuringBuilds: true, // Skip ESLint during build
  },
}

export default nextConfig
