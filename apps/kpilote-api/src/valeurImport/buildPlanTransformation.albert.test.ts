import {
  type PlanImportEvent,
  type PlanTransformation,
  type Rapprochement,
} from '@pilote/kpilote-shared/valeurImport'
import { mapValues } from 'es-toolkit'
import { describe, expect, it } from 'vitest'

import { buildPlanTransformation } from '@/valeurImport/buildPlanTransformation'
import { type CasCorpus, corpus } from '@/valeurImport/corpus/cases'

// Albert n'est pas strictement déterministe : chaque cas est joué plusieurs
// fois, et tous les essais doivent donner le plan attendu.
const ESSAIS = 3

const hasAlbertKey = Boolean(process.env['ALBERT_API_KEY'])

const collectEvents = async (cas: CasCorpus): Promise<PlanImportEvent[]> => {
  const events: PlanImportEvent[] = []
  const generator = buildPlanTransformation({
    context: cas.context,
    tableau: cas.tableau,
    nomFichier: cas.nomFichier,
  })
  for await (const event of generator) events.push(event)
  return events
}

// L'ordre des candidats d'un libellé ambigu ne compte pas.
const sortCandidats = (rapprochement: Rapprochement): Rapprochement =>
  rapprochement.statut === 'AMBIGU'
    ? { statut: 'AMBIGU', candidats: rapprochement.candidats.toSorted() }
    : rapprochement

const normalizePlan = (plan: PlanTransformation): PlanTransformation => ({
  ...plan,
  individu: {
    ...plan.individu,
    rapprochements: mapValues(plan.individu.rapprochements, sortCandidats),
  },
  axes: plan.axes.map((axe) => ({
    ...axe,
    rapprochements: mapValues(axe.rapprochements, sortCandidats),
  })),
})

const expectAttendu = ({ cas, events }: { cas: CasCorpus; events: PlanImportEvent[] }): void => {
  const last = events.at(-1)
  if ('plan' in cas.attendu) {
    expect(last?.type, JSON.stringify(last)).toBe('PLAN')
    if (last?.type !== 'PLAN') return
    expect(normalizePlan(last.plan)).toEqual(cas.attendu.plan)
    return
  }
  expect(last?.type, JSON.stringify(last)).toBe('ECHEC')
  if (last?.type !== 'ECHEC') return
  expect(cas.attendu.echec).toContain(last.erreur.motif)
  expect(last.erreur.explication).not.toBe('')
}

describe.skipIf(!hasAlbertKey)('buildPlanTransformation avec Albert', () => {
  for (const cas of corpus) {
    it(`${cas.nom} (${ESSAIS} essais)`, async () => {
      for (let essai = 1; essai <= ESSAIS; essai += 1) {
        expectAttendu({ cas, events: await collectEvents(cas) })
      }
    })
  }
})
