import { describe, expect, it } from 'vitest'

import {
  type AxeCalcul,
  buildGrapheAxes,
  type CombinaisonObservee,
  type ModaliteCalcul,
} from '@/axe/calculMarginale'
import { parseBucket } from '@/framework/bucket'
import { Decimal } from '@/framework/decimal'
import { cleCellule } from '@/valeurAvancement/cellule'
import {
  type IndividuRef,
  type PointInterne,
  resolveSerieNoeud,
  type SaisieTronquee,
} from '@/valeurAvancement/resolveSerieIndividu'

// Exemples de la spec multifiltre (§5) et des points à arbitrer de PIL-1963.
// Schémas : https://claude.ai/artifact/TduZuyP6atJ4bMZuQoHQQh

const DATE = '2025-01-01'
const REF_REG = 'ref-reg'
const REF_DEPT = 'ref-dept'

const PACA: IndividuRef = { id: 'paca', publicId: 'REG-93', referentielId: REF_REG }
const D84: IndividuRef = { id: 'd84', publicId: 'DEPT-84', referentielId: REF_DEPT }
const D13: IndividuRef = { id: 'd13', publicId: 'DEPT-13', referentielId: REF_DEPT }

const modalite = (id: string, axeId: string, parentId: string | null = null): ModaliteCalcul => ({
  id,
  publicId: id.toUpperCase(),
  axeId,
  parentId,
})

type Valeur = { individu: IndividuRef; modalites: Record<string, string>; valeur: number }

// Construit le graphe des axes à partir de valeurs saisies sur des combinaisons
// complètes (une modalité feuille par axe).
const cube = ({
  fonctionReg,
  axes,
  modalites,
  valeurs,
}: {
  fonctionReg: 'SUM' | 'AVG' | 'NONE'
  axes: ReadonlyArray<AxeCalcul>
  modalites: ReadonlyArray<ModaliteCalcul>
  valeurs: ReadonlyArray<Valeur>
}) => {
  const observeesParIndividu = new Map<string, CombinaisonObservee[]>()
  const saisiesParCellule = new Map<string, SaisieTronquee[]>()
  for (const { individu, modalites: parAxe, valeur } of valeurs) {
    const combinaisonId = Object.values(parAxe).sort().join(',')
    const observees = observeesParIndividu.get(individu.id) ?? []
    observees.push({ combinaisonId, modaliteParAxe: new Map(Object.entries(parAxe)) })
    observeesParIndividu.set(individu.id, observees)
    saisiesParCellule.set(cleCellule({ individuId: individu.id, combinaisonId }), [
      { bucket: parseBucket(DATE), dateOrigine: parseBucket(DATE), valeur: new Decimal(valeur) },
    ])
  }
  return buildGrapheAxes({
    enfantsParParent: new Map([[PACA.id, [D84, D13]]]),
    fonctionAgregationParReferentiel: new Map([[REF_REG, fonctionReg]]),
    axes,
    modalites,
    observeesParIndividu,
    saisiesParCellule,
  })
}

const dernierPoint = async (
  { graphe, noeud }: ReturnType<typeof cube>,
  individu: IndividuRef,
  selection: Record<string, string> = {},
): Promise<PointInterne | undefined> =>
  (
    await resolveSerieNoeud(noeud(individu, new Map(Object.entries(selection))), graphe, new Map())
  ).at(-1)

const valeurDe = async (...args: Parameters<typeof dernierPoint>) =>
  (await dernierPoint(...args))?.valeur.toNumber()

// --- Points d'accueil pour 10 000 habitants (point n°1 de PIL-1963) ---------

const OPERATEUR = 'op'
const modalitesOperateur = [modalite('ft', OPERATEUR), modalite('caf', OPERATEUR)]
const valeursPaca: Valeur[] = [
  { individu: D84, modalites: { [OPERATEUR]: 'ft' }, valeur: 1 },
  { individu: D84, modalites: { [OPERATEUR]: 'caf' }, valeur: 2 },
  { individu: D13, modalites: { [OPERATEUR]: 'ft' }, valeur: 3 },
]

describe('buildGrapheAxes — un axe', () => {
  const paca = (fonctionReg: 'SUM' | 'AVG', fonctionAxe: 'SUM' | 'AVG') =>
    cube({
      fonctionReg,
      axes: [{ id: OPERATEUR, fonction: fonctionAxe }],
      modalites: modalitesOperateur,
      valeurs: valeursPaca,
    })

  it('combine les axes avant le territoire : PACA = (1 + 2 + 3) / 2 = 3', async () => {
    const graphe = paca('AVG', 'SUM')

    expect(await valeurDe(graphe, D84)).toBe(3)
    expect(await valeurDe(graphe, D13)).toBe(3)
    expect(await valeurDe(graphe, PACA)).toBe(3)
  })

  it('moyenne sur les deux : 84 = 1,5, PACA = 2,25', async () => {
    const graphe = paca('AVG', 'AVG')

    expect(await valeurDe(graphe, D84)).toBe(1.5)
    expect(await valeurDe(graphe, PACA)).toBe(2.25)
  })

  it('PACA · France Travail = (1 + 3) / 2 = 2', async () => {
    expect(await valeurDe(paca('AVG', 'SUM'), PACA, { [OPERATEUR]: 'ft' })).toBe(2)
  })

  it('n’attend pas une modalité jamais observée : la CAF ne compte pas dans le 13', async () => {
    const point = await dernierPoint(paca('AVG', 'SUM'), D13)

    expect(point).toMatchObject({
      type: 'derivee',
      couverture: { nbEnfantsAvecValeur: 1, nbEnfantsTotal: 1 },
    })
  })

  it('expose les modalités dans les contributions', async () => {
    const point = await dernierPoint(paca('AVG', 'SUM'), D84)

    expect(point?.type === 'derivee' && point.contributions).toMatchObject([
      { individuPublicId: 'DEPT-84', modalites: ['CAF'], source: 'saisie' },
      { individuPublicId: 'DEPT-84', modalites: ['FT'], source: 'saisie' },
    ])
  })

  it('renvoie une série vide pour une modalité jamais observée de l’individu', async () => {
    expect(await dernierPoint(paca('AVG', 'SUM'), D13, { [OPERATEUR]: 'caf' })).toBeUndefined()
  })

  it('niveau territorial saisi (NONE) : « Tous » se calcule à ce niveau', async () => {
    const graphe = cube({
      fonctionReg: 'NONE',
      axes: [{ id: OPERATEUR, fonction: 'SUM' }],
      modalites: modalitesOperateur,
      valeurs: [
        ...valeursPaca,
        { individu: PACA, modalites: { [OPERATEUR]: 'ft' }, valeur: 5 },
        { individu: PACA, modalites: { [OPERATEUR]: 'caf' }, valeur: 6 },
      ],
    })

    expect(await valeurDe(graphe, PACA)).toBe(11)
  })
})

// --- Axe imbriqué sur trois niveaux ------------------------------------------

describe('buildGrapheAxes — axe imbriqué', () => {
  const FRAUDE = 'fraude'
  const graphe = cube({
    fonctionReg: 'SUM',
    axes: [{ id: FRAUDE, fonction: 'SUM' }],
    modalites: [
      modalite('a', FRAUDE),
      modalite('a1', FRAUDE, 'a'),
      modalite('a1x', FRAUDE, 'a1'),
      modalite('a1y', FRAUDE, 'a1'),
      modalite('a2', FRAUDE, 'a'),
      modalite('a2x', FRAUDE, 'a2'),
      modalite('b', FRAUDE),
      modalite('b1', FRAUDE, 'b'),
      modalite('b1x', FRAUDE, 'b1'),
      modalite('b1y', FRAUDE, 'b1'),
    ],
    valeurs: [
      { individu: D84, modalites: { [FRAUDE]: 'a1x' }, valeur: 1 },
      { individu: D84, modalites: { [FRAUDE]: 'a1y' }, valeur: 2 },
      { individu: D84, modalites: { [FRAUDE]: 'a2x' }, valeur: 4 },
      { individu: D84, modalites: { [FRAUDE]: 'b1x' }, valeur: 8 },
    ],
  })

  it('remonte les niveaux : feuille, parent, grand-parent, « Tous »', async () => {
    expect(await valeurDe(graphe, D84, { [FRAUDE]: 'a1x' })).toBe(1)
    expect(await valeurDe(graphe, D84, { [FRAUDE]: 'a1' })).toBe(3)
    expect(await valeurDe(graphe, D84, { [FRAUDE]: 'a' })).toBe(7)
    expect(await valeurDe(graphe, D84)).toBe(15)
  })

  it('ne détaille une modalité parente qu’en ses enfants observés', async () => {
    const point = await dernierPoint(graphe, D84, { [FRAUDE]: 'b1' })

    expect(point).toMatchObject({
      valeur: new Decimal(8),
      couverture: { nbEnfantsAvecValeur: 1, nbEnfantsTotal: 1 },
    })
  })
})

// --- Deux axes (point n°2 de PIL-1963) ----------------------------------------

describe('buildGrapheAxes — deux axes', () => {
  const OP = 'op'
  const FR = 'fr'
  const modalitesDeuxAxes = [
    modalite('orange', OP),
    modalite('sfr', OP),
    modalite('tva', FR),
    modalite('ir', FR),
  ]
  // SFR × IR n'a jamais de valeur dans le 84.
  const valeurs: Valeur[] = [
    { individu: D84, modalites: { [OP]: 'orange', [FR]: 'tva' }, valeur: 10 },
    { individu: D84, modalites: { [OP]: 'sfr', [FR]: 'tva' }, valeur: 30 },
    { individu: D84, modalites: { [OP]: 'orange', [FR]: 'ir' }, valeur: 20 },
  ]
  const operateurEnPremier = cube({
    fonctionReg: 'SUM',
    axes: [
      { id: OP, fonction: 'AVG' },
      { id: FR, fonction: 'SUM' },
    ],
    modalites: modalitesDeuxAxes,
    valeurs,
  })

  it('combine le premier axe déclaré en premier : opérateurs puis fraude = 40', async () => {
    expect(await valeurDe(operateurEnPremier, D84)).toBe(40)
  })

  it('dans l’ordre inverse, fraude puis opérateurs = 30', async () => {
    const fraudeEnPremier = cube({
      fonctionReg: 'SUM',
      axes: [
        { id: FR, fonction: 'SUM' },
        { id: OP, fonction: 'AVG' },
      ],
      modalites: modalitesDeuxAxes,
      valeurs,
    })

    expect(await valeurDe(fraudeEnPremier, D84)).toBe(30)
  })

  it('sélection partielle : une modalité sur un axe, « Tous » sur l’autre', async () => {
    expect(await valeurDe(operateurEnPremier, D84, { [FR]: 'tva' })).toBe(20)
    expect(await valeurDe(operateurEnPremier, D84, { [OP]: 'orange' })).toBe(30)
  })

  it('sélection complète : la saisie', async () => {
    expect(await valeurDe(operateurEnPremier, D84, { [OP]: 'sfr', [FR]: 'tva' })).toBe(30)
  })
})
