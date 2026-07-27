import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import { supprimerRelation } from '@/relation/commands/supprimerRelation'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptIds, testRegIds } from '@/test/randomIds'
import { runAsAdmin, runAsContributor, runAsUser } from '@/test/runAsPrincipal'

const compteRelations = (publicId: string) =>
  db().relation.count({ where: { child: { publicId } } })

describe.concurrent('supprimerRelation', () => {
  it(
    "supprime la relation de l'individu",
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      const [reg] = testRegIds(1)
      await fixtures.relation({ parent: { publicId: reg }, child: { publicId: dept } })

      const result = await runAsAdmin('principal-delete-ok', () => supprimerRelation(dept))

      expect(result.isOk()).toBe(true)
      expect(await compteRelations(dept)).toBe(0)
    }),
  )

  it(
    "réussit sans rien faire quand l'individu n'a pas de parent",
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      await fixtures.individu({ publicId: dept })

      const result = await runAsAdmin('principal-delete-idem', () => supprimerRelation(dept))

      expect(result.isOk()).toBe(true)
      expect(await compteRelations(dept)).toBe(0)
    }),
  )

  it(
    'ne touche pas aux relations des autres individus',
    integrationTest(async () => {
      const [cible, voisin] = testDeptIds(2)
      const [reg] = testRegIds(1)
      await fixtures.relation(
        { parent: { publicId: reg }, child: { publicId: cible } },
        { parent: { publicId: reg }, child: { publicId: voisin } },
      )

      await runAsAdmin('principal-delete-isolation', () => supprimerRelation(cible))

      expect(await compteRelations(voisin)).toBe(1)
    }),
  )

  it(
    "refuse une clé API qui n'est pas ADMIN",
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      const [reg] = testRegIds(1)
      await fixtures.relation({ parent: { publicId: reg }, child: { publicId: dept } })

      await expect(
        runAsContributor('principal-delete-contributor', () => supprimerRelation(dept)),
      ).rejects.toThrow('Cette opération requiert une clé API de rôle ADMIN')
    }),
  )

  it(
    'refuse un utilisateur OIDC : la hiérarchie ne se modifie que par clé ADMIN',
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      const [reg] = testRegIds(1)
      await fixtures.relation({ parent: { publicId: reg }, child: { publicId: dept } })

      await expect(
        runAsUser('utilisateur-delete-oidc', () => supprimerRelation(dept)),
      ).rejects.toThrow('Cette opération requiert une clé API de rôle ADMIN')
    }),
  )
})
