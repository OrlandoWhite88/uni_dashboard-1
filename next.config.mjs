const nextConfig = {
  output: 'export',
  distDir: './dist',
  eslint: {
    ignoreDuringBuilds: true, // Skip ESLint during build
  },
}

export default nextConfig
