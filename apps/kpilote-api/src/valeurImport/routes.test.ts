import { describe, expect, it, vi } from 'vitest'

// En premier : la route charge `@hono/zod-openapi`, qui doit étendre Zod avant
// l'évaluation des schémas partagés (sinon ils n'ont pas `.openapi`).
import { valeurImportRoutes } from '@/valeurImport/routes'
import {
  MAX_LIGNES_TABLEAU,
  type PlanImportBody,
  type PlanImportEvent,
  planImportEventSchema,
} from '@pilote/kpilote-shared/valeurImport'

import { IndicateurPermissionAction } from '@/generated/prisma/enums'
import { buildTestApp } from '@/test/buildTestApp'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import {
  testApiKeyRawKey,
  testAxeId,
  testDeptId,
  testIndicateurNumericId,
  testModaliteId,
  testReferentielId,
} from '@/test/randomIds'
import { buildPlanTransformation } from '@/valeurImport/buildPlanTransformation'

// Le comportement (contexte chargé, droit d'écrire) est testé par
// `getImportContext.test.ts`, et la construction du plan par les tests Albert :
// ici, seulement le câblage HTTP. Le plan est remplacé par deux événements fixes.
vi.mock('@/valeurImport/buildPlanTransformation', () => {
  const events: PlanImportEvent[] = [
    { type: 'ETAPE', etape: { etape: 'STRUCTURE', statut: 'EN_COURS' } },
    {
      type: 'PLAN',
      plan: {
        individu: {
          colonne: 'Département',
          rapprochements: { Ain: { statut: 'RESOLU', publicId: 'DEPT-01', par: 'EXACT' } },
        },
        axes: [],
        valeurs: { disposition: 'LIGNES', colonneDate: 'Date', colonneValeur: 'Valeur' },
      },
    },
  ]
  return {
    buildPlanTransformation: vi.fn(async function* (): AsyncGenerator<PlanImportEvent> {
      for (const event of events) {
        // Chaque événement arrive plus tard, comme quand Albert répond.
        await Promise.resolve()
        yield event
      }
    }),
  }
})

const buildApp = () => buildTestApp(valeurImportRoutes)

// Indicateur à un individu et un axe, et la clé brute d'un principal qui peut
// écrire ses valeurs. `indicateurWithTwoAxes` ne sert pas ici : son identifiant
// n'est pas au format `IND-<chiffres>` qu'exige le paramètre de la route.
const indicateurWithAxe = async () => {
  const indicateurId = testIndicateurNumericId()
  const referentiel = { publicId: testReferentielId().toUpperCase() }
  const individuId = testDeptId()
  const axeId = testAxeId()
  await fixtures.indicateurReferentiel({ indicateur: { publicId: indicateurId }, referentiel })
  await fixtures.individu({ publicId: individuId, referentiel })
  await fixtures.modalite({
    publicId: testModaliteId(),
    nom: 'Orange',
    niveau: { axe: { publicId: axeId } },
  })
  await fixtures.indicateurAxe({
    indicateur: { publicId: indicateurId },
    axe: { publicId: axeId },
    ordre: 1,
  })
  const cle = testApiKeyRawKey()
  await fixtures.apiKey({
    rawKey: cle,
    permissions: [
      { indicateur: { publicId: indicateurId }, action: IndicateurPermissionAction.WRITE_DATA },
    ],
  })
  return { indicateurId, individuId, axeId, cle }
}

// Lit l'indicateur sans pouvoir écrire ses valeurs. Un principal qui ne le lit
// pas reçoit un 404 : la route ne révèle pas son existence.
const cleLecteur = async ({ indicateurId }: { indicateurId: string }): Promise<string> => {
  const rawKey = testApiKeyRawKey()
  await fixtures.apiKey({
    rawKey,
    permissions: [
      { indicateur: { publicId: indicateurId }, action: IndicateurPermissionAction.READ },
    ],
  })
  return rawKey
}

const postPlanImport = ({
  indicateurId,
  cle,
  body,
}: {
  indicateurId: string
  cle: string
  body: PlanImportBody
}) =>
  buildApp().request(`/indicateurs/${indicateurId}/valeurs:plan-import`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

const tableau: PlanImportBody['tableau'] = {
  entetes: ['Département', 'Date', 'Valeur'],
  lignes: [['Ain', '2025-01-01', 12]],
}

// Les messages du flux : une ligne `data:` par événement.
const readEvents = (corps: string): PlanImportEvent[] =>
  corps
    .split('\n')
    .filter((ligne) => ligne.startsWith('data:'))
    .map((ligne) => planImportEventSchema.parse(JSON.parse(ligne.slice('data:'.length))))

describe.concurrent('POST /indicateurs/{id}/valeurs:plan-import', () => {
  it(
    'diffuse les événements en SSE',
    integrationTest(async () => {
      const { indicateurId, cle } = await indicateurWithAxe()

      const response = await postPlanImport({
        indicateurId,
        cle,
        body: { tableau, nomFichier: 'valeurs.csv' },
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toMatch(/^text\/event-stream/)
      const events = readEvents(await response.text())
      expect(events.map((event) => event.type)).toEqual(['ETAPE', 'PLAN'])
    }),
  )

  it(
    'répond 403 avant d’ouvrir le flux',
    integrationTest(async () => {
      const { indicateurId } = await indicateurWithAxe()
      const cle = await cleLecteur({ indicateurId })

      const response = await postPlanImport({
        indicateurId,
        cle,
        body: { tableau, nomFichier: 'refuse.csv' },
      })

      expect(response.status).toBe(403)
      // Les tests tournent en parallèle : on cherche l'appel par son nom de fichier.
      const nomsFichier = vi
        .mocked(buildPlanTransformation)
        .mock.calls.map(([params]) => params.nomFichier)
      expect(nomsFichier).not.toContain('refuse.csv')
    }),
  )

  it(
    'refuse un tableau trop grand',
    integrationTest(async () => {
      const { indicateurId, cle } = await indicateurWithAxe()
      const lignes = Array.from({ length: MAX_LIGNES_TABLEAU + 1 }, () => ['Ain', '2025-01-01', 12])

      const response = await postPlanImport({
        indicateurId,
        cle,
        body: { tableau: { entetes: tableau.entetes, lignes }, nomFichier: 'trop-grand.csv' },
      })

      expect(response.status).toBe(400)
    }),
  )
})
