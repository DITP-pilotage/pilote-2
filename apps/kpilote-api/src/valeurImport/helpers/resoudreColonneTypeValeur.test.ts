import { describe, expect, it } from 'vitest'

import { resoudreColonneTypeValeur } from '@/valeurImport/helpers/resoudreColonneTypeValeur'

const headers = ['zone_nom', 'date_valeur', 'type_valeur', 'valeur']

describe('resoudreColonneTypeValeur', () => {
  it('retourne le nom quand la colonne existe dans les headers', () => {
    expect(resoudreColonneTypeValeur({ colonneTypeValeur: { nom: 'type_valeur' }, headers })).toBe(
      'type_valeur',
    )
  })

  it('retourne null quand colonneTypeValeur est absent', () => {
    expect(resoudreColonneTypeValeur({ colonneTypeValeur: undefined, headers })).toBeNull()
  })

  it('retourne null quand le nom est vide (faux positif Albert)', () => {
    expect(resoudreColonneTypeValeur({ colonneTypeValeur: { nom: '' }, headers })).toBeNull()
  })

  it('retourne null quand le nom est composé uniquement d’espaces', () => {
    expect(resoudreColonneTypeValeur({ colonneTypeValeur: { nom: '   ' }, headers })).toBeNull()
  })

  it('retourne null quand le nom ne correspond à aucun header (hallucination)', () => {
    expect(
      resoudreColonneTypeValeur({ colonneTypeValeur: { nom: 'inexistant' }, headers }),
    ).toBeNull()
  })
})
