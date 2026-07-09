import { HTTPError } from 'ky'
import {
  batchInvalidErrorDetailsApiModelSchema,
  type BatchInvalidErrorDetailsApiModel,
  upsertValeursAvancementBatchResultApiModelSchema,
  type UpsertValeursAvancementBatchResultApiModel,
} from '@pilote/kpilote-shared/valeurAvancement'
import { apiClient } from '@/api/client'
import type { ParsedRow } from '@/components/import-valeurs/parseFichierValeurs'

export class ImportBatchInvalidError extends Error {
  constructor(readonly details: BatchInvalidErrorDetailsApiModel) {
    super('BATCH_INVALID')
    this.name = 'ImportBatchInvalidError'
  }
}

export async function importValeursBatch({
  indicateurId,
  rows,
}: {
  indicateurId: string
  rows: ParsedRow[]
}): Promise<UpsertValeursAvancementBatchResultApiModel> {
  try {
    const json = await apiClient
      .put(`indicateurs/${indicateurId}/valeurs:batch`, { json: { items: rows } })
      .json()
    return upsertValeursAvancementBatchResultApiModelSchema.parse(json)
  } catch (error) {
    if (error instanceof HTTPError && error.response.status === 400) {
      const body: unknown = await error.response.json()
      const details = (body as { details?: unknown } | null)?.details
      const parsed = batchInvalidErrorDetailsApiModelSchema.safeParse(details)
      if (parsed.success) throw new ImportBatchInvalidError(parsed.data)
    }
    throw error
  }
}
