import {
  type BatchInvalidErrorEntryApiModel,
  type UpsertValeursAvancementBatchBody,
  type UpsertValeursAvancementBatchResultApiModel,
} from '@pilote/kpilote-shared/valeurAvancement'
import { err, ok, type Result, ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { combinaisonKey, upsertCombinaisons } from '@/axe/combinaison'
import {
  loadModalitesContext,
  type ModalitesContext,
  type RequestedModalite,
  validateSaisieModalites,
} from '@/axe/requestedModalites'
import { db } from '@/framework/persistence/dbStore'
import { upsertValeursAvancementBatch as upsertValeursAvancementBatchQuery } from '@/generated/prisma/sql'
import { resolveIndicateurForWriteData } from '@/indicateur/resolveIndicateurForWrite'
import {
  aggregateModalitesErrors,
  detectDuplicateKeys,
  type ModalitesByItem,
} from '@/valeurAvancement/batchErrors'

export type BatchInvalidError = {
  type: 'BATCH_INVALID'
  errors: BatchInvalidErrorEntryApiModel[]
}

export type UpsertValeursAvancementBatchError = BatchInvalidError

type BatchItems = UpsertValeursAvancementBatchBody['items']

// Cellule résolue d'un item : l'individu et ses modalités (une feuille par axe
// déclaré, dans l'ordre des axes ; aucune pour un indicateur sans axe).
type ResolvedCellule = { individuId: string; modalites: RequestedModalite[] }

const performBatch = async ({
  indicateurPublicId,
  items,
}: {
  indicateurPublicId: string
  items: BatchItems
}): Promise<
  Result<UpsertValeursAvancementBatchResultApiModel, UpsertValeursAvancementBatchError>
> => {
  const resolved = await resolveIndicateurForWriteData({ indicateurPublicId })
  if (resolved.isErr()) return err(resolved.error)
  const indicateurId = resolved.value.indicateur.id

  const cellules = await validateAndResolveCellules({ indicateurId, items })
  if (cellules.isErr()) return err(cellules.error)

  return ok(await executeBatch({ indicateurId, cellules: cellules.value, items }))
}

export const upsertValeursAvancementBatch = (
  indicateurPublicId: string,
  { items }: UpsertValeursAvancementBatchBody,
): ResultAsync<UpsertValeursAvancementBatchResultApiModel, UpsertValeursAvancementBatchError> =>
  ResultAsync.fromSafePromise(performBatch({ indicateurPublicId, items })).andThen(
    (result) => result,
  )

// Pipeline de validation avant toute écriture en base. En pratique l'appelant
// enveloppe la commande dans `withTransaction`, donc cette validation s'exécute
// dans la transaction courante — l'important est qu'elle court-circuite avant
// le premier INSERT : on rassemble toutes les erreurs détectées pour préserver
// la garantie « tout-ou-rien transactionnel » promise au client (on ne veut
// jamais aborter un INSERT à mi-parcours).
const validateAndResolveCellules = async ({
  indicateurId,
  items,
}: {
  indicateurId: string
  items: BatchItems
}): Promise<Result<ResolvedCellule[], BatchInvalidError>> => {
  const [{ individuByPublicId, linkedReferentielIds }, modalitesContext] = await Promise.all([
    loadIndividusContext({ indicateurId, items }),
    loadModalitesContext({
      indicateurId,
      modalitePublicIds: items.flatMap((item) => item.modalites ?? []),
    }),
  ])
  const modalitesByItem = validateItemsModalites({ items, context: modalitesContext })
  const errors = [
    ...detectDuplicateKeys({ items, modalitesByItem }),
    ...detectIndividusInconnus({ items, individuByPublicId, linkedReferentielIds }),
    ...aggregateModalitesErrors({ modalitesByItem }),
  ]
  if (errors.length > 0) return err({ type: 'BATCH_INVALID', errors })
  return ok(
    items.map((item, index) => ({
      individuId: individuByPublicId.get(item.individu)!.id,
      // Aucune erreur à ce stade : chaque item a ses modalités.
      modalites: modalitesByItem[index]!.unwrapOr([]),
    })),
  )
}

const validateItemsModalites = ({
  items,
  context,
}: {
  items: BatchItems
  context: ModalitesContext
}): ModalitesByItem =>
  items.map((item) => validateSaisieModalites({ context, modalitePublicIds: item.modalites ?? [] }))

type IndividuRow = { id: string; publicId: string; referentielId: string }

// Charge en deux requêtes ce qu'il faut pour valider chaque item :
//  - tous les individus distincts présents dans le payload (par publicId), avec leur referentielId
//  - parmi leurs référentiels, ceux qui sont effectivement liés à l'indicateur cible.
// Les deux Map/Set permettent ensuite une vérification O(n) sans round-trip supplémentaire.
const loadIndividusContext = async ({
  indicateurId,
  items,
}: {
  indicateurId: string
  items: BatchItems
}): Promise<{
  individuByPublicId: Map<string, IndividuRow>
  linkedReferentielIds: Set<string>
}> => {
  const distinctIndividuPublicIds = Array.from(new Set(items.map((item) => item.individu)))
  const individus = await db().individu.findMany({
    where: { publicId: { in: distinctIndividuPublicIds } },
    select: { id: true, publicId: true, referentielId: true },
  })
  const individuByPublicId = new Map(individus.map((individu) => [individu.publicId, individu]))
  const distinctReferentielIds = Array.from(
    new Set(individus.map((individu) => individu.referentielId)),
  )
  const links = await db().indicateurReferentiel.findMany({
    where: { indicateurId, referentielId: { in: distinctReferentielIds } },
    select: { referentielId: true },
  })
  return {
    individuByPublicId,
    linkedReferentielIds: new Set(links.map((link) => link.referentielId)),
  }
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
  combinaisonId: string
  date: string
  valeur: string
}

// Résout les combinaisons du lot (en créant celles qui manquent), puis exécute l'upsert
// atomique en un seul appel TypedSQL. Le `RETURNING (xmax = 0)` indique, ligne par ligne,
// si l'opération a été un INSERT (true) ou un UPDATE (false). On agrège pour produire les
// compteurs renvoyés au client.
const executeBatch = async ({
  indicateurId,
  cellules,
  items,
}: {
  indicateurId: string
  cellules: ReadonlyArray<ResolvedCellule>
  items: BatchItems
}): Promise<UpsertValeursAvancementBatchResultApiModel> => {
  const idByKey = await upsertCombinaisons({
    combinaisons: cellules.map((cellule) => cellule.modalites),
  })
  const sqlItems: SqlBatchItem[] = items.map((item, index) => {
    const cellule = cellules[index]!
    return {
      id: uuidv7(),
      individuId: cellule.individuId,
      combinaisonId: idByKey.get(combinaisonKey({ modalites: cellule.modalites }))!,
      date: item.date,
      valeur: item.valeur.toString(),
    }
  })
  const rows = await db().$queryRawTyped(
    upsertValeursAvancementBatchQuery(indicateurId, { items: sqlItems }),
  )
  const total = rows.length
  const created = rows.reduce((sum, row) => sum + (row.created === true ? 1 : 0), 0)
  return { total, created, updated: total - created }
}
