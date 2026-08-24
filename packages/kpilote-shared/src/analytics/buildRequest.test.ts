import { describe, expect, it } from 'vitest'

import { buildEventRequest, buildPageViewRequest } from './buildRequest'
import type { AnalyticsConfig } from './schema'

const config: AnalyticsConfig = {
  matomoUrl: 'https://stats.beta.gouv.fr',
  siteId: '42',
  appUrl: 'https://kpilote.example',
}

const params = (query: string): URLSearchParams => new URLSearchParams(query)

describe('buildEventRequest', () => {
  it('envoie les paramètres obligatoires de Matomo', () => {
    const resultat = params(
      buildEventRequest({ category: 'kpilote.error', action: 'error', name: 'mutation' }, config),
    )

    expect(resultat.get('idsite')).toBe('42')
    expect(resultat.get('rec')).toBe('1')
    expect(resultat.get('apiv')).toBe('1')
    expect(resultat.get('e_c')).toBe('kpilote.error')
    expect(resultat.get('e_a')).toBe('error')
    expect(resultat.get('e_n')).toBe('mutation')
  })

  it('replie le contexte sans slot dans e_n, trié par clé', () => {
    const resultat = params(
      buildEventRequest(
        {
          category: 'kpilote.indicateur',
          action: 'open',
          name: 'indicateur.open',
          contexte: { source: 'dashboard', entity_id: 'IND-506' },
        },
        config,
      ),
    )

    expect(resultat.get('e_n')).toBe('indicateur.open?entity_id=IND-506&source=dashboard')
  })

  it('envoie une clé en dimension quand elle a un slot, et la retire de e_n', () => {
    const resultat = params(
      buildEventRequest(
        {
          category: 'kpilote.indicateur',
          action: 'open',
          name: 'indicateur.open',
          contexte: { source: 'dashboard', entity_id: 'IND-506' },
        },
        { ...config, dimensionSlots: { source: 3 } },
      ),
    )

    expect(resultat.get('dimension3')).toBe('dashboard')
    expect(resultat.get('e_n')).toBe('indicateur.open?entity_id=IND-506')
  })

  it("fusionne le contexte global sous le contexte de l'événement", () => {
    const resultat = params(
      buildEventRequest(
        {
          category: 'kpilote.error',
          action: 'error',
          name: 'mutation',
          contexte: { app_area: 'admin' },
        },
        { ...config, globalContexte: { app_area: 'webapp', environment: 'production' } },
      ),
    )

    expect(resultat.get('e_n')).toBe('mutation?app_area=admin&environment=production')
  })

  it('ignore les valeurs indéfinies du contexte', () => {
    const resultat = params(
      buildEventRequest(
        {
          category: 'kpilote.dashboard',
          action: 'search',
          name: 'dashboard.search',
          contexte: { has_query: true, source: undefined },
        },
        config,
      ),
    )

    expect(resultat.get('e_n')).toBe('dashboard.search?has_query=true')
  })

  it("n'envoie e_v que si une valeur numérique est fournie", () => {
    expect(
      params(
        buildEventRequest({ category: 'kpilote.error', action: 'error', name: 'mutation' }, config),
      ).has('e_v'),
    ).toBe(false)

    expect(
      params(
        buildEventRequest(
          { category: 'kpilote.error', action: 'error', name: 'mutation', value: 500 },
          config,
        ),
      ).get('e_v'),
    ).toBe('500')
  })
})

describe('buildPageViewRequest', () => {
  it("construit l'URL depuis l'URL applicative et le motif de route", () => {
    const resultat = params(buildPageViewRequest({ path: '/indicateurs/$id' }, config))

    expect(resultat.get('url')).toBe('https://kpilote.example/indicateurs/$id')
    expect(resultat.get('idsite')).toBe('42')
    expect(resultat.get('rec')).toBe('1')
  })

  it("n'envoie action_name que si un titre est fourni", () => {
    expect(params(buildPageViewRequest({ path: '/' }, config)).has('action_name')).toBe(false)
    expect(
      params(buildPageViewRequest({ path: '/', title: 'Accueil' }, config)).get('action_name'),
    ).toBe('Accueil')
  })

  it("replie le contexte sans slot dans la query string de l'URL", () => {
    const resultat = params(
      buildPageViewRequest(
        { path: '/indicateurs/$id' },
        { ...config, globalContexte: { app_area: 'webapp' } },
      ),
    )

    expect(resultat.get('url')).toBe('https://kpilote.example/indicateurs/$id?app_area=webapp')
  })
})
