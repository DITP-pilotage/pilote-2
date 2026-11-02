import { type FonctionAgregation } from '@pilote/kpilote-shared/indicateur'
import { describe, expect, it } from 'vitest'

import {
  buildGrapheCube,
  buildSupport,
  cleDeCoordonnees,
  type Coordonnees,
  type DimensionCube,
  type MembreCube,
  type TopologieCube,
} from '@/dimension/buildGrapheCube'
import { cleCellule } from '@/dimension/cellule'

// Cube de test : Territoire (NAT → REG-1 → DEPT-1, DEPT-2 ; NAT → REG-2 → DEPT-3)
// × Opérateur (OP-ORANGE, OP-SFR, à plat). Les ids sont des chaînes lisibles :
// `buildGrapheCube` ne fait aucune hypothèse sur leur format.
const DIM_T = 'dim-t'
const DIM_O = 'dim-o'
const REF_NAT = 'ref-nat'
const REF_REG = 'ref-reg'
const REF_DEPT = 'ref-dept'
const REF_OP = 'ref-op'

const membre = (id: string, publicId: string, referentielId: string, dimensionId: string) =>
  [id, { id, publicId, referentielId, dimensionId }] as const

const MEMBRES = new Map<string, MembreCube>([
  membre('nat', 'NAT', REF_NAT, DIM_T),
  membre('reg1', 'REG-1', REF_REG, DIM_T),
  membre('reg2', 'REG-2', REF_REG, DIM_T),
  membre('d1', 'DEPT-1', REF_DEPT, DIM_T),
  membre('d2', 'DEPT-2', REF_DEPT, DIM_T),
  membre('d3', 'DEPT-3', REF_DEPT, DIM_T),
  membre('orange', 'OP-ORANGE', REF_OP, DIM_O),
  membre('sfr', 'OP-SFR', REF_OP, DIM_O),
])

const ENFANTS: Record<string, string[]> = {
  nat: ['reg1', 'reg2'],
  reg1: ['d1', 'd2'],
  reg2: ['d3'],
}

const parentsDe = (enfants: Record<string, string[]>) => {
  const parents = new Map<string, string[]>()
  for (const [parent, liste] of Object.entries(enfants)) {
    for (const enfant of liste) parents.set(enfant, [...(parents.get(enfant) ?? []), parent])
  }
  return parents
}

const topologie = ({
  ordre = [DIM_T, DIM_O],
  marginaleT = 'SUM',
  marginaleO = 'SUM',
  niveauT = 'SUM',
  enfants = ENFANTS,
  racinesT = ['nat'],
}: {
  ordre?: string[]
  marginaleT?: FonctionAgregation
  marginaleO?: FonctionAgregation
  niveauT?: FonctionAgregation
  enfants?: Record<string, string[]>
  racinesT?: string[]
} = {}): TopologieCube => {
  const dimensions: Record<string, DimensionCube> = {
    [DIM_T]: {
      dimensionId: DIM_T,
      fonctionMarginale: marginaleT,
      fonctionParNiveau: new Map<string, FonctionAgregation>([
        [REF_NAT, niveauT],
        [REF_REG, niveauT],
        [REF_DEPT, niveauT],
      ]),
    },
    [DIM_O]: {
      dimensionId: DIM_O,
      fonctionMarginale: marginaleO,
      fonctionParNiveau: new Map<string, FonctionAgregation>([[REF_OP, 'NONE']]),
    },
  }
  return {
    dimensions: ordre.map((id) => dimensions[id]!),
    membres: MEMBRES,
    enfantsParMembre: new Map(Object.entries(enfants)),
    parentsParMembre: parentsDe(enfants),
    racinesParDimension: new Map([
      [DIM_T, racinesT],
      [DIM_O, ['orange', 'sfr']],
    ]),
  }
}

const cellule = (coordonnees: Partial<Record<typeof DIM_T | typeof DIM_O, string>>): Coordonnees =>
  new Map(Object.entries(coordonnees))

const cle = (...ids: string[]) => cleCellule(ids)

// publicIds des enfants d'un nœud (clé), triés.
const enfantsPublicIds = (
  graphe: ReturnType<typeof buildGrapheCube>,
  coordonnees: Coordonnees,
): string[] | undefined =>
  graphe.enfantsParParent
    .get(cleDeCoordonnees(coordonnees))
    ?.map((ref) => ref.publicId)
    .sort()

describe('buildGrapheCube — ordre de remontée', () => {
  it("éclate d'abord la dimension d'ordre 0 (opération externe) : REG → DEPT", () => {
    const support = buildSupport({
      topologie: topologie(),
      clesAvecValeurs: [cle('d1', 'orange'), cle('d2', 'sfr')],
    })
    const graphe = buildGrapheCube({
      topologie: topologie(),
      support,
      cibles: [cellule({ [DIM_T]: 'reg1' })],
    })

    expect(enfantsPublicIds(graphe, cellule({ [DIM_T]: 'reg1' }))).toEqual(['DEPT-1', 'DEPT-2'])
    // Puis chaque département éclate sa marginale Opérateur.
    expect(enfantsPublicIds(graphe, cellule({ [DIM_T]: 'd1' }))).toEqual(['DEPT-1~OP-ORANGE'])
    expect(enfantsPublicIds(graphe, cellule({ [DIM_T]: 'd2' }))).toEqual(['DEPT-2~OP-SFR'])
  })

  it("avec Opérateur en ordre 0, REG éclate d'abord la marginale Opérateur", () => {
    const topo = topologie({ ordre: [DIM_O, DIM_T] })
    const support = buildSupport({
      topologie: topo,
      clesAvecValeurs: [cle('d1', 'orange'), cle('d2', 'sfr')],
    })
    const graphe = buildGrapheCube({
      topologie: topo,
      support,
      cibles: [cellule({ [DIM_T]: 'reg1' })],
    })

    // Les publicIds suivent l'ordre des dimensions (Opérateur d'abord).
    expect(enfantsPublicIds(graphe, cellule({ [DIM_T]: 'reg1' }))).toEqual([
      'OP-ORANGE~REG-1',
      'OP-SFR~REG-1',
    ])
    expect(enfantsPublicIds(graphe, cellule({ [DIM_T]: 'reg1', [DIM_O]: 'orange' }))).toEqual([
      'OP-ORANGE~DEPT-1',
    ])
  })

  it("range la fonction de l'éclatement sous la clé synthétique du nœud", () => {
    const topo = topologie({ niveauT: 'AVG', marginaleO: 'SUM' })
    const support = buildSupport({ topologie: topo, clesAvecValeurs: [cle('d1', 'orange')] })
    const graphe = buildGrapheCube({
      topologie: topo,
      support,
      cibles: [cellule({ [DIM_T]: 'reg1' })],
    })

    const cleReg = cle('reg1')
    expect(graphe.referentielParIndividu.get(cleReg)).toBe(cleReg)
    expect(graphe.fonctionAgregationParReferentiel.get(cleReg)).toBe('AVG')
    expect(graphe.fonctionAgregationParReferentiel.get(cle('d1'))).toBe('SUM')
  })
})

describe('buildGrapheCube — enfants attendus', () => {
  it('marginale pure : tous les enfants hiérarchiques sont attendus, même sans support', () => {
    const topo = topologie()
    const support = buildSupport({ topologie: topo, clesAvecValeurs: [cle('d1', 'orange')] })
    const graphe = buildGrapheCube({
      topologie: topo,
      support,
      cibles: [cellule({ [DIM_T]: 'nat' })],
    })

    expect(enfantsPublicIds(graphe, cellule({ [DIM_T]: 'nat' }))).toEqual(['REG-1', 'REG-2'])
    expect(enfantsPublicIds(graphe, cellule({ [DIM_T]: 'reg1' }))).toEqual(['DEPT-1', 'DEPT-2'])
  })

  it('cube creux : seuls les candidats à support sont attendus', () => {
    const topo = topologie()
    const support = buildSupport({
      topologie: topo,
      clesAvecValeurs: [cle('d1', 'orange'), cle('d1', 'sfr'), cle('d3', 'orange')],
    })
    const graphe = buildGrapheCube({
      topologie: topo,
      support,
      cibles: [cellule({ [DIM_T]: 'd3' }), cellule({ [DIM_O]: 'sfr' })],
    })

    // OP-SFR absent du DEPT-3 : il n'est pas attendu.
    expect(enfantsPublicIds(graphe, cellule({ [DIM_T]: 'd3' }))).toEqual(['DEPT-3~OP-ORANGE'])
    // Tranche OP-SFR : seule la branche REG-1/DEPT-1 a du support.
    expect(enfantsPublicIds(graphe, cellule({ [DIM_T]: 'nat', [DIM_O]: 'sfr' }))).toEqual([
      'REG-1~OP-SFR',
    ])
    expect(enfantsPublicIds(graphe, cellule({ [DIM_T]: 'reg1', [DIM_O]: 'sfr' }))).toEqual([
      'DEPT-1~OP-SFR',
    ])
  })

  it("cellule feuille quand aucun enfant n'est attendu", () => {
    const topo = topologie()
    const graphe = buildGrapheCube({
      topologie: topo,
      support: new Set(),
      cibles: [cellule({ [DIM_T]: 'd2' })],
    })

    expect(graphe.enfantsParParent.has(cle('d2'))).toBe(false)
    expect(graphe.fonctionAgregationParReferentiel.has(cle('d2'))).toBe(false)
    expect(graphe.noeuds.has(cle('d2'))).toBe(true)
  })

  it('une marginale NONE ne s’éclate pas : la cellule partielle est une feuille', () => {
    const topo = topologie({ marginaleO: 'NONE' })
    const support = buildSupport({ topologie: topo, clesAvecValeurs: [cle('d1', 'orange')] })
    const graphe = buildGrapheCube({
      topologie: topo,
      support,
      cibles: [cellule({ [DIM_T]: 'd1' })],
    })

    expect(graphe.enfantsParParent.has(cle('d1'))).toBe(false)
  })

  it('niveaux non déclarés sautés : NAT a pour enfants directs les DEPT', () => {
    // Topologie telle que la produit `loadTopologieCube` sans REG déclaré.
    const topo = topologie({ enfants: { nat: ['d1', 'd2', 'd3'] } })
    const graphe = buildGrapheCube({
      topologie: topo,
      support: new Set(),
      cibles: [cellule({ [DIM_T]: 'nat' })],
    })

    expect(enfantsPublicIds(graphe, cellule({ [DIM_T]: 'nat' }))).toEqual([
      'DEPT-1',
      'DEPT-2',
      'DEPT-3',
    ])
  })
})

describe('buildGrapheCube — racine virtuelle', () => {
  it('une dimension absente éclate vers ses racines avec la fonction de la marginale', () => {
    const topo = topologie({ marginaleT: 'AVG' })
    const support = buildSupport({ topologie: topo, clesAvecValeurs: [cle('d1', 'orange')] })
    const graphe = buildGrapheCube({
      topologie: topo,
      support,
      cibles: [cellule({ [DIM_O]: 'orange' })],
    })

    expect(enfantsPublicIds(graphe, cellule({ [DIM_O]: 'orange' }))).toEqual(['NAT~OP-ORANGE'])
    expect(graphe.fonctionAgregationParReferentiel.get(cle('orange'))).toBe('AVG')
  })

  it('les racines sont les membres sans ancêtre déclaré (plusieurs racines)', () => {
    const topo = topologie({
      enfants: { reg1: ['d1', 'd2'], reg2: ['d3'] },
      racinesT: ['reg1', 'reg2'],
    })
    const support = buildSupport({
      topologie: topo,
      clesAvecValeurs: [cle('d1', 'orange'), cle('d3', 'orange')],
    })
    const graphe = buildGrapheCube({
      topologie: topo,
      support,
      cibles: [cellule({ [DIM_O]: 'orange' })],
    })

    expect(enfantsPublicIds(graphe, cellule({ [DIM_O]: 'orange' }))).toEqual([
      'REG-1~OP-ORANGE',
      'REG-2~OP-ORANGE',
    ])
  })
})

describe('buildGrapheCube — identité des nœuds', () => {
  it('clé canonique et publicId indépendants de l’ordre de construction des coordonnées', () => {
    const topo = topologie()
    const graphe = buildGrapheCube({
      topologie: topo,
      support: new Set(),
      cibles: [
        new Map([
          [DIM_O, 'orange'],
          [DIM_T, 'd1'],
        ]),
      ],
    })

    expect(graphe.cibles).toEqual([
      { id: cle('d1', 'orange'), publicId: 'DEPT-1~OP-ORANGE', referentielId: cle('d1', 'orange') },
    ])
  })
})

describe('buildSupport', () => {
  it('un fait donne du support à toutes les cellules de son sur-cube (ancêtres × marginales)', () => {
    const support = buildSupport({
      topologie: topologie(),
      clesAvecValeurs: [cle('d1', 'orange')],
    })

    expect([...support].sort()).toEqual(
      [
        cle('d1', 'orange'),
        cle('d1'),
        cle('reg1', 'orange'),
        cle('reg1'),
        cle('nat', 'orange'),
        cle('nat'),
        cle('orange'),
      ].sort(),
    )
    expect(support.has(cle('d2'))).toBe(false)
    expect(support.has(cle('d1', 'sfr'))).toBe(false)
  })

  it('projette (ignore) les coordonnées des dimensions hors topologie', () => {
    const territoireSeul: TopologieCube = {
      ...topologie(),
      dimensions: [topologie().dimensions[0]!],
    }
    const support = buildSupport({
      topologie: territoireSeul,
      clesAvecValeurs: [cle('d3', 'sfr')],
    })

    expect([...support].sort()).toEqual([cle('d3'), cle('reg2'), cle('nat')].sort())
  })
})
