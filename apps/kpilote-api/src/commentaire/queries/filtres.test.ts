import { describe, expect, it } from 'vitest'

import { filtreParType } from '@/commentaire/queries/filtres'

describe('filtreParType', () => {
  it('inclut les 2 satellites pour un type partagé (DEFAUT)', () => {
    expect(filtreParType('DEFAUT')).toEqual({
      OR: [{ indicateurIndividu: { type: 'DEFAUT' } }, { dossier: { type: 'DEFAUT' } }],
    })
  })

  it('inclut les 2 satellites pour CONFIANCE', () => {
    expect(filtreParType('CONFIANCE')).toEqual({
      OR: [{ indicateurIndividu: { type: 'CONFIANCE' } }, { dossier: { type: 'CONFIANCE' } }],
    })
  })

  it("n'inclut que le satellite dossier pour OBJECTIF (seul enum à le contenir)", () => {
    expect(filtreParType('OBJECTIF')).toEqual({
      OR: [{ dossier: { type: 'OBJECTIF' } }],
    })
  })

  it('retourne un OR vide pour une valeur inconnue de tous les enums', () => {
    expect(filtreParType('INCONNU')).toEqual({ OR: [] })
  })
})
