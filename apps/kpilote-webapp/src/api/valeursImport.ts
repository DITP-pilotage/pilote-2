import { HTTPError } from 'ky'
import { type Result, ok, err } from 'neverthrow'
import {
  batchInvalidErrorDetailsApiModelSchema,
  type BatchInvalidErrorDetailsApiModel,
  upsertValeursAvancementBatchResultApiModelSchema,
  type UpsertValeursAvancementBatchResultApiModel,
} from '@pilote/kpilote-shared/valeurAvancement'
import {
  validationErrorApiModelSchema,
  type ValidationIssueApiModel,
} from '@pilote/kpilote-shared/error'
import { apiClient } from '@/api/client'
import type { ParsedRow } from '@/components/import-valeurs/parseFichierValeurs'

export type ImportBatchError =
  | { type: 'BATCH_INVALID'; details: BatchInvalidErrorDetailsApiModel }
  | { type: 'VALIDATION_ERROR'; issues: ValidationIssueApiModel[] }
  | { type: 'UNKNOWN' }

export async function importValeursBatch({
  indicateurId,
  rows,
}: {
  indicateurId: string
  rows: ParsedRow[]
}): Promise<Result<UpsertValeursAvancementBatchResultApiModel, ImportBatchError>> {
  try {
    const json = await apiClient
      .put(`indicateurs/${indicateurId}/valeurs:batch`, { json: { items: rows } })
      .json()
    return ok(upsertValeursAvancementBatchResultApiModelSchema.parse(json))
  } catch (error) {
    if (error instanceof HTTPError && error.response.status === 400) {
      const body: unknown = await error.response.json()

      const batchInvalidParsed = batchInvalidErrorDetailsApiModelSchema.safeParse(
        (body as { details?: unknown } | null)?.details,
      )
      if (batchInvalidParsed.success) {
        return err({ type: 'BATCH_INVALID', details: batchInvalidParsed.data })
      }

      const validationErrorParsed = validationErrorApiModelSchema.safeParse(body)
      if (validationErrorParsed.success) {
        return err({
          type: 'VALIDATION_ERROR',
          issues: validationErrorParsed.data.details.issues,
        })
      }
    }
    return err({ type: 'UNKNOWN' })
  }
}
