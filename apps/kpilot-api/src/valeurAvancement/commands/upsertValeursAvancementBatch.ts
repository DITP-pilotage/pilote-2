import {
  type BatchInvalidErrorEntryApiModel,
  type UpsertValeursAvancementBatchBody,
  type UpsertValeursAvancementBatchResultApiModel,
} from '@pilote/kpilot-shared/valeurAvancement'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { db } from '@/framework/persistence/dbStore'
import { upsertValeursAvancementBatch as upsertValeursAvancementBatchQuery } from '@/generated/prisma/sql'
import { resolveIndicateurForWrite } from '@/indicateur/resolveIndicateurForWrite'

export type BatchInvalidError = {
  type: 'BATCH_INVALID'
  errors: BatchInvalidErrorEntryApiModel[]
}

export type UpsertValeursAvancementBatchError = BatchInvalidError

type BatchItems = UpsertValeursAvancementBatchBody['items']
type IndividuIdsByPublicId = Map<string, string>

export const upsertValeursAvancementBatch = (
  indicateurPublicId: string,
  { items }: UpsertValeursAvancementBatchBody,
): ResultAsync<UpsertValeursAvancementBatchResultApiModel, UpsertValeursAvancementBatchError> =>
  resolveIndicateurForWrite({ indicateurPublicId }).andThen(({ indicateur }) =>
    validateAndResolveIndividus({ indicateurId: indicateur.id, items }).andThen((individus) =>
      executeBatch({ indicateurId: indicateur.id, individus, items }),
    ),
  )

// Pipeline de validation avant toute écriture en base. En pratique l'appelant
// enveloppe la commande dans `withTransaction`, donc cette validation s'exécute
// dans la transaction courante — l'important est qu'elle court-circuite avant
// le premier INSERT : on rassemble toutes les erreurs détectées pour préserver
// la garantie « tout-ou-rien transactionnel » promise au client (on ne veut
// jamais aborter un INSERT à mi-parcours).
const validateAndResolveIndividus = ({
  indicateurId,
  items,
}: {
  indicateurId: string
  items: BatchItems
}): ResultAsync<IndividuIdsByPublicId, BatchInvalidError> => {
  const duplicateErrors = detectDuplicateKeys(items)

  return loadIndividusContext({ indicateurId, items }).andThen(
    ({ individuByPublicId, linkedReferentielIds }) => {
      const inconnuErrors = detectIndividusInconnus({
        items,
        individuByPublicId,
        linkedReferentielIds,
      })
      const errors = [...duplicateErrors, ...inconnuErrors]
      if (errors.length > 0) {
        return errAsync<IndividuIdsByPublicId, BatchInvalidError>({
          type: 'BATCH_INVALID',
          errors,
        })
      }
      const individuIdsByPublicId: IndividuIdsByPublicId = new Map()
      for (const [publicId, individu] of individuByPublicId) {
        individuIdsByPublicId.set(publicId, individu.id)
      }
      return okAsync<IndividuIdsByPublicId, BatchInvalidError>(individuIdsByPublicId)
    },
  )
}

// Détecte les couples `(individu, date)` qui apparaissent plus d'une fois dans le payload.
// Un import « propre » n'a pas de doublon ; on refuse explicitement plutôt que de laisser
// passer un last-write-wins silencieux qui dépendrait de l'ordre d'apparition.
const detectDuplicateKeys = (items: BatchItems): BatchInvalidErrorEntryApiModel[] => {
  const KEY_SEP = '\u0000'
  const indicesByKey = new Map<string, number[]>()
  items.forEach((item, index) => {
    const key = `${item.individu}${KEY_SEP}${item.date}`
    const list = indicesByKey.get(key)
    if (list) list.push(index)
    else indicesByKey.set(key, [index])
  })
  const errors: BatchInvalidErrorEntryApiModel[] = []
  for (const [key, indices] of indicesByKey) {
    if (indices.length > 1) {
      const [individu, date] = key.split(KEY_SEP) as [string, string]
      errors.push({ code: 'DUPLICATE_KEY', indices, individu, date })
    }
  }
  return errors
}

type IndividuRow = { id: string; publicId: string; referentielId: string }

// Charge en deux requêtes ce qu'il faut pour valider chaque item :
//  - tous les individus distincts présents dans le payload (par publicId), avec leur referentielId
//  - parmi leurs référentiels, ceux qui sont effectivement liés à l'indicateur cible.
// Les deux Map/Set permettent ensuite une vérification O(n) sans round-trip supplémentaire.
const loadIndividusContext = ({
  indicateurId,
  items,
}: {
  indicateurId: string
  items: BatchItems
}): ResultAsync<
  { individuByPublicId: Map<string, IndividuRow>; linkedReferentielIds: Set<string> },
  never
> => {
  const distinctIndividuPublicIds = Array.from(new Set(items.map((item) => item.individu)))

  return ResultAsync.fromSafePromise(
    db().individu.findMany({
      where: { publicId: { in: distinctIndividuPublicIds } },
      select: { id: true, publicId: true, referentielId: true },
    }),
  ).andThen((individus) => {
    const individuByPublicId = new Map(individus.map((individu) => [individu.publicId, individu]))
    const distinctReferentielIds = Array.from(
      new Set(individus.map((individu) => individu.referentielId)),
    )
    return ResultAsync.fromSafePromise(
      db().indicateurReferentiel.findMany({
        where: { indicateurId, referentielId: { in: distinctReferentielIds } },
        select: { referentielId: true },
      }),
    ).map((links) => ({
      individuByPublicId,
      linkedReferentielIds: new Set(links.map((link) => link.referentielId)),
    }))
  })
}

// Pour chaque item, l'individu doit (a) exister et (b) appartenir à un référentiel
// effectivement lié à l'indicateur. Toute violation produit une seule erreur
// `INDIVIDU_INCONNU` par publicId — agrégée pour pointer toutes les lignes
// concernées en une seule entrée (DX d'import).
const detectIndividusInconnus = ({
  items,
  individuByPublicId,
  linkedReferentielIds,
}: {
  items: BatchItems
  individuByPublicId: Map<string, IndividuRow>
  linkedReferentielIds: Set<string>
}): BatchInvalidErrorEntryApiModel[] => {
  const indicesByInconnu = new Map<string, number[]>()
  items.forEach((item, index) => {
    const individu = individuByPublicId.get(item.individu)
    if (!individu || !linkedReferentielIds.has(individu.referentielId)) {
      const list = indicesByInconnu.get(item.individu)
      if (list) list.push(index)
      else indicesByInconnu.set(item.individu, [index])
    }
  })
  const errors: BatchInvalidErrorEntryApiModel[] = []
  for (const [individu, indices] of indicesByInconnu) {
    errors.push({ code: 'INDIVIDU_INCONNU', individu, indices })
  }
  return errors
}

// Forme transmise au paramètre `payload.items` de la requête TypedSQL.
// Doit rester en miroir de `prisma/sql/upsertValeursAvancementBatch.sql` (clés extraites
// via `input->>'…'`). On passe `valeur` en string pour préserver la précision décimale
// (numeric(20, 2)) à la traversée du JSON.
type SqlBatchItem = {
  id: string
  individuId: string
  date: string
  valeur: string
}

// Exécute l'upsert atomique en un seul appel TypedSQL. Le `RETURNING (xmax = 0)`
// indique, ligne par ligne, si l'opération a été un INSERT (true) ou un UPDATE (false).
// On agrège pour produire les compteurs renvoyés au client.
const executeBatch = ({
  indicateurId,
  individus,
  items,
}: {
  indicateurId: string
  individus: IndividuIdsByPublicId
  items: BatchItems
}): ResultAsync<UpsertValeursAvancementBatchResultApiModel, never> => {
  const sqlItems: SqlBatchItem[] = items.map((item) => {
    const individuId = individus.get(item.individu)
    if (!individuId) throw new Error(`Individu non résolu: ${item.individu}`)
    return {
      id: uuidv7(),
      individuId,
      date: item.date,
      valeur: item.valeur.toString(),
    }
  })

  return ResultAsync.fromSafePromise(
    db().$queryRawTyped(upsertValeursAvancementBatchQuery(indicateurId, { items: sqlItems })),
  ).map((rows) => {
    const total = rows.length
    const created = rows.reduce((sum, row) => sum + (row.created === true ? 1 : 0), 0)
    return { total, created, updated: total - created }
  })
}
