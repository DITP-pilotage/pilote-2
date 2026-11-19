import { type ModaliteApiModel } from '@pilote/kpilote-shared/axe'
import { describe, expect, it } from 'vitest'

import { buildArbre, TOUS_ID } from '@/lib/axeArbre'
import { type AxeCroise, buildCroisement, celluleKey } from '@/lib/axesCroises'

const modalite = (id: string): ModaliteApiModel => ({
  id,
  nom: id,
  parent: null,
  niveau: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

const operateur = buildArbre([modalite('ORANGE'), modalite('SFR')])
const fraude = buildArbre([modalite('TVA'), modalite('IR')])

// Cube creux : SFR × IR n'est jamais saisi.
const saisies = {
  [celluleKey(['ORANGE', 'TVA'])]: '10',
  [celluleKey(['ORANGE', 'IR'])]: '20',
  [celluleKey(['SFR', 'TVA'])]: '30',
}

const axes = ({ premier, second }: { premier: AxeCroise; second: AxeCroise }) => [premier, second]
const opAvg: AxeCroise = { id: 'OP', nom: 'Opérateur', arbre: operateur, fonction: 'AVG' }
const fraudeAvg: AxeCroise = { id: 'FR', nom: 'Fraude', arbre: fraude, fonction: 'AVG' }

describe('buildCroisement', () => {
  it('descend le dernier axe déclaré et combine donc le premier au plus près des saisies', () => {
    const resolve = buildCroisement({ axes: axes({ premier: opAvg, second: fraudeAvg }), saisies })

    const tous = resolve([TOUS_ID, TOUS_ID])
    expect(tous.axeDescendu).toBe(1)
    // moyenne(TVA = moyenne(10, 30), IR = moyenne(20)) = moyenne(20, 20)
    expect(tous.value).toBe(20)
  })

  it('donne un autre « Tous » en moyenne quand on inverse l’ordre et qu’il manque une combinaison', () => {
    const resolve = buildCroisement({
      axes: axes({ premier: fraudeAvg, second: opAvg }),
      saisies: Object.fromEntries(
        Object.entries(saisies).map(([key, value]) => [key.split('|').reverse().join('|'), value]),
      ),
    })

    // moyenne(ORANGE = moyenne(10, 20), SFR = moyenne(30)) = moyenne(15, 30)
    expect(resolve([TOUS_ID, TOUS_ID]).value).toBe(22.5)
  })

  it('sort une combinaison jamais saisie du calcul', () => {
    const resolve = buildCroisement({ axes: axes({ premier: opAvg, second: fraudeAvg }), saisies })

    expect(resolve(['SFR', 'IR']).statut).toBe('absente')
    expect(resolve(['SFR', TOUS_ID])).toMatchObject({ value: 30, present: 1, expected: 1 })
  })
})
