import { type Vue } from '@pilote/kpilote-shared/assistant/vignettes'
import { describe, expect, it, vi } from 'vitest'

import { composerVue } from '@/assistant/tools/metier/composeVue'
import { DESCRIPTION_COMPOSE_VUE } from '@/assistant/tools/metier/composeVuePrompt'

const contexte = {
  demande: 'montre-moi la progression',
  indicateurs: ['IND-1'],
  collections: [],
  individus: ['DEPT-84'],
  referentiels: [],
}

const vueValide: Vue = {
  titre: 'Progression',
  vignettes: [
    {
      type: 'vignette_avancement_indicateur',
      indicateurId: 'IND-1',
      individuId: 'DEPT-84',
      largeur: 'tiers',
    },
  ],
}

const vueFautive: Vue = {
  titre: 'Progression',
  vignettes: [
    {
      type: 'vignette_avancement_indicateur',
      indicateurId: 'IND-9',
      individuId: 'DEPT-84',
      largeur: 'tiers',
    },
  ],
}

describe('composerVue', () => {
  it('renvoie la vue quand elle est conforme', async () => {
    const composer = vi.fn(() => Promise.resolve(vueValide))
    expect(await composerVue({ ...contexte, composer })).toEqual(vueValide)
    expect(composer).toHaveBeenCalledOnce()
  })

  it('relance une fois le sous-agent en lui nommant ses anomalies', async () => {
    const composer = vi
      .fn<(prompt: string) => Promise<Vue>>()
      .mockResolvedValueOnce(vueFautive)
      .mockResolvedValueOnce(vueValide)

    expect(await composerVue({ ...contexte, composer })).toEqual(vueValide)
    expect(composer).toHaveBeenCalledTimes(2)
    expect(composer.mock.calls[1]?.[0]).toContain('IND-9')
  })

  it('abandonne après une relance et renvoie une erreur lisible', async () => {
    const composer = vi.fn(() => Promise.resolve(vueFautive))

    const sortie = await composerVue({ ...contexte, composer })
    expect(sortie).toHaveProperty('erreur')
    expect(composer).toHaveBeenCalledTimes(2)
  })

  it('transmet le contexte au sous-agent pour qu’il n’ait pas à le deviner', async () => {
    // Typé explicitement : sans signature, `mock.calls` est un tuple vide.
    const composer = vi.fn<(prompt: string) => Promise<Vue>>().mockResolvedValue(vueValide)
    await composerVue({ ...contexte, composer })
    expect(composer.mock.calls[0]?.[0]).toContain('DEPT-84')
  })
})

describe('DESCRIPTION_COMPOSE_VUE', () => {
  it('porte le catalogue complet, que le modèle lit au moment de décider', () => {
    expect(DESCRIPTION_COMPOSE_VUE).toContain('vignette_avancement_indicateur')
    expect(DESCRIPTION_COMPOSE_VUE).toContain('vignette_carte_indicateur')
    expect(DESCRIPTION_COMPOSE_VUE).toContain('vignette_paragraphe')
  })

  it('dit explicitement qu’une vignette ne porte jamais de valeur', () => {
    expect(DESCRIPTION_COMPOSE_VUE).toContain('JAMAIS de valeur chiffrée')
  })

  it('interdit de composer sans territoire', () => {
    expect(DESCRIPTION_COMPOSE_VUE).toContain('NE COMPOSE PAS')
  })
})
