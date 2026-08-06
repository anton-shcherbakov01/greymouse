import { withPayload } from '@payloadcms/next/withPayload'

/**
 * Хосты для next/image берём из переменных окружения, чтобы один и тот же
 * образ работал и с локальным хранилищем, и с S3-совместимым бакетом.
 */
const remotePatterns = []

if (process.env.NEXT_PUBLIC_S3_PUBLIC_URL) {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_S3_PUBLIC_URL)
    remotePatterns.push({ protocol: url.protocol.replace(':', ''), hostname: url.hostname })
  } catch {
    // некорректный URL в env не должен ронять сборку
  }
}

if (process.env.NEXT_PUBLIC_SITE_URL) {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SITE_URL)
    remotePatterns.push({ protocol: url.protocol.replace(':', ''), hostname: url.hostname })
  } catch {
    // см. выше
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns,
    deviceSizes: [390, 640, 768, 1024, 1280, 1536, 1920, 2560],
  },
  // Next генерирует AGENTS.md/CLAUDE.md; в этом проекте документация ведётся вручную в docs/.
  agentRules: false,
  // Только для dev: без этого dev-сервер отвечает 403 на запросы к /_next/*
  // с Origin, отличным от localhost (например, при заходе по 127.0.0.1 или по IP
  // машины в локальной сети). На production-сборку не влияет.
  allowedDevOrigins: ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
