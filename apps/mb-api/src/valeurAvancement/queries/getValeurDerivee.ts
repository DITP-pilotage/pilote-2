import { type ValeurDeriveeApiModel } from '@pilote/mb-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { getDernieresValeursPourIndividus } from '@/generated/prisma/sql'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import {
  type IndividuRef,
  resolveValeurDerivee,
  type ValeurSaisie,
} from '@/valeurAvancement/resolveValeurDerivee'

const loadIndividuTree = async (
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
      include: { child: true },
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
  })

  const cible = await db().individu.findUniqueOrThrow({
    where: { publicId: individuPublicId },
  })

  const configurationIndicateurReferentiel = await db().indicateurReferentiel.findUnique({
    where: {
      indicateurId_referentielId: {
        indicateurId: indicateur.id,
        referentielId: cible.referentielId,
      },
    },
  })

  if (!configurationIndicateurReferentiel) {
    throw new ValidationError(
      "L'indicateur n'est pas configuré pour le référentiel de cet individu",
      { indicateur: indicateur.publicId, individu: cible.publicId },
    )
  }

  if (configurationIndicateurReferentiel.fonctionAgregation === 'NONE') {
    throw new ValidationError(
      'Cet indicateur ne se dérive pas depuis ses enfants pour ce référentiel : ' +
        'la valeur doit être saisie directement.',
      { indicateur: indicateur.publicId, individu: cible.publicId },
    )
  }

  const { allIds, enfantsParParent } = await loadIndividuTree(cible.id)

  const rows = await db().$queryRawTyped(getDernieresValeursPourIndividus(indicateur.id, allIds))

  const derniereValeurParIndividu = new Map<string, ValeurSaisie>()
  for (const row of rows) {
    derniereValeurParIndividu.set(row.individuId, {
      valeur: row.valeur,
      date: row.date,
    })
  }

  const { valeurDerivee, contributions, couverture } = resolveValeurDerivee(cible.id, {
    enfantsParParent,
    derniereValeurParIndividu,
  })

  return {
    indicateur: indicateur.publicId,
    individu: cible.publicId,
    fonctionAgregation: configurationIndicateurReferentiel.fonctionAgregation,
    valeurDerivee,
    contributions,
    couverture,
  }
}

export const getValeurDerivee = (
  indicateurPublicId: string,
  individuPublicId: string,
): ResultAsync<ValeurDeriveeApiModel, never> =>
  ResultAsync.fromSafePromise(buildResult(indicateurPublicId, individuPublicId))
