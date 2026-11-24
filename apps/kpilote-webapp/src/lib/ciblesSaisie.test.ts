import { type ModaliteApiModel } from '@pilote/kpilote-shared/axe'
import { type IndividuApiModel } from '@pilote/kpilote-shared/individu'
import { describe, expect, it } from 'vitest'

import { buildCiblesSaisie } from './ciblesSaisie'

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

describe('buildCiblesSaisie', () => {
  it('garde les individus de chaque référentiel, sans doublon, triés par identifiant', () => {
    const cibles = buildCiblesSaisie({
      individus: [
        individu({ id: 'REG-11', nom: 'Île-de-France', referentiel: 'REF-REG' }),
        individu({ id: 'DEPT-84', nom: 'Vaucluse', referentiel: 'REF-DEPT' }),
        individu({ id: 'DEPT-13', nom: 'Bouches-du-Rhône', referentiel: 'REF-DEPT' }),
        individu({ id: 'DEPT-84', nom: 'Vaucluse', referentiel: 'REF-DEPT' }),
      ],
      axes: [],
    })

    expect(cibles.individus).toEqual([
      { id: 'DEPT-13', nom: 'Bouches-du-Rhône', referentiel: 'REF-DEPT' },
      { id: 'DEPT-84', nom: 'Vaucluse', referentiel: 'REF-DEPT' },
      { id: 'REG-11', nom: 'Île-de-France', referentiel: 'REF-REG' },
    ])
  })

  it('ne garde que les modalités feuilles de chaque axe', () => {
    const cibles = buildCiblesSaisie({
      individus: [],
      axes: [
        {
          id: 'AXE-FRAUDE',
          nom: 'Type de fraude',
          modalites: [
            modalite({ id: 'FR-FISCALE', nom: 'Fiscale' }),
            modalite({ id: 'FR-SOCIALE', nom: 'Sociale' }),
            modalite({ id: 'FR-TVA', nom: 'TVA', parent: 'FR-FISCALE' }),
            modalite({ id: 'FR-IR', nom: 'IR', parent: 'FR-FISCALE' }),
          ],
        },
      ],
    })

    expect(cibles.axes).toEqual([
      {
        id: 'AXE-FRAUDE',
        nom: 'Type de fraude',
        modalites: [
          { id: 'FR-IR', nom: 'IR' },
          { id: 'FR-SOCIALE', nom: 'Sociale' },
          { id: 'FR-TVA', nom: 'TVA' },
        ],
      },
    ])
  })

  it('garde l’ordre de déclaration des axes', () => {
    const cibles = buildCiblesSaisie({
      individus: [],
      axes: [
        {
          id: 'AXE-OPERATEUR',
          nom: 'Opérateur',
          modalites: [modalite({ id: 'OP-ORANGE', nom: 'Orange' })],
        },
        {
          id: 'AXE-FRAUDE',
          nom: 'Type de fraude',
          modalites: [modalite({ id: 'FR-SOCIALE', nom: 'Sociale' })],
        },
      ],
    })

    expect(cibles.axes.map((axe) => axe.id)).toEqual(['AXE-OPERATEUR', 'AXE-FRAUDE'])
  })

  it('un indicateur sans axe donne axes: []', () => {
    const cibles = buildCiblesSaisie({
      individus: [individu({ id: 'FR', nom: 'France', referentiel: 'REF-NAT' })],
      axes: [],
    })

    expect(cibles.axes).toEqual([])
  })
})
