import { type ValeurDeriveeApiModel } from '@pilote/mb-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { getDernieresValeursPourIndividus } from '@/generated/prisma/sql'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import {
  type IndividuRef,
  resolveValeurDerivee,
  type ValeurSaisie,
} from '@/valeurAvancement/resolveValeurDerivee'

const loadSubtree = async (
  rootIndividuId: string,
): Promise<{
  allIds: string[]
  enfantsParParent: Map<string, IndividuRef[]>
}> => {
  const allIds: string[] = [rootIndividuId]
  const enfantsParParent = new Map<string, IndividuRef[]>()
  let currentLevel: string[] = [rootIndividuId]

  while (currentLevel.length > 0) {
    const relations = await db().relation.findMany({
      where: { parentId: { in: currentLevel } },
      select: {
        parentId: true,
        child: { select: { id: true, publicId: true } },
      },
    })
    if (relations.length === 0) break

    for (const relation of relations) {
      const list = enfantsParParent.get(relation.parentId) ?? []
      list.push({ id: relation.child.id, publicId: relation.child.publicId })
      enfantsParParent.set(relation.parentId, list)
    }

    const nextLevel = relations.map((relation) => relation.child.id)
    allIds.push(...nextLevel)
    currentLevel = nextLevel
  }

  return { allIds, enfantsParParent }
}

const buildResult = async (
  indicateurPublicId: string,
  individuPublicId: string,
): Promise<ValeurDeriveeApiModel> => {
  const principalId = requireCurrentPrincipalId()

  const indicateur = await db().indicateur.findFirstOrThrow({
    where: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
    select: { id: true, publicId: true },
  })

  const cible = await db().individu.findUniqueOrThrow({
    where: { publicId: individuPublicId },
    select: { id: true, publicId: true },
  })

  const { allIds, enfantsParParent } = await loadSubtree(cible.id)

  const rows = await db().$queryRawTyped(
    getDernieresValeursPourIndividus(indicateur.id, allIds),
  )

  const derniereValeurParIndividu = new Map<string, ValeurSaisie>()
  for (const row of rows) {
    if (row.individuId === null || row.date === null || row.valeur === null) continue
    derniereValeurParIndividu.set(row.individuId, {
      valeur: row.valeur,
      date: row.date,
    })
  }

  const resolved = resolveValeurDerivee(cible.id, {
    enfantsParParent,
    derniereValeurParIndividu,
  })

  return {
    indicateur: indicateur.publicId,
    individu: cible.publicId,
    agregateur: 'SUM',
    valeurDerivee: resolved.valeurDerivee,
    contributions: resolved.contributions,
    couverture: resolved.couverture,
  }
}

export const getValeurDerivee = (
  indicateurPublicId: string,
  individuPublicId: string,
): ResultAsync<ValeurDeriveeApiModel, never> =>
  ResultAsync.fromSafePromise(buildResult(indicateurPublicId, individuPublicId))
