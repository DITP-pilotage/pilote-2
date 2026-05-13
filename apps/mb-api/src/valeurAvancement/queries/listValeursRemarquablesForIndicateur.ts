import {
  type ListValeursRemarquablesForIndicateurQuery,
  type ValeursRemarquablesListApiModel,
} from '@pilote/mb-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { computeMax } from '@/valeurAvancement/computeMax'
import { computeMediane } from '@/valeurAvancement/computeMediane'
import { computeMin } from '@/valeurAvancement/computeMin'

const fetchReferentielsAvecValeursRecentes = (
  indicateurId: string,
  referentiels: ReadonlyArray<string>,
) =>
  db().referentiel.findMany({
    where: { publicId: { in: [...referentiels] } },
    orderBy: { publicId: 'asc' },
    select: {
      publicId: true,
      individus: {
        where: { valeurs: { some: { indicateurId } } },
        select: {
          valeurs: {
            where: { indicateurId },
            orderBy: [{ date: 'desc' }, { id: 'desc' }],
            take: 1,
            select: { valeur: true },
          },
        },
      },
    },
  })

export const listValeursRemarquablesForIndicateur = (
  indicateurPublicId: string,
  params: ListValeursRemarquablesForIndicateurQuery,
): ResultAsync<ValeursRemarquablesListApiModel, never> =>
  ResultAsync.fromSafePromise(
    db().indicateur.findUniqueOrThrow({
      where: { publicId: indicateurPublicId },
      select: { id: true },
    }),
  )
    .andThen((indicateur) =>
      ResultAsync.fromSafePromise(
        fetchReferentielsAvecValeursRecentes(indicateur.id, params.referentiels),
      ),
    )
    .map((rows) => ({
      items: rows.map((row) => {
        const dernieresValeurs = row.individus
          .map((i) => i.valeurs[0]?.valeur.toNumber())
          .filter((v): v is number => v !== undefined)
        return {
          referentiel: row.publicId,
          min: computeMin(dernieresValeurs),
          max: computeMax(dernieresValeurs),
          mediane: computeMediane(dernieresValeurs),
        }
      }),
    }))
