import { createAcmeChallengeRoutes } from '@pilote/kpilote-acme/acmeChallengeRoutes'

import { env } from '@/env'

export const acmeRoutes = createAcmeChallengeRoutes({ uploadApiKey: env.ACME_UPLOAD_API_KEY })
