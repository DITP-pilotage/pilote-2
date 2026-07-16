import { HTTPError } from 'ky'
import { type Result, err, ok } from 'neverthrow'
import {
  normaliserValeursImportResponseApiModelSchema,
  type NormaliserValeursImportResponseApiModel,
} from '@pilote/kpilote-shared/valeurImport'
import { z } from 'zod'

import { apiClient } from '@/api/client'

export type NormaliserError =
  | { type: 'PLAN_ECHEC'; message: string }
  | { type: 'RESOLUTION_ECHEC' }
  | { type: 'UNKNOWN' }

const errorPayloadSchema = z.object({ code: z.string(), message: z.string() })

const mapErrorBody = (body: unknown): NormaliserError => {
  const parsed = errorPayloadSchema.safeParse(body)
  if (!parsed.success) return { type: 'UNKNOWN' }
  switch (parsed.data.code) {
    case 'PLAN_ECHEC':
      return { type: 'PLAN_ECHEC', message: parsed.data.message }
    case 'RESOLUTION_ECHEC':
      return { type: 'RESOLUTION_ECHEC' }
    default:
      return { type: 'UNKNOWN' }
  }
}

export async function normaliserValeurs({
  indicateurId,
  rows,
  nomFichier,
}: {
  indicateurId: string
  rows: Array<Record<string, unknown>>
  nomFichier?: string
}): Promise<Result<NormaliserValeursImportResponseApiModel, NormaliserError>> {
  try {
    const json = await apiClient
      .post(`indicateurs/${indicateurId}/valeurs:normaliser`, {
        json: { rows, ...(nomFichier ? { nomFichier } : {}) },
        timeout: 180_000,
      })
      .json()
    return ok(normaliserValeursImportResponseApiModelSchema.parse(json))
  } catch (error) {
    if (error instanceof HTTPError) {
      const body: unknown = await error.response.json().catch(() => null)
      return err(mapErrorBody(body))
    }
    return err({ type: 'UNKNOWN' })
  }
}
