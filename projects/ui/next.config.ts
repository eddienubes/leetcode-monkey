import type { NextConfig } from 'next'
import path from "node:path";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@repo/core'],
  output: 'standalone',
  outputFileTracingRoot: path.resolve(process.cwd(), '../../'),
  cleanDistDir: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      // for some reason serverExternalPackages is not working
      config.externals = [...(config.externals || []), '@repo/core']
    }
    return config
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
