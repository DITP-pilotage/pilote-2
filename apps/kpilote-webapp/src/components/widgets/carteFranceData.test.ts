import { type IndividuApiModel } from '@pilote/kpilote-shared/individu'
import { describe, expect, it } from 'vitest'

import { buildCarteFranceBindings } from './carteFranceData'

const departement = (id: string, metadata: IndividuApiModel['metadata']): IndividuApiModel => ({
  id,
  nom: id,
  referentiel: 'REF-DEPT',
  parents: [],
  metadata,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

const contribution = (individu: string, valeur: number) => ({
  individu,
  valeur,
  date: '2026-01-01',
  source: 'saisie' as const,
})

describe('buildCarteFranceBindings', () => {
  it('lit la clé de jointure du widget dans les métadonnées', () => {
    const bindings = buildCarteFranceBindings({
      individus: [departement('DEPT-84', { codeInsee: '84', code: 'V' })],
      contributions: [contribution('DEPT-84', 5)],
      joinKey: 'code',
    })
    expect(bindings.points).toEqual([{ joinValue: 'V', valeur: 5, nom: 'DEPT-84' }])
    expect(bindings.individuIdByJoinValue.get('V')).toBe('DEPT-84')
  })

  it('rattache une contribution de tranche (cellule) au membre du référentiel', () => {
    const bindings = buildCarteFranceBindings({
      individus: [departement('DEPT-84', { codeInsee: '84' }), departement('DEPT-13', null)],
      contributions: [contribution('DEPT-84~OP-ORANGE', 7), contribution('DEPT-13~OP-ORANGE', 2)],
      joinKey: 'codeInsee',
    })
    expect(bindings.points).toEqual([{ joinValue: '84', valeur: 7, nom: 'DEPT-84' }])
  })
})
