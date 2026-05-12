import {
  type ListValeursRemarquablesForIndicateurQuery,
  type ValeursRemarquablesListApiModel,
} from '@pilote/mb-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import { computeMediane } from '@/valeurAvancement/computeMediane'

const computeVariation = (valeurs: ReadonlyArray<{ valeur: Prisma.Decimal }>): number | null => {
  if (valeurs.length === 0) return null
  const [recente, precedente] = valeurs
  const precedenteValeur = precedente?.valeur ?? new Prisma.Decimal(0)
  return recente!.valeur.minus(precedenteValeur).toNumber()
}

export const listValeursRemarquablesForIndicateur = (
  indicateurPublicId: string,
  params: ListValeursRemarquablesForIndicateurQuery,
): ResultAsync<ValeursRemarquablesListApiModel, never> =>
  ResultAsync.fromSafePromise(
    db().indicateur.findUniqueOrThrow({
      where: { publicId: indicateurPublicId },
      select: { id: true },
    }),
  ).andThen((indicateur) =>
    ResultAsync.fromSafePromise(
      Promise.all([
        db().individu.findMany({
          where: { publicId: { in: params.individus } },
          orderBy: { publicId: 'asc' },
          select: {
            publicId: true,
            valeurs: {
              where: { indicateurId: indicateur.id },
              orderBy: [{ date: 'desc' }, { id: 'desc' }],
              take: 2,
              select: { valeur: true },
            },
          },
        }),
        db().individu.findMany({
          where: { valeurs: { some: { indicateurId: indicateur.id } } },
          select: {
            valeurs: {
              where: { indicateurId: indicateur.id },
              orderBy: [{ date: 'desc' }, { id: 'desc' }],
              take: 1,
              select: { valeur: true },
            },
          },
        }),
      ]),
    ).map(([rows, allRecents]) => {
      const dernieresValeurs = allRecents
        .map((row) => row.valeurs[0]?.valeur.toNumber())
        .filter((v): v is number => v !== undefined)
      const min = dernieresValeurs.length === 0 ? null : Math.min(...dernieresValeurs)
      const max = dernieresValeurs.length === 0 ? null : Math.max(...dernieresValeurs)
      const mediane = computeMediane(dernieresValeurs)

      return {
        items: rows.map((row) => ({
          individu: row.publicId,
          variation: computeVariation(row.valeurs),
        })),
        min,
        max,
        mediane,
      }
    }),
  )
