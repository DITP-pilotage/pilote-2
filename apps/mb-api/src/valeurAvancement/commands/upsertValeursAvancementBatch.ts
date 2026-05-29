import {
  type BatchInvalidErrorEntryApiModel,
  type UpsertValeursAvancementBatchBody,
  type UpsertValeursAvancementBatchResultApiModel,
} from '@pilote/mb-shared/valeurAvancement'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { upsertValeursAvancementBatch as upsertValeursAvancementBatchQuery } from '@/generated/prisma/sql'
import {
  ensureIndicateurWritePermission,
  withIndicateurReadPermission,
} from '@/indicateur/permissions'

export type BatchInvalidError = {
  type: 'BATCH_INVALID'
  errors: BatchInvalidErrorEntryApiModel[]
}

export type UpsertValeursAvancementBatchError = BatchInvalidError

type UpsertValeursAvancementBatchParams = {
  indicateurPublicId: string
  body: UpsertValeursAvancementBatchBody
}

export const upsertValeursAvancementBatch = ({
  indicateurPublicId,
  body,
}: UpsertValeursAvancementBatchParams): ResultAsync<
  UpsertValeursAvancementBatchResultApiModel,
  UpsertValeursAvancementBatchError
> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().indicateur.findFirstOrThrow({
      where: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
      select: { id: true, publicId: true },
    }),
  )
    .andThen((indicateur) =>
      ensureIndicateurWritePermission({ indicateurId: indicateur.id, principalId }).map(
        () => indicateur,
      ),
    )
    .andThen((indicateur) =>
      validateAndResolveIndividus({ indicateurId: indicateur.id, items: body.items }).andThen(
        (resolved) => executeBatch({ indicateurId: indicateur.id, resolved, items: body.items }),
      ),
    )
}

type ResolvedIndividus = Map<string, string>

const KEY_SEP = '\u0000'

const validateAndResolveIndividus = ({
  indicateurId,
  items,
}: {
  indicateurId: string
  items: UpsertValeursAvancementBatchBody['items']
}): ResultAsync<ResolvedIndividus, BatchInvalidError> => {
  const errors: BatchInvalidErrorEntryApiModel[] = []

  const indicesByKey = new Map<string, number[]>()
  items.forEach((item, index) => {
    const key = `${item.individu}${KEY_SEP}${item.date}`
    const list = indicesByKey.get(key)
    if (list) list.push(index)
    else indicesByKey.set(key, [index])
  })
  for (const [key, indices] of indicesByKey) {
    if (indices.length > 1) {
      const [individu, date] = key.split(KEY_SEP) as [string, string]
      errors.push({ code: 'DUPLICATE_KEY', indices, individu, date })
    }
  }

  const distinctIndividuPublicIds = Array.from(new Set(items.map((item) => item.individu)))

  return ResultAsync.fromSafePromise(
    db().individu.findMany({
      where: { publicId: { in: distinctIndividuPublicIds } },
      select: { id: true, publicId: true, referentielId: true },
    }),
  )
    .andThen((individus) => {
      const byPublicId = new Map(individus.map((individu) => [individu.publicId, individu]))
      const distinctReferentielIds = Array.from(
        new Set(individus.map((individu) => individu.referentielId)),
      )
      return ResultAsync.fromSafePromise(
        db().indicateurReferentiel.findMany({
          where: { indicateurId, referentielId: { in: distinctReferentielIds } },
          select: { referentielId: true },
        }),
      ).map((links) => ({
        byPublicId,
        linkedReferentielIds: new Set(links.map((link) => link.referentielId)),
      }))
    })
    .andThen(({ byPublicId, linkedReferentielIds }) => {
      const indicesByInconnu = new Map<string, number[]>()
      items.forEach((item, index) => {
        const individu = byPublicId.get(item.individu)
        if (!individu || !linkedReferentielIds.has(individu.referentielId)) {
          const list = indicesByInconnu.get(item.individu)
          if (list) list.push(index)
          else indicesByInconnu.set(item.individu, [index])
        }
      })
      for (const [individu, indices] of indicesByInconnu) {
        errors.push({ code: 'INDIVIDU_INCONNU', individu, indices })
      }

      if (errors.length > 0) {
        return errAsync<ResolvedIndividus, BatchInvalidError>({
          type: 'BATCH_INVALID',
          errors,
        })
      }
      const resolved: ResolvedIndividus = new Map()
      for (const [publicId, individu] of byPublicId) resolved.set(publicId, individu.id)
      return okAsync<ResolvedIndividus, BatchInvalidError>(resolved)
    })
}

const executeBatch = ({
  indicateurId,
  resolved,
  items,
}: {
  indicateurId: string
  resolved: ResolvedIndividus
  items: UpsertValeursAvancementBatchBody['items']
}): ResultAsync<UpsertValeursAvancementBatchResultApiModel, never> => {
  const sqlItems = items.map((item) => {
    const individuId = resolved.get(item.individu)
    if (!individuId) throw new Error(`Individu non résolu: ${item.individu}`)
    return {
      id: uuidv7(),
      individuId,
      date: item.date,
      valeur: item.valeur.toString(),
    }
  })

  return ResultAsync.fromSafePromise(
    db().$queryRawTyped(
      upsertValeursAvancementBatchQuery(indicateurId, { items: sqlItems }),
    ),
  ).map((rows) => {
    const total = rows.length
    const created = rows.reduce((sum, row) => sum + (row.created === true ? 1 : 0), 0)
    return { total, created, updated: total - created }
  })
}
