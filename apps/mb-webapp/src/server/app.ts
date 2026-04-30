import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { authRouter } from '@/server/auth/router'
import { serverEnv } from '@/server/env'

const apiOrigin = new URL(serverEnv.VITE_API_URL).origin

export const app = new Hono()

app.use(
  '*',
  secureHeaders({
    strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload',
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", apiOrigin],
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
app.route('/auth', authRouter)
