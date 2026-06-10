import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Subida de fotos/videos a Supabase Storage vía Server Actions.
      bodySizeLimit: '50mb',
    },
  },
}

export default nextConfig
