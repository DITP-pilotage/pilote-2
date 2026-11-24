import { type ModaliteApiModel } from '@pilote/kpilote-shared/axe'
import { type IndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { type IndividuApiModel } from '@pilote/kpilote-shared/individu'
import { QueryClient } from '@tanstack/react-query'
import { delay, http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { apiUrl, server } from '@/tests/server'

import { ciblesSaisieQueryOptions, loadCiblesSaisie } from './ciblesSaisie'

const indicateur = (
  override: Pick<IndicateurApiModel, 'referentiels' | 'axes'>,
): IndicateurApiModel => ({
  id: 'IND-1',
  nom: 'Fraudes détectées',
  visibilite: 'PRIVE',
  unite: null,
  sensSouhaite: 'HAUSSE',
  description: null,
  methodeCalcul: null,
  sourceDonnees: null,
  sourceUrl: null,
  periodeMiseAJour: null,
  jourMiseAJour: null,
  delaiMiseADisposition: null,
  responsables: [],
  dateDerniereValeur: null,
  dateProchaineValeur: null,
  dateMiseADisposition: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...override,
})

const individu = ({
  id,
  nom,
  referentiel,
}: {
  id: string
  nom: string
  referentiel: string
}): IndividuApiModel => ({
  id,
  nom,
  referentiel,
  parents: [],
  metadata: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

const modalite = ({
  id,
  nom,
  parent = null,
}: {
  id: string
  nom: string
  parent?: string | null
}): ModaliteApiModel => ({
  id,
  nom,
  niveau: parent ? 2 : 1,
  parent,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

const page = <T>({ items, cursor }: { items: T[]; cursor: string | null }) => ({
  items,
  pagination: { cursor, hasMore: cursor !== null },
  total: items.length,
})

const indicateurAvecReferentielsEtAxes = indicateur({
  referentiels: [
    { id: 'REF-DEPT', nom: 'Départements', fonctionAgregation: 'SUM' },
    { id: 'REF-REG', nom: 'Régions', fonctionAgregation: 'SUM' },
  ],
  axes: [
    { id: 'AXE-OPERATEUR', nom: 'Opérateur', fonction: 'SUM' },
    { id: 'AXE-FRAUDE', nom: 'Type de fraude', fonction: 'SUM' },
  ],
})

const recordRequests = (): string[] => {
  const paths: string[] = []
  server.events.on('request:start', ({ request }) => {
    paths.push(new URL(request.url).pathname)
  })
  return paths
}

afterEach(() => {
  server.events.removeAllListeners()
})

describe('loadCiblesSaisie', () => {
  it('recompose les cibles depuis l’indicateur, ses référentiels et ses axes', async () => {
    server.use(
      http.get(apiUrl('/indicateurs/IND-1'), () =>
        HttpResponse.json(indicateurAvecReferentielsEtAxes),
      ),
      http.get(apiUrl('/referentiels/REF-DEPT/individus'), () =>
        HttpResponse.json(
          page({
            items: [individu({ id: 'DEPT-84', nom: 'Vaucluse', referentiel: 'REF-DEPT' })],
            cursor: null,
          }),
        ),
      ),
      http.get(apiUrl('/referentiels/REF-REG/individus'), () =>
        HttpResponse.json(
          page({
            items: [individu({ id: 'REG-93', nom: 'PACA', referentiel: 'REF-REG' })],
            cursor: null,
          }),
        ),
      ),
      http.get(apiUrl('/axes/AXE-OPERATEUR/modalites'), () =>
        HttpResponse.json({ items: [modalite({ id: 'OP-ORANGE', nom: 'Orange' })] }),
      ),
      http.get(apiUrl('/axes/AXE-FRAUDE/modalites'), () =>
        HttpResponse.json({
          items: [
            modalite({ id: 'FR-FISCALE', nom: 'Fiscale' }),
            modalite({ id: 'FR-TVA', nom: 'TVA', parent: 'FR-FISCALE' }),
          ],
        }),
      ),
    )

    const cibles = await loadCiblesSaisie({
      queryClient: new QueryClient(),
      indicateurId: 'IND-1',
    })

    expect(cibles).toEqual({
      individus: [
        { id: 'DEPT-84', nom: 'Vaucluse', referentiel: 'REF-DEPT' },
        { id: 'REG-93', nom: 'PACA', referentiel: 'REF-REG' },
      ],
      axes: [
        { id: 'AXE-OPERATEUR', nom: 'Opérateur', modalites: [{ id: 'OP-ORANGE', nom: 'Orange' }] },
        { id: 'AXE-FRAUDE', nom: 'Type de fraude', modalites: [{ id: 'FR-TVA', nom: 'TVA' }] },
      ],
    })
  })

  it('lit toutes les pages des individus d’un référentiel', async () => {
    server.use(
      http.get(apiUrl('/indicateurs/IND-1'), () =>
        HttpResponse.json(
          indicateur({
            referentiels: [{ id: 'REF-DEPT', nom: 'Départements', fonctionAgregation: 'SUM' }],
            axes: [],
          }),
        ),
      ),
      http.get(apiUrl('/referentiels/REF-DEPT/individus'), ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor')
        if (cursor === 'page-2') {
          return HttpResponse.json(
            page({
              items: [individu({ id: 'DEPT-84', nom: 'Vaucluse', referentiel: 'REF-DEPT' })],
              cursor: null,
            }),
          )
        }
        return HttpResponse.json(
          page({
            items: [individu({ id: 'DEPT-13', nom: 'Bouches-du-Rhône', referentiel: 'REF-DEPT' })],
            cursor: 'page-2',
          }),
        )
      }),
    )

    const cibles = await loadCiblesSaisie({
      queryClient: new QueryClient(),
      indicateurId: 'IND-1',
    })

    expect(cibles.individus.map((cible) => cible.id)).toEqual(['DEPT-13', 'DEPT-84'])
  })

  it('un indicateur sans référentiel ni axe ne fait que l’appel à l’indicateur', async () => {
    server.use(
      http.get(apiUrl('/indicateurs/IND-1'), () =>
        HttpResponse.json(indicateur({ referentiels: [], axes: [] })),
      ),
    )
    const paths = recordRequests()

    const cibles = await loadCiblesSaisie({
      queryClient: new QueryClient(),
      indicateurId: 'IND-1',
    })

    expect(cibles).toEqual({ individus: [], axes: [] })
    expect(paths).toEqual(['/indicateurs/IND-1'])
  })

  it('lit les référentiels et les axes en parallèle', async () => {
    server.use(
      http.get(apiUrl('/indicateurs/IND-1'), () =>
        HttpResponse.json(
          indicateur({
            referentiels: [{ id: 'REF-DEPT', nom: 'Départements', fonctionAgregation: 'SUM' }],
            axes: [{ id: 'AXE-OPERATEUR', nom: 'Opérateur', fonction: 'SUM' }],
          }),
        ),
      ),
      http.get(apiUrl('/referentiels/REF-DEPT/individus'), async () => {
        await delay(20)
        return HttpResponse.json(page({ items: [], cursor: null }))
      }),
      http.get(apiUrl('/axes/AXE-OPERATEUR/modalites'), async () => {
        await delay(20)
        return HttpResponse.json({ items: [] })
      }),
    )
    const events: string[] = []
    server.events.on('request:start', ({ request }) => {
      events.push(`début ${new URL(request.url).pathname}`)
    })
    server.events.on('response:mocked', ({ request }) => {
      events.push(`fin ${new URL(request.url).pathname}`)
    })

    await loadCiblesSaisie({ queryClient: new QueryClient(), indicateurId: 'IND-1' })

    // L'indicateur d'abord, puis les deux lectures partent avant que l'une ne réponde.
    expect(events.map((event) => event.split(' ')[0])).toEqual([
      'début',
      'fin',
      'début',
      'début',
      'fin',
      'fin',
    ])
  })
})

describe('ciblesSaisieQueryOptions', () => {
  it('réutilise le cache des lectures de l’indicateur, des référentiels et des axes', async () => {
    server.use(
      http.get(apiUrl('/indicateurs/IND-1'), () =>
        HttpResponse.json(indicateurAvecReferentielsEtAxes),
      ),
      http.get(apiUrl('/referentiels/:id/individus'), () =>
        HttpResponse.json(page({ items: [], cursor: null })),
      ),
      http.get(apiUrl('/axes/:id/modalites'), () => HttpResponse.json({ items: [] })),
    )
    const queryClient = new QueryClient()
    await loadCiblesSaisie({ queryClient, indicateurId: 'IND-1' })
    const paths = recordRequests()

    const cibles = await queryClient.fetchQuery(ciblesSaisieQueryOptions('IND-1'))

    expect(cibles.axes.map((axe) => axe.id)).toEqual(['AXE-OPERATEUR', 'AXE-FRAUDE'])
    expect(paths).toEqual([])
  })
})
