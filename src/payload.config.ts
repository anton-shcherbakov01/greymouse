import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { en } from '@payloadcms/translations/languages/en'
import { ru } from '@payloadcms/translations/languages/ru'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Cases } from './collections/Cases'
import { Categories } from './collections/Categories'
import { Enquiries } from './collections/Enquiries'
import { Media } from './collections/Media'
import { Services } from './collections/Services'
import { Team } from './collections/Team'
import { Users } from './collections/Users'
import { Navigation } from './globals/Navigation'
import { SiteSettings } from './globals/SiteSettings'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// В production загрузки должны жить в S3-совместимом хранилище: файловая система
// контейнера эфемерна. Локально бакет не задан — Payload пишет в /public/media.
const useS3 = Boolean(process.env.S3_BUCKET)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL,
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' — Серая Мышь',
      description: 'Панель управления сайтом студии «Серая Мышь»',
    },
    components: {
      graphics: {
        Logo: '@/components/admin/AdminLogo#AdminLogo',
        Icon: '@/components/admin/AdminIcon#AdminIcon',
      },
    },
  },
  // Админкой пользуется русскоязычная редакция; английский оставлен как запасной.
  i18n: {
    supportedLanguages: { ru, en },
    fallbackLanguage: 'ru',
  },
  collections: [Cases, Services, Categories, Team, Media, Enquiries, Users],
  globals: [SiteSettings, Navigation],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
    push: process.env.NODE_ENV !== 'production',
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  upload: {
    limits: {
      // 25 МБ хватает для постеров и коротких видео и ограничивает злоупотребления.
      fileSize: 25 * 1024 * 1024,
    },
  },
  cors: [process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'].filter(Boolean),
  csrf: [process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'].filter(Boolean),
  plugins: useS3
    ? [
        s3Storage({
          collections: { media: true },
          bucket: process.env.S3_BUCKET as string,
          config: {
            region: process.env.S3_REGION,
            endpoint: process.env.S3_ENDPOINT,
            forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
            },
          },
        }),
      ]
    : [],
})
