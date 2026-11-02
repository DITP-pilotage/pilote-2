import {
  type BatchInvalidErrorEntryApiModel,
  type UpsertValeursAvancementBatchBody,
  type UpsertValeursAvancementBatchResultApiModel,
} from '@pilote/kpilote-shared/valeurAvancement'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { db } from '@/framework/persistence/dbStore'
import { upsertValeursAvancementBatch as upsertValeursAvancementBatchQuery } from '@/generated/prisma/sql'
import {
  type CelluleResolue,
  ensureCellules,
  type ErreurCellule,
  loadContexteEcriturePourSousCube,
  validerCible,
} from '@/dimension/celluleEcriture'
import { resolveIndicateurForWriteData } from '@/indicateur/resolveIndicateurForWrite'

export type BatchInvalidError = {
  type: 'BATCH_INVALID'
  errors: BatchInvalidErrorEntryApiModel[]
}

export type UpsertValeursAvancementBatchError = BatchInvalidError

type BatchItems = UpsertValeursAvancementBatchBody['items']
type CellulesParIndex = CelluleResolue[]

export const upsertValeursAvancementBatch = (
  indicateurPublicId: string,
  { items }: UpsertValeursAvancementBatchBody,
): ResultAsync<UpsertValeursAvancementBatchResultApiModel, UpsertValeursAvancementBatchError> =>
  resolveIndicateurForWriteData({ indicateurPublicId }).andThen(({ indicateur, principalId }) =>
    validateAndResolveCellules({ indicateurId: indicateur.id, principalId, items }).andThen(
      (cellules) => executeBatch({ indicateurId: indicateur.id, cellules, items }),
    ),
  )

// Pipeline de validation avant toute écriture en base. En pratique l'appelant
// enveloppe la commande dans `withTransaction`, donc cette validation s'exécute
// dans la transaction courante — l'important est qu'elle court-circuite avant
// le premier INSERT : on rassemble toutes les erreurs détectées pour préserver
// la garantie « tout-ou-rien transactionnel » promise au client (on ne veut
// jamais aborter un INSERT à mi-parcours).
const validateAndResolveCellules = ({
  indicateurId,
  principalId,
  items,
}: {
  indicateurId: string
  principalId: string
  items: BatchItems
}): ResultAsync<CellulesParIndex, BatchInvalidError> => {
  // Forme historique `individu` : doublons détectés sur la chaîne brute, avant
  // résolution — erreurs strictement identiques à l'existant (synchro pilote-ppg).
  const duplicateErrors = detectDuplicateKeys(
    items.flatMap((item, index) =>
      item.individu !== undefined ? [{ index, key: item.individu, date: item.date }] : [],
    ),
  )

  return ResultAsync.fromSafePromise(
    loadContexteEcriturePourSousCube({
      indicateurId,
      principalId,
      sousCube: 'valeurs',
      cibles: items,
    }),
  ).andThen((ctx) => {
    const cellules: Array<CelluleResolue | null> = []
    const erreursParCle = new Map<string, { erreur: ErreurCellule; indices: number[] }>()
    items.forEach((item, index) => {
      const resultat = validerCible(ctx, item)
      if (resultat.isOk()) {
        cellules.push(resultat.value)
        return
      }
      cellules.push(null)
      const erreur = resultat.error
      const cle = JSON.stringify(erreur)
      const existante = erreursParCle.get(cle)
      if (existante) existante.indices.push(index)
      else erreursParCle.set(cle, { erreur, indices: [index] })
    })
    // Forme `coordonnees` : doublons sur la clé canonique (après résolution).
    const canonicalDuplicateErrors = detectDuplicateKeys(
      items.flatMap((item, index) => {
        const cellule = cellules[index]
        return item.coordonnees !== undefined && cellule
          ? [{ index, key: cellule.publicId, date: item.date, cle: cellule.cle }]
          : []
      }),
    )
    const errors: BatchInvalidErrorEntryApiModel[] = [
      ...duplicateErrors,
      ...[...erreursParCle.values()].map(({ erreur, indices }) =>
        toBatchErrorEntry(erreur, indices),
      ),
      ...canonicalDuplicateErrors,
    ]
    if (errors.length > 0) {
      return errAsync<CellulesParIndex, BatchInvalidError>({ type: 'BATCH_INVALID', errors })
    }
    return okAsync<CellulesParIndex, BatchInvalidError>(cellules as CelluleResolue[])
  })
}

const toBatchErrorEntry = (
  erreur: ErreurCellule,
  indices: number[],
): BatchInvalidErrorEntryApiModel => {
  switch (erreur.type) {
    case 'COORDONNEE_MANQUANTE':
    case 'COORDONNEES_EN_DOUBLE':
      return { code: erreur.type, indices, dimension: erreur.dimension }
    case 'INDIVIDU_INCONNU':
    case 'DIMENSION_NON_DECLAREE':
    case 'CELLULE_AGREGEE':
    case 'HORS_PERIMETRE':
      return { code: erreur.type, indices, individu: erreur.individu }
  }
}

// Détecte les couples `(cellule, date)` qui apparaissent plus d'une fois dans le payload.
// Un import « propre » n'a pas de doublon ; on refuse explicitement plutôt que de laisser
// passer un last-write-wins silencieux qui dépendrait de l'ordre d'apparition.
// `cle` (clé canonique) sert à comparer, `key` (forme lisible) à rapporter.
const detectDuplicateKeys = (
  entries: ReadonlyArray<{ index: number; key: string; date: string; cle?: string }>,
): BatchInvalidErrorEntryApiModel[] => {
  const KEY_SEP = '\u0000'
  const parCle = new Map<string, { key: string; date: string; indices: number[] }>()
  for (const { index, key, date, cle } of entries) {
    const identifiant = `${cle ?? key}${KEY_SEP}${date}`
    const existante = parCle.get(identifiant)
    if (existante) existante.indices.push(index)
    else parCle.set(identifiant, { key, date, indices: [index] })
  }
  const errors: BatchInvalidErrorEntryApiModel[] = []
  for (const { key, date, indices } of parCle.values()) {
    if (indices.length > 1) errors.push({ code: 'DUPLICATE_KEY', indices, individu: key, date })
  }
  return errors
}

// Forme transmise au paramètre `payload.items` de la requête TypedSQL.
// Doit rester en miroir de `prisma/sql/upsertValeursAvancementBatch.sql` (clés extraites
// via `input->>'…'`). On passe `valeur` en string pour préserver la précision décimale
// (numeric(20, 2)) à la traversée du JSON.
type SqlBatchItem = {
  id: string
  celluleId: string
  date: string
  valeur: string
}

// Exécute l'upsert atomique en un seul appel TypedSQL. Le `RETURNING (xmax = 0)`
// indique, ligne par ligne, si l'opération a été un INSERT (true) ou un UPDATE (false).
// On agrège pour produire les compteurs renvoyés au client.
const executeBatch = ({
  indicateurId,
  cellules,
  items,
}: {
  indicateurId: string
  cellules: CellulesParIndex
  items: BatchItems
}): ResultAsync<UpsertValeursAvancementBatchResultApiModel, never> =>
  ResultAsync.fromSafePromise(ensureCellules({ indicateurId, cellules })).andThen((ids) => {
    const sqlItems: SqlBatchItem[] = items.map((item, index) => {
      const celluleId = ids.get(cellules[index]!.cle)
      if (!celluleId) throw new Error(`Cellule non résolue à l'index ${index}`)
      return { id: uuidv7(), celluleId, date: item.date, valeur: item.valeur.toString() }
    })
    return ResultAsync.fromSafePromise(
      db().$queryRawTyped(upsertValeursAvancementBatchQuery(indicateurId, { items: sqlItems })),
    ).map((rows) => {
      const total = rows.length
      const created = rows.reduce((sum, row) => sum + (row.created === true ? 1 : 0), 0)
      return { total, created, updated: total - created }
    })
  })
