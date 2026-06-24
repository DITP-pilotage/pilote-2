import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'

import { me } from '@/authentication/routes/me'
import { whoami } from '@/authentication/routes/whoami'
import { commentaireRoutes } from '@/commentaire/routes'
import { niveauConfianceRoutes } from '@/commentaire/niveauConfiance/routes'
import { env } from '@/env'
import { authContext } from '@/framework/auth/authContext'
import { registerErrorHandler } from '@/framework/errors/errorHandler'
import { databaseContext } from '@/framework/persistence/databaseContext'
import { health } from '@/healthcheck/routes/health'
import { indicateurRoutes } from '@/indicateur/routes'
import { individuRoutes } from '@/individu/routes'
import { panierRoutes } from '@/panier/routes'
import { referentielRoutes } from '@/referentiel/routes'
import { sharedMessage } from '@/shared/routes/sharedMessage'
import { objectifIndicateurIndividuRoutes } from '@/objectifIndicateurIndividu/routes'
import { valeurAvancementRoutes } from '@/valeurAvancement/routes'

export const app = new OpenAPIHono()

app.use('*', cors({ origin: env.CORS_ORIGINS, credentials: false }))
app.use('*', databaseContext)
app.use('*', authContext)

app.openAPIRegistry.registerComponent('securitySchemes', 'bearer', {
  type: 'http',
  scheme: 'bearer',
  description:
    'Accepte un access token JWT (utilisateur OIDC) ou une API key au format `pilote_live_<secret>`.',
})

app.get('/', (context) => context.json({ hello: 'world' }))
app.route('/', health)
app.route('/', sharedMessage)
app.route('/', indicateurRoutes)
app.route('/', valeurAvancementRoutes)
app.route('/', objectifIndicateurIndividuRoutes)
app.route('/', referentielRoutes)
app.route('/', individuRoutes)
app.route('/', panierRoutes)
app.route('/', commentaireRoutes)
app.route('/', niveauConfianceRoutes)
app.route('/', me)
app.route('/', whoami)

app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: { title: 'Pilote API', version: '0.1.0' },
  security: [{ bearer: [] }],
})

app.get('/docs', swaggerUI({ url: '/openapi.json' }))

registerErrorHandler(app)
