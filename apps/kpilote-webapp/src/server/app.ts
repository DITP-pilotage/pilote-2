import { createAcmeChallengeRoutes } from '@pilote/kpilote-acme/acmeChallengeRoutes'
import {
  FICHIERS_ORIGIN,
  MEDIA_ORIGINS,
  VIDEO_FINANCES_ORIGIN,
} from '@pilote/kpilote-shared/mediaUrl'
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { authRouter } from '@/server/auth/router'
import { serverEnv } from '@/server/env'

const apiOrigin = new URL(serverEnv.VITE_API_URL).origin
const matomoOrigin = serverEnv.VITE_MATOMO_URL
  ? new URL(serverEnv.VITE_MATOMO_URL).origin
  : undefined

export const app = new Hono()

app.use(
  '*',
  secureHeaders({
    strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload',
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', ...MEDIA_ORIGINS.image],
      mediaSrc: ["'self'", FICHIERS_ORIGIN],
      frameSrc: ["'self'", VIDEO_FINANCES_ORIGIN],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", apiOrigin, ...(matomoOrigin ? [matomoOrigin] : [])],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      objectSrc: ["'none'"],
    },
    referrerPolicy: 'strict-origin-when-cross-origin',
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
  }),
)

app.get('/healthz', (context) => context.text('ok\n'))
// Monté ici, avant le fallback SPA de index.ts qui renverrait index.html.
app.route('/', createAcmeChallengeRoutes({ uploadApiKey: serverEnv.ACME_UPLOAD_API_KEY }))
app.route('/auth', authRouter)
