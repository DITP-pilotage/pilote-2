import { describe, expect, it } from 'vitest'

import { buildEventRequest, buildPageViewRequest } from './buildRequest'
import type { AnalyticsConfig } from './schema'

// URLs volontairement non résolvables : `.test` est réservé par la RFC 2606,
// aucun test ne peut donc joindre une vraie instance Matomo par inadvertance.
const config: AnalyticsConfig = {
  matomoUrl: 'https://matomo.test',
  siteId: '42',
  appUrl: 'https://kpilote.test',
}

const params = (query: string): URLSearchParams => new URLSearchParams(query)

describe('buildEventRequest', () => {
  it('envoie les paramètres obligatoires de Matomo', () => {
    const result = params(
      buildEventRequest({ category: 'kpilote.error', action: 'error', name: 'mutation' }, config),
    )

    expect(result.get('idsite')).toBe('42')
    expect(result.get('rec')).toBe('1')
    expect(result.get('apiv')).toBe('1')
    expect(result.get('e_c')).toBe('kpilote.error')
    expect(result.get('e_a')).toBe('error')
    expect(result.get('e_n')).toBe('mutation')
  })

  it('replie le contexte sans slot dans e_n, trié par clé', () => {
    const result = params(
      buildEventRequest(
        {
          category: 'kpilote.indicateur',
          action: 'open',
          name: 'indicateur.open',
          context: { source: 'dashboard', entity_id: 'IND-506' },
        },
        config,
      ),
    )

    expect(result.get('e_n')).toBe('indicateur.open?entity_id=IND-506&source=dashboard')
  })

  it('envoie une clé en dimension quand elle a un slot, et la retire de e_n', () => {
    const result = params(
      buildEventRequest(
        {
          category: 'kpilote.indicateur',
          action: 'open',
          name: 'indicateur.open',
          context: { source: 'dashboard', entity_id: 'IND-506' },
        },
        { ...config, dimensionSlots: { source: 3 } },
      ),
    )

    expect(result.get('dimension3')).toBe('dashboard')
    expect(result.get('e_n')).toBe('indicateur.open?entity_id=IND-506')
  })

  it("fusionne le contexte global sous le contexte de l'événement", () => {
    const result = params(
      buildEventRequest(
        {
          category: 'kpilote.error',
          action: 'error',
          name: 'mutation',
          context: { app_area: 'admin' },
        },
        { ...config, globalContext: { app_area: 'webapp', environment: 'production' } },
      ),
    )

    expect(result.get('e_n')).toBe('mutation?app_area=admin&environment=production')
  })

  it('ignore les valeurs indéfinies du contexte', () => {
    const result = params(
      buildEventRequest(
        {
          category: 'kpilote.dashboard',
          action: 'search',
          name: 'dashboard.search',
          context: { has_query: true, source: undefined },
        },
        config,
      ),
    )

    expect(result.get('e_n')).toBe('dashboard.search?has_query=true')
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
    const result = params(buildPageViewRequest({ path: '/indicateurs/$id' }, config))

    expect(result.get('url')).toBe('https://kpilote.test/indicateurs/$id')
    expect(result.get('idsite')).toBe('42')
    expect(result.get('rec')).toBe('1')
  })

  it("n'envoie action_name que si un titre est fourni", () => {
    expect(params(buildPageViewRequest({ path: '/' }, config)).has('action_name')).toBe(false)
    expect(
      params(buildPageViewRequest({ path: '/', title: 'Accueil' }, config)).get('action_name'),
    ).toBe('Accueil')
  })

  it("replie le contexte sans slot dans la query string de l'URL", () => {
    const result = params(
      buildPageViewRequest(
        { path: '/indicateurs/$id' },
        { ...config, globalContext: { app_area: 'webapp' } },
      ),
    )

    expect(result.get('url')).toBe('https://kpilote.test/indicateurs/$id?app_area=webapp')
  })
})
