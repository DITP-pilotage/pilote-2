import { err, ok } from 'neverthrow'
import { describe, expect, it } from 'vitest'

import { type RequestedModalite } from '@/axe/requestedModalites'
import {
  aggregateModalitesErrors,
  detectDuplicateKeys,
  type ModalitesByItem,
} from '@/valeurAvancement/batchErrors'

const modalite = (publicId: string, axeId: string): RequestedModalite => ({
  id: `id-${publicId}`,
  publicId,
  axeId,
  axePublicId: `AXE-${axeId}`,
  isLeaf: true,
})
const orange = modalite('OP-ORANGE', 'OP')
const sfr = modalite('OP-SFR', 'OP')
const tva = modalite('FR-TVA', 'FR')

const item = (individu: string, date: string) => ({ individu, date, valeur: 1 })

describe('detectDuplicateKeys', () => {
  it('sans axe : un doublon par couple (individu, date)', () => {
    const items = [
      item('DEPT-84', '2025-01-01'),
      item('DEPT-13', '2025-01-01'),
      item('DEPT-84', '2025-01-01'),
    ]
    const modalitesByItem: ModalitesByItem = items.map(() => ok([]))

    expect(detectDuplicateKeys({ items, modalitesByItem })).toEqual([
      { code: 'DUPLICATE_KEY', indices: [0, 2], individu: 'DEPT-84', date: '2025-01-01' },
    ])
  })

  it('avec axes : la cellule compte ses modalités, dans l’ordre des axes', () => {
    const items = [
      item('DEPT-84', '2025-01-01'),
      item('DEPT-84', '2025-01-01'),
      item('DEPT-84', '2025-01-01'),
    ]
    // Les modalités validées arrivent dans l'ordre des axes, quel que soit
    // l'ordre de saisie : les items 0 et 2 désignent la même cellule.
    const modalitesByItem: ModalitesByItem = [ok([orange, tva]), ok([sfr, tva]), ok([orange, tva])]

    expect(detectDuplicateKeys({ items, modalitesByItem })).toEqual([
      {
        code: 'DUPLICATE_KEY',
        indices: [0, 2],
        individu: 'DEPT-84',
        modalites: ['OP-ORANGE', 'FR-TVA'],
        date: '2025-01-01',
      },
    ])
  })

  it('ignore les items dont les modalités sont invalides', () => {
    const items = [item('DEPT-84', '2025-01-01'), item('DEPT-84', '2025-01-01')]
    const modalitesByItem: ModalitesByItem = [
      ok([orange]),
      err({ type: 'MODALITE_INCONNUE', modalites: ['OP-XXX'] }),
    ]

    expect(detectDuplicateKeys({ items, modalitesByItem })).toEqual([])
  })
})

describe('aggregateModalitesErrors', () => {
  it('une entrée par cause et par modalité ou axe, avec toutes ses lignes', () => {
    const modalitesByItem: ModalitesByItem = [
      err({ type: 'MODALITE_INCONNUE', modalites: ['OP-XXX', 'FR-YYY'] }),
      ok([orange, tva]),
      err({ type: 'MODALITE_INCONNUE', modalites: ['OP-XXX'] }),
      err({ type: 'MODALITE_MANQUANTE', axes: ['AXE-FR'] }),
      err({ type: 'MODALITE_MANQUANTE', axes: ['AXE-OP', 'AXE-FR'] }),
      err({ type: 'MODALITES_MEME_AXE', axe: 'AXE-OP', modalites: ['OP-ORANGE', 'OP-SFR'] }),
      err({ type: 'AXE_NON_DECLARE', modalites: ['AUTRE-1'] }),
      err({ type: 'MODALITE_NON_FEUILLE', modalites: ['FR-FISCALE'] }),
    ]

    expect(aggregateModalitesErrors({ modalitesByItem })).toEqual([
      { code: 'MODALITE_INCONNUE', indices: [0, 2], modalite: 'OP-XXX' },
      { code: 'MODALITE_INCONNUE', indices: [0], modalite: 'FR-YYY' },
      { code: 'MODALITE_MANQUANTE', indices: [3, 4], axe: 'AXE-FR' },
      { code: 'MODALITE_MANQUANTE', indices: [4], axe: 'AXE-OP' },
      { code: 'MODALITES_MEME_AXE', indices: [5], axe: 'AXE-OP' },
      { code: 'AXE_NON_DECLARE', indices: [6], modalite: 'AUTRE-1' },
      { code: 'MODALITE_NON_FEUILLE', indices: [7], modalite: 'FR-FISCALE' },
    ])
  })

  it('rien sans erreur', () => {
    expect(aggregateModalitesErrors({ modalitesByItem: [ok([]), ok([orange])] })).toEqual([])
  })
})
