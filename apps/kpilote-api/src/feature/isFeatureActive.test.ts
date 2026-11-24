import { describe, expect, it } from 'vitest'
import { uuidv7 } from 'uuidv7'

import { isFeatureActive } from '@/feature/isFeatureActive'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsUser } from '@/test/runAsPrincipal'

describe.concurrent('isFeatureActive', () => {
  it(
    'renvoie vrai pour une feature ACTIVE, faux pour une feature DESACTIVE',
    integrationTest(async () => {
      const moi = await fixtures.utilisateur()
      const active = await fixtures.feature({ etat: 'ACTIVE' })
      const desactivee = await fixtures.feature({ etat: 'DESACTIVE' })

      expect(await runAsUser(moi.id, () => isFeatureActive(active.key))).toBe(true)
      expect(await runAsUser(moi.id, () => isFeatureActive(desactivee.key))).toBe(false)
    }),
  )

  it(
    'renvoie vrai pour une feature ACTIVE_POUR_UTILISATEUR seulement si l’utilisateur est autorisé',
    integrationTest(async () => {
      const moi = await fixtures.utilisateur()
      const autre = await fixtures.utilisateur()
      const feature = await fixtures.feature({
        etat: 'ACTIVE_POUR_UTILISATEUR',
        utilisateurs: [{ id: moi.id }],
      })

      expect(await runAsUser(moi.id, () => isFeatureActive(feature.key))).toBe(true)
      expect(await runAsUser(autre.id, () => isFeatureActive(feature.key))).toBe(false)
    }),
  )

  it(
    'ne compte que les features ACTIVE pour une clé API ADMIN',
    integrationTest(async () => {
      const active = await fixtures.feature({ etat: 'ACTIVE' })
      const pourUtilisateur = await fixtures.feature({ etat: 'ACTIVE_POUR_UTILISATEUR' })

      expect(await runAsAdmin(uuidv7(), () => isFeatureActive(active.key))).toBe(true)
      expect(await runAsAdmin(uuidv7(), () => isFeatureActive(pourUtilisateur.key))).toBe(false)
    }),
  )

  it(
    'renvoie faux pour une clé inconnue',
    integrationTest(async () => {
      const moi = await fixtures.utilisateur()

      expect(await runAsUser(moi.id, () => isFeatureActive('FEATURE_INCONNUE'))).toBe(false)
    }),
  )
})
