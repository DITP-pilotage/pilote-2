import { describe, expect, it } from 'vitest'

import { ForbiddenError } from '@/framework/errors/AppError'
import { encodeCursor } from '@/framework/persistence/paginate'
import { ProviderType } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'
import { listUtilisateurs } from '@/utilisateur/queries/listUtilisateurs'

const ADMIN_ID = '00000000-0000-0000-0000-000000000201'

describe.concurrent('listUtilisateurs', () => {
  it(
    'liste avec statut et providers dérivés',
    integrationTest(async () => {
      const u1 = await fixtures.utilisateur({ email: 'u1@example.gouv.fr' })
      const u2 = await fixtures.utilisateur({
        email: 'u2@example.gouv.fr',
        identite: { provider: ProviderType.proconnect, providerSub: 'sub-u2-pc' },
      })

      const result = await runAsAdmin(ADMIN_ID, () => listUtilisateurs({}))
      const { items } = result._unsafeUnwrap()
      const byId = new Map(items.map((u) => [u.id, u]))

      expect(byId.get(u1.id)?.status).toBe('en_attente')
      expect(byId.get(u1.id)?.providers).toEqual([])
      expect(byId.get(u2.id)?.status).toBe('actif')
      expect(byId.get(u2.id)?.providers).toEqual(['proconnect'])
    }),
  )

  it(
    'filtre par recherche (email, nom ou prénom) case-insensitive',
    integrationTest(async () => {
      const cible = await fixtures.utilisateur({
        email: 'martin.durand@example.gouv.fr',
        nom: 'Durand',
        prenom: 'Martin',
      })
      await fixtures.utilisateur({ email: 'autre@example.gouv.fr', nom: 'Petit', prenom: 'Claire' })

      const result = await runAsAdmin(ADMIN_ID, () => listUtilisateurs({ recherche: 'DURAND' }))

      const { items, total } = result._unsafeUnwrap()
      expect(total).toBe(1)
      expect(items.map((u) => u.id)).toEqual([cible.id])
    }),
  )

  it(
    'pagine au-delà de la taille de page (tri par id croissant)',
    integrationTest(async () => {
      const created = await fixtures.utilisateur(
        { email: 'p1@example.gouv.fr' },
        { email: 'p2@example.gouv.fr' },
        { email: 'p3@example.gouv.fr' },
        { email: 'p4@example.gouv.fr' },
      )

      const first = await runAsAdmin(ADMIN_ID, () => listUtilisateurs({ pageSize: 3 }))
      const firstPage = first._unsafeUnwrap()
      expect(firstPage.items.map((u) => u.id)).toEqual(created.slice(0, 3).map((u) => u.id))
      expect(firstPage.pagination).toEqual({ cursor: encodeCursor(created[2]!.id), hasMore: true })
      expect(firstPage.total).toBe(4)

      const second = await runAsAdmin(ADMIN_ID, () =>
        listUtilisateurs({ pageSize: 3, cursor: firstPage.pagination.cursor ?? undefined }),
      )
      const secondPage = second._unsafeUnwrap()
      expect(secondPage.items.map((u) => u.id)).toEqual([created[3]!.id])
      expect(secondPage.pagination).toEqual({ cursor: null, hasMore: false })
    }),
  )

  it(
    'rejette une clé CONTRIBUTOR (ForbiddenError)',
    integrationTest(async () => {
      await expect(runAsContributor(ADMIN_ID, () => listUtilisateurs({}))).rejects.toBeInstanceOf(
        ForbiddenError,
      )
    }),
  )
})
