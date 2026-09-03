import { type View } from '@pilote/kpilote-shared/assistant/tiles'
import { describe, expect, it, vi } from 'vitest'

import { composeView } from '@/assistant/tools/business/composeView'
import { COMPOSE_VIEW_DESCRIPTION } from '@/assistant/tools/business/composeViewPrompt'

const context = {
  request: 'montre-moi la progression',
  indicateurs: ['IND-1'],
  collections: [],
  individus: ['DEPT-84'],
  referentiels: [],
}

const validView: View = {
  title: 'Progression',
  tiles: [
    {
      type: 'tile_avancement_indicateur',
      indicateurId: 'IND-1',
      individuId: 'DEPT-84',
      width: 'third',
    },
  ],
}

const invalidView: View = {
  title: 'Progression',
  tiles: [
    {
      type: 'tile_avancement_indicateur',
      indicateurId: 'IND-9',
      individuId: 'DEPT-84',
      width: 'third',
    },
  ],
}

describe('composeView', () => {
  it('renvoie la vue quand elle est conforme', async () => {
    const compose = vi.fn(() => Promise.resolve(validView))
    expect(await composeView({ ...context, compose })).toEqual(validView)
    expect(compose).toHaveBeenCalledOnce()
  })

  it('relance une fois le sous-agent en lui nommant ses issues', async () => {
    const compose = vi
      .fn<(prompt: string) => Promise<View>>()
      .mockResolvedValueOnce(invalidView)
      .mockResolvedValueOnce(validView)

    expect(await composeView({ ...context, compose })).toEqual(validView)
    expect(compose).toHaveBeenCalledTimes(2)
    expect(compose.mock.calls[1]?.[0]).toContain('IND-9')
  })

  it('abandonne après une relance et renvoie une erreur lisible', async () => {
    const compose = vi.fn(() => Promise.resolve(invalidView))

    const output = await composeView({ ...context, compose })
    expect(output).toHaveProperty('error')
    expect(compose).toHaveBeenCalledTimes(2)
  })

  it("transmet le context au sous-agent pour qu'il n'ait pas à le deviner", async () => {
    // Typé explicitement : sans signature, `mock.calls` est un tuple vide.
    const compose = vi.fn<(prompt: string) => Promise<View>>().mockResolvedValue(validView)
    await composeView({ ...context, compose })
    expect(compose.mock.calls[0]?.[0]).toContain('DEPT-84')
  })
})

describe('COMPOSE_VIEW_DESCRIPTION', () => {
  it('porte le catalogue complet, que le modèle lit au moment de décider', () => {
    expect(COMPOSE_VIEW_DESCRIPTION).toContain('tile_avancement_indicateur')
    expect(COMPOSE_VIEW_DESCRIPTION).toContain('tile_carte_indicateur')
    expect(COMPOSE_VIEW_DESCRIPTION).toContain('tile_paragraphe')
  })

  it("dit explicitement qu'une tuile ne porte jamais de valeur", () => {
    expect(COMPOSE_VIEW_DESCRIPTION).toContain('JAMAIS de valeur chiffrée')
  })

  it('interdit de composer sans territoire', () => {
    expect(COMPOSE_VIEW_DESCRIPTION).toContain('NE COMPOSE PAS')
  })
})
