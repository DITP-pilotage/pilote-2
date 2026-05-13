import {
  type ListSyntheseIndividusQuery,
  type SyntheseIndividusListApiModel,
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

const computeEcartMediane = (
  derniereValeur: Prisma.Decimal | undefined,
  mediane: number | null,
): number | null => {
  if (derniereValeur === undefined || mediane === null) return null
  return derniereValeur.minus(mediane).toNumber()
}

const fetchItemsDemandes = (indicateurId: string, individus: ReadonlyArray<string>) =>
  db().individu.findMany({
    where: { publicId: { in: [...individus] } },
    orderBy: { publicId: 'asc' },
    select: {
      publicId: true,
      referentielId: true,
      valeurs: {
        where: { indicateurId },
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        take: 2,
      },
    },
  })

const fetchValeursRecentesParReferentielId = (
  indicateurId: string,
  referentielIds: ReadonlyArray<string>,
) =>
  db().individu.findMany({
    where: {
      referentielId: { in: [...referentielIds] },
      valeurs: { some: { indicateurId } },
    },
    select: {
      referentielId: true,
      valeurs: {
        where: { indicateurId },
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        take: 1,
        select: { valeur: true },
      },
    },
  })

const computeMedianesParReferentiel = (
  populationRows: ReadonlyArray<{
    referentielId: string
    valeurs: { valeur: Prisma.Decimal }[]
  }>,
): Map<string, number | null> => {
  const valeursParRef = new Map<string, number[]>()
  for (const row of populationRows) {
    const valeur = row.valeurs[0]?.valeur.toNumber()
    if (valeur === undefined) continue
    const arr = valeursParRef.get(row.referentielId) ?? []
    arr.push(valeur)
    valeursParRef.set(row.referentielId, arr)
  }
  const medianeParRef = new Map<string, number | null>()
  for (const [refId, valeurs] of valeursParRef) {
    medianeParRef.set(refId, computeMediane(valeurs))
  }
  return medianeParRef
}

export const listSyntheseIndividus = (
  indicateurPublicId: string,
  params: ListSyntheseIndividusQuery,
): ResultAsync<SyntheseIndividusListApiModel, never> =>
  ResultAsync.fromSafePromise(
    (async () => {
      const indicateur = await db().indicateur.findUniqueOrThrow({
        where: { publicId: indicateurPublicId },
        select: { id: true },
      })
      const itemsRows = await fetchItemsDemandes(indicateur.id, params.individus)
      const referentielIds = [...new Set(itemsRows.map((row) => row.referentielId))]
      const populationRows = referentielIds.length
        ? await fetchValeursRecentesParReferentielId(indicateur.id, referentielIds)
        : []
      const medianeParRef = computeMedianesParReferentiel(populationRows)

      return {
        items: itemsRows.map((row) => ({
          individu: row.publicId,
          variation: computeVariation(row.valeurs),
          ecartMediane: computeEcartMediane(
            row.valeurs[0]?.valeur,
            medianeParRef.get(row.referentielId) ?? null,
          ),
        })),
      }
    })(),
  )
