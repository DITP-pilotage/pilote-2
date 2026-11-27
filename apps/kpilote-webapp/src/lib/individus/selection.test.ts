import { type IndividuApiModel } from '@pilote/kpilote-shared/individu'
import { type ReferentielApiModel } from '@pilote/kpilote-shared/referentiel'
import { describe, expect, it } from 'vitest'

import { buildOrderedNodes, groupNodesByRootReferentiel } from './hierarchy'
import {
  buildSelectors,
  findReadIndividu,
  findRootIndividu,
  normalizeSelection,
  removeIndividu,
  resolveCollectionReading,
  resolveIndicateurReading,
  selectIndividu,
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

describe('removeIndividu', () => {
  it("retire l'individu et garde les autres stacks", () => {
    expect(removeIndividu({ selection: ['BV-05', 'DEPT-84'], individu: 'DEPT-84' })).toEqual([
      'BV-05',
    ])
  })

  it('vide la sélection quand on retire le dernier individu', () => {
    expect(removeIndividu({ selection: ['BV-05'], individu: 'BV-05' })).toEqual([])
  })
})

describe('resolveIndicateurReading', () => {
  const territorial = ['REF-NAT', 'REF-REG', 'REF-DEPT']
  const regional = ['REF-REG']
  const bassin = ['REF-BV']

  it('lit les racines sans sélection', () => {
    expect(resolveIndicateurReading({ selection: [], nodes, referentielIds: bassin })).toEqual({
      individus: undefined,
      link: {},
      isUnavailable: false,
    })
  })

  it("lit l'individu sélectionné qui concerne l'indicateur", () => {
    const reading = resolveIndicateurReading({
      selection: ['DEPT-84', 'BV-05'],
      nodes,
      referentielIds: territorial,
    })

    expect(reading).toEqual({
      individus: ['DEPT-84', 'BV-05'],
      link: {
        individu: 'DEPT-84',
        referentiel: 'REF-DEPT',
        selectedIndividus: 'DEPT-84,BV-05',
      },
      isUnavailable: false,
    })
  })

  it("rend l'indicateur indisponible sans remonter vers un ancêtre", () => {
    const reading = resolveIndicateurReading({
      selection: ['DEPT-84'],
      nodes,
      referentielIds: regional,
    })

    expect(reading).toEqual({
      individus: ['DEPT-84'],
      link: { selectedIndividus: 'DEPT-84' },
      isUnavailable: true,
    })
  })

  it("rend indisponible un indicateur d'un stack sans sélection", () => {
    expect(
      resolveIndicateurReading({ selection: ['DEPT-84'], nodes, referentielIds: bassin })
        .isUnavailable,
    ).toBe(true)
  })
})

describe('resolveCollectionReading', () => {
  it('lit les racines sans sélection', () => {
    expect(resolveCollectionReading({ selection: [] })).toEqual({
      individus: undefined,
      link: {},
      isUnavailable: false,
    })
  })

  it('lit toute la sélection et ne transmet que la sélection à la fiche', () => {
    expect(resolveCollectionReading({ selection: ['BV-05', 'DEPT-84'] })).toEqual({
      individus: ['BV-05', 'DEPT-84'],
      link: { selectedIndividus: 'BV-05,DEPT-84' },
      isUnavailable: false,
    })
  })
})

describe('buildSelectors', () => {
  it('annonce la root de chaque stack par défaut sans sélection', () => {
    const selectors = buildSelectors({ groups, selection: [] })

    expect(
      selectors.map(({ group, value, placeholder, referentielIds }) => ({
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
    const selectors = buildSelectors({ groups, selection: ['BV-05'] })

    expect(selectors.map(({ value, placeholder }) => ({ value, placeholder }))).toEqual([
      { value: 'BV-05', placeholder: 'Aucune sélection' },
      { value: '', placeholder: 'Aucune sélection' },
    ])
  })
})

describe('findRootIndividu', () => {
  it("prend l'individu sans parent dans les référentiels liés", () => {
    expect(findRootIndividu({ nodes, referentielIds: ['REF-DEPT', 'REF-REG', 'REF-NAT'] })).toBe(
      'NAT-FR',
    )
  })

  it('ne remonte pas vers un parent hors des référentiels liés, et départage par le nom', () => {
    expect(findRootIndividu({ nodes, referentielIds: ['REF-DEPT'] })).toBe('DEPT-13')
  })

  it('ne renvoie rien sans référentiel lié', () => {
    expect(findRootIndividu({ nodes, referentielIds: [] })).toBeUndefined()
  })
})

describe('findReadIndividu', () => {
  const reading = {
    individus: ['DEPT-84'],
    link: { individu: 'DEPT-84', referentiel: 'REF-DEPT' },
    isUnavailable: false,
  }

  it("renvoie l'individu de la lecture quand l'indicateur est lié à son référentiel", () => {
    expect(findReadIndividu({ reading, nodes, referentielIds: ['REF-NAT', 'REF-DEPT'] })).toBe(
      'DEPT-84',
    )
  })

  it("ne renvoie rien quand l'indicateur n'est pas lié au référentiel de l'individu", () => {
    expect(findReadIndividu({ reading, nodes, referentielIds: ['REF-BV'] })).toBeUndefined()
  })

  it("lit l'individu racine sans sélection", () => {
    expect(
      findReadIndividu({
        reading: { individus: undefined, link: {}, isUnavailable: false },
        nodes,
        referentielIds: ['REF-BV'],
      }),
    ).toBe('BV-05')
  })
})
