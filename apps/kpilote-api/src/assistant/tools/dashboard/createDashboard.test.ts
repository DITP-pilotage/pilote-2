import { randomUUID } from 'node:crypto'

import { afterEach, describe, expect, it } from 'vitest'

import { dashboardLabels, resolveDashboardContext } from '@/assistant/tools/dashboard/context'
import { createDashboard } from '@/assistant/tools/dashboard/createDashboard'
import { registerModelWrapper } from '@/framework/llm/albert'
import { Visibilite } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { sequenceTextModel } from '@/test/mockModel'
import { runAsUser } from '@/test/runAsPrincipal'
import { runToolAs } from '@/test/toolHarness'

const token = () => randomUUID().slice(0, 8)

const given = async (visibilite: Visibilite = Visibilite.PUBLIC) => {
  const marqueur = token()
  const referentiel = await fixtures.referentiel({ nom: `Départements ${marqueur}` })
  const indicateur = await fixtures.indicateur({ nom: `Chômage ${marqueur}`, visibilite })
  await fixtures.indicateurReferentiel({ indicateur, referentiel })
  const individu = await fixtures.individu({ nom: `Nord ${marqueur}`, referentiel })
  return { referentiel, indicateur, individu }
}

describe('create_dashboard', { concurrent: false }, () => {
  afterEach(() => registerModelWrapper(null))

  it(
    'ajoute au contexte les référentiels des indicateurs',
    integrationTest(async () => {
      const { referentiel, indicateur, individu } = await given()

      const context = await runAsUser(randomUUID(), () =>
        resolveDashboardContext({
          task: 't',
          indicateurIds: [indicateur.publicId],
          individuIds: [individu.publicId],
        }),
      )

      expect(context.indicateurs).toEqual([
        expect.objectContaining({
          id: indicateur.publicId,
          referentielIds: [referentiel.publicId],
        }),
      ])
      expect(context.referentiels).toEqual([
        expect.objectContaining({ id: referentiel.publicId, carte: false }),
      ])
    }),
  )

  it(
    'compose un dashboard validé et trace le sous-appel',
    integrationTest(async () => {
      const { indicateur, individu } = await given()
      const dashboard = {
        titre: 'Chômage',
        containers: [
          {
            widgets: [
              {
                type: 'kpi_indicateur',
                indicateurId: indicateur.publicId,
                individuId: individu.publicId,
              },
            ],
          },
        ],
      }
      const { model } = sequenceTextModel([JSON.stringify(dashboard)])
      registerModelWrapper(() => model)

      const output = await runToolAs(randomUUID(), 'create_dashboard', createDashboard, {
        task: 'La situation du chômage dans le Nord',
        indicateurIds: [indicateur.publicId],
        individuIds: [individu.publicId],
      })

      expect(output).toEqual({
        ...dashboard,
        labels: expect.objectContaining({
          [indicateur.publicId]: indicateur.nom,
          [individu.publicId]: individu.nom,
        }),
      })
    }),
  )

  it(
    'nomme les indicateurs des collections du contexte',
    integrationTest(async () => {
      const { indicateur, individu } = await given()
      const collection = await fixtures.collection({
        nom: `Emploi ${token()}`,
        visibilite: Visibilite.PUBLIC,
        indicateurs: [{ id: indicateur.id, publicId: indicateur.publicId }],
      })

      const labels = await runAsUser(randomUUID(), () =>
        resolveDashboardContext({
          task: 't',
          collectionIds: [collection.publicId],
          individuIds: [individu.publicId],
        }).then(dashboardLabels),
      )

      expect(labels).toEqual(
        expect.objectContaining({
          [collection.publicId]: collection.nom,
          [indicateur.publicId]: indicateur.nom,
        }),
      )
    }),
  )

  it(
    'renvoie une erreur corrigeable quand le sous-agent invente un identifiant',
    integrationTest(async () => {
      const { indicateur, individu } = await given()
      const { model } = sequenceTextModel([
        JSON.stringify({
          titre: 'T',
          containers: [
            {
              widgets: [
                { type: 'kpi_indicateur', indicateurId: 'IND-999', individuId: individu.publicId },
              ],
            },
          ],
        }),
      ])
      registerModelWrapper(() => model)

      const output = await runToolAs(randomUUID(), 'create_dashboard', createDashboard, {
        task: 't',
        indicateurIds: [indicateur.publicId],
        individuIds: [individu.publicId],
      })

      expect(output).toEqual({ error: expect.stringContaining('IND-999') })
    }),
  )

  it(
    'refuse une entité illisible sans appeler le sous-agent',
    integrationTest(async () => {
      const { indicateur, individu } = await given(Visibilite.PRIVE)
      const { model, state } = sequenceTextModel(['{}'])
      registerModelWrapper(() => model)

      const output = await runToolAs(randomUUID(), 'create_dashboard', createDashboard, {
        task: 't',
        indicateurIds: [indicateur.publicId],
        individuIds: [individu.publicId],
      })

      expect(output).toEqual({ error: expect.stringContaining(indicateur.publicId) })
      expect(state.calls).toBe(0)
    }),
  )
})
