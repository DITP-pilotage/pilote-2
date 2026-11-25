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
} from '@/axe/requestedModalites'
import { checkCelluleComplete } from '@/axe/rules'
import { db } from '@/framework/persistence/dbStore'
import { upsertValeursAvancementBatch as upsertValeursAvancementBatchQuery } from '@/generated/prisma/sql'
import { resolveIndicateurForWriteData } from '@/indicateur/resolveIndicateurForWrite'
import { loadIndividusContext } from '@/individu/loadIndividusContext'
import { checkIndividuRattache } from '@/individu/rules'
import {
  aggregateIndividusErrors,
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

type UpsertValeursAvancementBatchParams = {
  indicateurPublicId: string
  body: UpsertValeursAvancementBatchBody
}

const performBatch = async ({
  indicateurPublicId,
  body: { items },
}: UpsertValeursAvancementBatchParams): Promise<
  Result<UpsertValeursAvancementBatchResultApiModel, UpsertValeursAvancementBatchError>
> => {
  const { indicateur } = await resolveIndicateurForWriteData({ indicateurPublicId })
  const indicateurId = indicateur.id

  const cellules = await validateAndResolveCellules({ indicateurId, items })
  if (cellules.isErr()) return err(cellules.error)

  return ok(await executeBatch({ indicateurId, cellules: cellules.value, items }))
}

export const upsertValeursAvancementBatch = (
  params: UpsertValeursAvancementBatchParams,
): ResultAsync<UpsertValeursAvancementBatchResultApiModel, UpsertValeursAvancementBatchError> =>
  new ResultAsync(performBatch(params))

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
  const [individus, modalitesContext] = await Promise.all([
    loadIndividusContext({ indicateurId, individuPublicIds: items.map((item) => item.individu) }),
    loadModalitesContext({
      indicateurId,
      modalitePublicIds: items.flatMap((item) => item.modalites ?? []),
    }),
  ])

  const individuByItem = items.map((item) =>
    checkIndividuRattache({
      individuPublicId: item.individu,
      individu: individus.individuByPublicId.get(item.individu),
      referentielIdsLies: individus.referentielIdsLies,
    }),
  )
  const modalitesByItem = validateItemsModalites({ items, context: modalitesContext })

  const errors = [
    ...detectDuplicateKeys({ items, modalitesByItem }),
    ...aggregateIndividusErrors({ individuByItem }),
    ...aggregateModalitesErrors({ modalitesByItem }),
  ]
  if (errors.length > 0) return err({ type: 'BATCH_INVALID', errors })

  // Aucune erreur à ce stade : chaque item a son individu et ses modalités.
  const cellules: ResolvedCellule[] = []
  items.forEach((_item, index) => {
    const individu = individuByItem[index]!
    const modalites = modalitesByItem[index]!
    if (individu.isOk() && modalites.isOk()) {
      cellules.push({ individuId: individu.value.id, modalites: modalites.value })
    }
  })
  return ok(cellules)
}

const validateItemsModalites = ({
  items,
  context,
}: {
  items: BatchItems
  context: ModalitesContext
}): ModalitesByItem =>
  items.map((item) => checkCelluleComplete({ context, modalitePublicIds: item.modalites ?? [] }))

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
