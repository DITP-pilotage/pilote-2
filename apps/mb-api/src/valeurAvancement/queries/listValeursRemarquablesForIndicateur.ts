import {
  type ListValeursRemarquablesForIndicateurQuery,
  type ValeursRemarquablesListApiModel,
} from '@pilote/mb-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'

const computeVariation = (valeurs: ReadonlyArray<{ valeur: number }>): number | null => {
  if (valeurs.length === 0) return null
  const [recente, precedente] = valeurs
  return recente!.valeur - (precedente?.valeur ?? 0)
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
    ).map((rows) => ({
      items: rows.map((row) => ({
        individu: row.publicId,
        variation: computeVariation(row.valeurs),
      })),
    })),
  )
