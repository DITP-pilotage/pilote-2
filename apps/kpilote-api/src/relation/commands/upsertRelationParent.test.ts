import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import { upsertRelationParent } from '@/relation/commands/upsertRelationParent'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptIds, testRegIds } from '@/test/randomIds'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

const parentsDe = async (publicId: string): Promise<string[]> => {
  const relations = await db().relation.findMany({
    where: { child: { publicId } },
    include: { parent: true },
  })
  return relations.map((relation) => relation.parent.publicId).sort()
}

describe.concurrent('upsertRelationParent', () => {
  it(
    "crée la relation quand l'enfant n'a pas de parent",
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      const [reg] = testRegIds(1)
      await fixtures.individu({ publicId: dept }, { publicId: reg })

      const result = await runAsAdmin('principal-upsert-creation', () =>
        upsertRelationParent(dept, { parent: reg }),
      )

      expect(result.isOk()).toBe(true)
      expect(await parentsDe(dept)).toEqual([reg])
    }),
  )

  it(
    'remplace le parent existant sans laisser de doublon',
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      const [ancien, nouveau] = testRegIds(2)
      await fixtures.relation({ parent: { publicId: ancien }, child: { publicId: dept } })
      await fixtures.individu({ publicId: nouveau })

      const result = await runAsAdmin('principal-upsert-remplacement', () =>
        upsertRelationParent(dept, { parent: nouveau }),
      )

      expect(result.isOk()).toBe(true)
      expect(await parentsDe(dept)).toEqual([nouveau])
    }),
  )

  it(
    'est idempotent : rejouer la même écriture ne crée pas de seconde relation',
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      const [reg] = testRegIds(1)
      await fixtures.individu({ publicId: dept }, { publicId: reg })

      await runAsAdmin('principal-upsert-idem', () => upsertRelationParent(dept, { parent: reg }))
      await runAsAdmin('principal-upsert-idem', () => upsertRelationParent(dept, { parent: reg }))

      expect(await parentsDe(dept)).toEqual([reg])
    }),
  )

  it(
    "refuse qu'un individu soit son propre parent",
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      await fixtures.individu({ publicId: dept })

      const result = await runAsAdmin('principal-upsert-auto', () =>
        upsertRelationParent(dept, { parent: dept }),
      )

      expect(result._unsafeUnwrapErr()).toEqual({ type: 'AUTO_PARENT' })
      expect(await parentsDe(dept)).toEqual([])
    }),
  )

  it(
    'refuse un parent qui est un enfant direct de la cible',
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      const [reg] = testRegIds(1)
      await fixtures.relation({ parent: { publicId: reg }, child: { publicId: dept } })

      const result = await runAsAdmin('principal-upsert-cycle-court', () =>
        upsertRelationParent(reg, { parent: dept }),
      )

      expect(result._unsafeUnwrapErr()).toEqual({ type: 'CYCLE_DETECTE' })
      expect(await parentsDe(reg)).toEqual([])
    }),
  )

  it(
    'refuse un parent qui est un descendant indirect de la cible',
    integrationTest(async () => {
      const [petitEnfant] = testDeptIds(1)
      const [enfant, racine] = testRegIds(2)
      await fixtures.relation(
        { parent: { publicId: racine }, child: { publicId: enfant } },
        { parent: { publicId: enfant }, child: { publicId: petitEnfant } },
      )

      const result = await runAsAdmin('principal-upsert-cycle-long', () =>
        upsertRelationParent(racine, { parent: petitEnfant }),
      )

      expect(result._unsafeUnwrapErr()).toEqual({ type: 'CYCLE_DETECTE' })
    }),
  )

  it(
    "échoue quand l'individu enfant n'existe pas",
    integrationTest(async () => {
      const [reg] = testRegIds(1)
      await fixtures.individu({ publicId: reg })

      await expect(
        runAsAdmin('principal-upsert-enfant-inconnu', () =>
          upsertRelationParent('DEPT-INEXISTANT', { parent: reg }),
        ),
      ).rejects.toThrow()
    }),
  )

  it(
    "échoue quand l'individu parent n'existe pas",
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      await fixtures.individu({ publicId: dept })

      await expect(
        runAsAdmin('principal-upsert-parent-inconnu', () =>
          upsertRelationParent(dept, { parent: 'REG-INEXISTANT' }),
        ),
      ).rejects.toThrow()
    }),
  )

  it(
    "refuse une clé API qui n'est pas ADMIN",
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      const [reg] = testRegIds(1)
      await fixtures.individu({ publicId: dept }, { publicId: reg })

      await expect(
        runAsContributor('principal-upsert-contributor', () =>
          upsertRelationParent(dept, { parent: reg }),
        ),
      ).rejects.toThrow('Cette opération requiert un utilisateur OIDC ou une clé API de rôle ADMIN')
    }),
  )
})
