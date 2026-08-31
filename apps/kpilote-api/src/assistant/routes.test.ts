import { describe, expect, it } from 'vitest'

import { assistantRoutes } from '@/assistant/routes'
import { buildTestApp } from '@/test/buildTestApp'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

const buildApp = () => buildTestApp(assistantRoutes)
const conversationId = '018f3a2b-0000-7000-8000-000000000001'

const corps = (surcharge: Record<string, unknown> = {}) =>
  JSON.stringify({
    surface: 'ask-libre',
    conversationId,
    messages: [{ id: 'm1', role: 'user', parts: [{ type: 'text', text: 'Bonjour' }] }],
    ...surcharge,
  })

const appeler = (cleBrute: string | null, body: string) =>
  buildApp().request('/assistant/chat', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(cleBrute ? { Authorization: `Bearer ${cleBrute}` } : {}),
    },
    body,
  })

describe.concurrent('POST /assistant/chat', () => {
  it(
    'renvoie 401 sans authentification',
    integrationTest(async () => {
      expect((await appeler(null, corps())).status).toBe(401)
    }),
  )

  it(
    'renvoie 400 sur une surface que le moteur ne sert pas',
    integrationTest(async () => {
      const cleBrute = 'pilote_live_assistant_surface_inconnue_ok'
      await fixtures.apiKey({ rawKey: cleBrute })
      expect((await appeler(cleBrute, corps({ surface: 'ask-entite' }))).status).toBe(400)
    }),
  )

  it(
    'renvoie 400 quand conversationId n’est pas un uuid',
    integrationTest(async () => {
      const cleBrute = 'pilote_live_assistant_uuid_invalide_okay'
      await fixtures.apiKey({ rawKey: cleBrute })
      expect((await appeler(cleBrute, corps({ conversationId: 'pas-un-uuid' }))).status).toBe(400)
    }),
  )

  it(
    'renvoie 400 sur un modèle hors liste fermée',
    integrationTest(async () => {
      const cleBrute = 'pilote_live_assistant_modele_hors_liste'
      await fixtures.apiKey({ rawKey: cleBrute })
      expect((await appeler(cleBrute, corps({ modele: 'gpt-4' }))).status).toBe(400)
    }),
  )
})

const evaluer = (cleBrute: string, body: Record<string, unknown>) =>
  buildApp().request(`/assistant/conversations/${conversationId}/evaluation`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${cleBrute}` },
    body: JSON.stringify(body),
  })

describe.concurrent('POST /assistant/conversations/{id}/evaluation', () => {
  it(
    'refuse un feedback négatif sans catégorie',
    integrationTest(async () => {
      const cleBrute = 'pilote_live_assistant_eval_sans_categ_ok'
      await fixtures.apiKey({ rawKey: cleBrute })
      expect((await evaluer(cleBrute, { evaluation: 'NEGATIVE', categories: [] })).status).toBe(400)
    }),
  )

  it(
    'refuse la catégorie AUTRE sans commentaire',
    integrationTest(async () => {
      const cleBrute = 'pilote_live_assistant_eval_autre_vide_ok'
      await fixtures.apiKey({ rawKey: cleBrute })
      expect(
        (await evaluer(cleBrute, { evaluation: 'NEGATIVE', categories: ['AUTRE'] })).status,
      ).toBe(400)
    }),
  )

  it(
    'accepte un feedback positif sans commentaire',
    integrationTest(async () => {
      const cleBrute = 'pilote_live_assistant_eval_positif_okay'
      await fixtures.apiKey({ rawKey: cleBrute })
      expect((await evaluer(cleBrute, { evaluation: 'POSITIVE' })).status).toBe(204)
    }),
  )

  it(
    'reste en 204 sur une conversation sans tour enregistré',
    integrationTest(async () => {
      const cleBrute = 'pilote_live_assistant_eval_sans_tour_ok'
      await fixtures.apiKey({ rawKey: cleBrute })
      expect(
        (await evaluer(cleBrute, { evaluation: 'NEGATIVE', categories: ['INCOMPREHENSION'] }))
          .status,
      ).toBe(204)
    }),
  )
})
