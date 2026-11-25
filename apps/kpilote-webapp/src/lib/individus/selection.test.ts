import { type IndividuApiModel } from '@pilote/kpilote-shared/individu'
import { type ReferentielApiModel } from '@pilote/kpilote-shared/referentiel'
import { describe, expect, it } from 'vitest'

import { buildOrderedNodes, groupNodesByRootReferentiel } from './hierarchy'
import {
  buildSelecteurs,
  normalizeSelection,
  parseIndividusParam,
  resolveLectureCollection,
  resolveLectureIndicateur,
  selectIndividu,
  serializeIndividusParam,
} from './selection'

const referentiel = (id: string, nom: string): ReferentielApiModel => ({
  id,
  nom,
  description: null,
  nombreIndividus: 0,
  widgets: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

const individu = (
  id: string,
  nom: string,
  referentielId: string,
  parents: string[] = [],
): IndividuApiModel => ({
  id,
  nom,
  referentiel: referentielId,
  parents,
  metadata: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

// Deux stacks, ordonnés par le nom de leur racine : bassins versants
// (Adour-Garonne, Artois-Picardie, sans hiérarchie) puis territoires
// (France › PACA › Vaucluse, Bouches-du-Rhône).
const referentiels = [
  referentiel('REF-NAT', 'France (national)'),
  referentiel('REF-REG', 'Régions'),
  referentiel('REF-DEPT', 'Départements'),
  referentiel('REF-BV', 'Bassins versants'),
]
const nodes = buildOrderedNodes(
  [
    individu('NAT-FR', 'France', 'REF-NAT'),
    individu('REG-93', "Provence-Alpes-Côte d'Azur", 'REF-REG', ['NAT-FR']),
    individu('DEPT-84', 'Vaucluse', 'REF-DEPT', ['REG-93']),
    individu('DEPT-13', 'Bouches-du-Rhône', 'REF-DEPT', ['REG-93']),
    individu('BV-01', 'Artois-Picardie', 'REF-BV'),
    individu('BV-05', 'Adour-Garonne', 'REF-BV'),
  ],
  new Map(referentiels.map((ref) => [ref.id, ref] as const)),
)
const groups = groupNodesByRootReferentiel(nodes)

describe('parseIndividusParam / serializeIndividusParam', () => {
  it('lit une liste CSV en ignorant les segments vides', () => {
    expect(parseIndividusParam('DEPT-84, ,BV-05,')).toEqual(['DEPT-84', 'BV-05'])
  })

  it('lit une sélection vide sans paramètre', () => {
    expect(parseIndividusParam(undefined)).toEqual([])
  })

  it("n'écrit pas de paramètre pour une sélection vide", () => {
    expect(serializeIndividusParam([])).toBeUndefined()
    expect(serializeIndividusParam(['DEPT-84', 'BV-05'])).toBe('DEPT-84,BV-05')
  })
})

describe('normalizeSelection', () => {
  it("garde un individu par stack, dans l'ordre des stacks", () => {
    expect(normalizeSelection({ individus: ['DEPT-84', 'BV-05', 'DEPT-13'], groups })).toEqual([
      'BV-05',
      'DEPT-84',
    ])
  })

  it('ignore un individu absent de la hiérarchie', () => {
    expect(normalizeSelection({ individus: ['DEPT-99', 'BV-05'], groups })).toEqual(['BV-05'])
  })
})

describe('selectIndividu', () => {
  it('ajoute un individu sans toucher aux autres stacks', () => {
    expect(selectIndividu({ selection: ['BV-05'], groups, individu: 'DEPT-84' })).toEqual([
      'BV-05',
      'DEPT-84',
    ])
  })

  it('remplace la sélection du même stack, même à un autre niveau', () => {
    expect(selectIndividu({ selection: ['BV-05', 'DEPT-84'], groups, individu: 'REG-93' })).toEqual(
      ['BV-05', 'REG-93'],
    )
  })
})

describe('resolveLectureIndicateur', () => {
  const territorial = ['REF-NAT', 'REF-REG', 'REF-DEPT']
  const regional = ['REF-REG']
  const bassin = ['REF-BV']

  it('lit les racines sans sélection', () => {
    expect(resolveLectureIndicateur({ selection: [], nodes, referentielIds: bassin })).toEqual({
      individus: undefined,
      lien: {},
      indisponible: false,
    })
  })

  it("lit l'individu sélectionné qui concerne l'indicateur", () => {
    const lecture = resolveLectureIndicateur({
      selection: ['DEPT-84', 'BV-05'],
      nodes,
      referentielIds: territorial,
    })

    expect(lecture).toEqual({
      individus: ['DEPT-84', 'BV-05'],
      lien: { individu: 'DEPT-84', referentiel: 'REF-DEPT', individus: 'DEPT-84,BV-05' },
      indisponible: false,
    })
  })

  it("rend l'indicateur indisponible sans remonter vers un ancêtre", () => {
    const lecture = resolveLectureIndicateur({
      selection: ['DEPT-84'],
      nodes,
      referentielIds: regional,
    })

    expect(lecture).toEqual({
      individus: ['DEPT-84'],
      lien: { individus: 'DEPT-84' },
      indisponible: true,
    })
  })

  it("rend indisponible un indicateur d'un stack sans sélection", () => {
    expect(
      resolveLectureIndicateur({ selection: ['DEPT-84'], nodes, referentielIds: bassin })
        .indisponible,
    ).toBe(true)
  })
})

describe('resolveLectureCollection', () => {
  it('lit les racines sans sélection', () => {
    expect(resolveLectureCollection({ selection: [] })).toEqual({
      individus: undefined,
      lien: {},
      indisponible: false,
    })
  })

  it('lit toute la sélection et ne transmet que la sélection à la fiche', () => {
    expect(resolveLectureCollection({ selection: ['BV-05', 'DEPT-84'] })).toEqual({
      individus: ['BV-05', 'DEPT-84'],
      lien: { individus: 'BV-05,DEPT-84' },
      indisponible: false,
    })
  })
})

describe('buildSelecteurs', () => {
  it('annonce la racine de chaque stack par défaut sans sélection', () => {
    const selecteurs = buildSelecteurs({ groups, selection: [] })

    expect(
      selecteurs.map(({ group, value, placeholder, referentielIds }) => ({
        stack: group.referentiel.id,
        referentielIds,
        value,
        placeholder,
      })),
    ).toEqual([
      {
        stack: 'REF-BV',
        referentielIds: ['REF-BV'],
        value: '',
        placeholder: 'Adour-Garonne (par défaut)',
      },
      {
        stack: 'REF-NAT',
        referentielIds: ['REF-NAT', 'REF-REG', 'REF-DEPT'],
        value: '',
        placeholder: 'France (par défaut)',
      },
    ])
  })

  it("n'annonce plus de défaut dès qu'un stack a une sélection", () => {
    const selecteurs = buildSelecteurs({ groups, selection: ['BV-05'] })

    expect(selecteurs.map(({ value, placeholder }) => ({ value, placeholder }))).toEqual([
      { value: 'BV-05', placeholder: 'Aucune sélection' },
      { value: '', placeholder: 'Aucune sélection' },
    ])
  })
})
