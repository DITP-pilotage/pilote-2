import { describe, expect, it, vi } from 'vitest'

// En premier : la route charge `@hono/zod-openapi`, qui doit étendre Zod avant
// l'évaluation des schémas partagés (sinon ils n'ont pas `.openapi`).
import { valeurAvancementRoutes } from '@/valeurAvancement/routes'
import { validationErrorApiModelSchema } from '@pilote/kpilote-shared/error'
import {
  batchInvalidErrorDetailsApiModelSchema,
  upsertValeursAvancementBatchResultApiModelSchema,
} from '@pilote/kpilote-shared/valeurAvancement'

import { db } from '@/framework/persistence/dbStore'
import { IndicateurPermissionAction } from '@/generated/prisma/enums'
import { buildTestApp } from '@/test/buildTestApp'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import {
  testApiKeyRawKey,
  testCollectionNumericId,
  testDeptIds,
  testReferentielId,
} from '@/test/randomIds'

// La route ouvre sa propre transaction (`withTransaction`), qui ne verrait pas les
// fixtures de la transaction de test : ici elle rejoint la transaction courante
// (celle d'`integrationTest`, annulée en fin de test). Hors contexte de base
// (`integrationTest` lui-même), on garde le comportement d'origine.
vi.mock('@/framework/persistence/withTransaction', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/framework/persistence/withTransaction')>()
  const { db } = await import('@/framework/persistence/dbStore')
  return {
    ...original,
    withTransaction: <T>(fn: () => Promise<T>): Promise<T> => {
      try {
        db()
      } catch {
        return original.withTransaction(fn)
      }
      return fn()
    },
  }
})

const buildApp = () => buildTestApp(valeurAvancementRoutes)

// `indicateurPublicIdSchema` exige `IND-<chiffres>`.
const indicateurId = () => `IND-${testCollectionNumericId().slice('COL-'.length)}`

const putBatch = ({
  indicateur,
  rawKey,
  body,
}: {
  indicateur: string
  rawKey: string
  body: unknown
}) =>
  buildApp().request(`/indicateurs/${indicateur}/valeurs:batch`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${rawKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

const indicateurAvecDeuxDepartements = async () => {
  const indicateur = indicateurId()
  const referentiel = testReferentielId().toUpperCase()
  const [dept1, dept2] = testDeptIds(2)
  await fixtures.indicateurReferentiel({
    indicateur: { publicId: indicateur },
    referentiel: { publicId: referentiel },
    fonctionAgregation: 'NONE',
  })
  await fixtures.individu(
    { publicId: dept1, referentiel: { publicId: referentiel } },
    { publicId: dept2, referentiel: { publicId: referentiel } },
  )
  const rawKey = testApiKeyRawKey()
  await fixtures.apiKey({
    rawKey,
    permissions: [
      { indicateur: { publicId: indicateur }, action: IndicateurPermissionAction.READ },
      { indicateur: { publicId: indicateur }, action: IndicateurPermissionAction.WRITE_DATA },
    ],
  })
  return { indicateur, dept1, dept2, rawKey }
}

const compterValeurs = async ({ indicateur }: { indicateur: string }) =>
  db().valeurAvancement.count({ where: { indicateur: { publicId: indicateur } } })

// Contrat lu par l'import de la webapp (`kpilote-webapp/src/api/valeursImport.ts`) :
// compteurs en 200 ; en 400, `details.errors` (BATCH_INVALID) ou `details.issues`
// (VALIDATION_ERROR), traduits ligne par ligne par `traduireErreursBatch`.
describe.concurrent('PUT /indicateurs/{id}/valeurs:batch — contrat de l’import webapp', () => {
  it(
    'compte les créations puis les mises à jour',
    integrationTest(async () => {
      const { indicateur, dept1, dept2, rawKey } = await indicateurAvecDeuxDepartements()

      const premier = await putBatch({
        indicateur,
        rawKey,
        body: {
          items: [
            { individu: dept1, date: '2025-01-01', valeur: 12.5 },
            { individu: dept2, date: '2025-01-01', valeur: 30 },
            { individu: dept1, date: '2025-02-01', valeur: 13 },
          ],
        },
      })
      const second = await putBatch({
        indicateur,
        rawKey,
        body: {
          items: [
            { individu: dept1, date: '2025-01-01', valeur: 12.75 },
            { individu: dept2, date: '2025-01-01', valeur: 30 },
            { individu: dept2, date: '2025-02-01', valeur: 31 },
          ],
        },
      })

      expect(premier.status).toBe(200)
      expect(upsertValeursAvancementBatchResultApiModelSchema.parse(await premier.json())).toEqual({
        total: 3,
        created: 3,
        updated: 0,
      })
      expect(second.status).toBe(200)
      expect(upsertValeursAvancementBatchResultApiModelSchema.parse(await second.json())).toEqual({
        total: 3,
        created: 1,
        updated: 2,
      })
      expect(await compterValeurs({ indicateur })).toBe(4)
    }),
  )

  it(
    'rejette tout le lot en 400 BATCH_INVALID avec doublons et individus inconnus, sans rien écrire',
    integrationTest(async () => {
      const { indicateur, dept1, rawKey } = await indicateurAvecDeuxDepartements()

      const response = await putBatch({
        indicateur,
        rawKey,
        body: {
          items: [
            { individu: dept1, date: '2025-01-01', valeur: 1 },
            { individu: 'DEPT-INCONNU', date: '2025-01-01', valeur: 2 },
            { individu: dept1, date: '2025-01-01', valeur: 3 },
            { individu: 'DEPT-INCONNU', date: '2025-01-01', valeur: 4 },
          ],
        },
      })

      expect(response.status).toBe(400)
      const body = (await response.json()) as { details?: unknown }
      expect(body).toEqual({
        code: 'BATCH_INVALID',
        message: "Aucune valeur n'a été appliquée.",
        details: {
          errors: [
            { code: 'DUPLICATE_KEY', indices: [0, 2], individu: dept1, date: '2025-01-01' },
            {
              code: 'DUPLICATE_KEY',
              indices: [1, 3],
              individu: 'DEPT-INCONNU',
              date: '2025-01-01',
            },
            { code: 'INDIVIDU_INCONNU', indices: [1, 3], individu: 'DEPT-INCONNU' },
          ],
        },
      })
      expect(batchInvalidErrorDetailsApiModelSchema.safeParse(body.details).success).toBe(true)
      expect(await compterValeurs({ indicateur })).toBe(0)
    }),
  )

  // `INVALID_ITEM` est déclaré dans le schéma partagé mais jamais émis : un item mal
  // formé est rejeté par la validation Zod du corps, avant le handler.
  it(
    'rejette un item mal formé en 400 VALIDATION_ERROR, avec le chemin de l’item fautif',
    integrationTest(async () => {
      const { indicateur, dept1, rawKey } = await indicateurAvecDeuxDepartements()

      const response = await putBatch({
        indicateur,
        rawKey,
        body: {
          items: [
            { individu: dept1, date: '2025-01-01', valeur: 1 },
            { individu: dept1, date: 'pas-une-date', valeur: 2 },
          ],
        },
      })

      expect(response.status).toBe(400)
      const body = validationErrorApiModelSchema.parse(await response.json())
      expect(body.code).toBe('VALIDATION_ERROR')
      // `traduireIssuesValidation` lit l'index et le nom du champ dans `path` ; une
      // même date peut porter plusieurs issues (format, puis date calendaire).
      expect(body.details.issues.length).toBeGreaterThan(0)
      for (const issue of body.details.issues) expect(issue.path).toEqual(['items', 1, 'date'])
      expect(await compterValeurs({ indicateur })).toBe(0)
    }),
  )
})
