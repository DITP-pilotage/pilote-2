import { describe, expect, it } from 'vitest'
import type { NormaliserValeursImportResponseApiModel } from '@pilote/kpilote-shared/valeurImport'
import { deriverEtatImport, payloadDepuisEtat } from '@/components/import-valeurs/deriverEtatImport'
import type { ParsedRow, ParseResult } from '@/components/import-valeurs/lecture/matriceVersRows'

const fichier = (nom = 'valeurs.csv') => new File(['x'], nom)
const rows: ParsedRow[] = [{ individu: 'DEPT-84', date: '2024-01-15', valeur: 7.2 }]
const albertVide = { revue: null, echec: false }
const revue = { items: rows } as unknown as NormaliserValeursImportResponseApiModel
const parseOk: ParseResult = { ok: true, rows }
const parseHorsFormat: ParseResult = {
  ok: false,
  error: { code: 'MISSING_COLUMNS', missing: ['date'] },
}
const parseTropDeLignes: ParseResult = {
  ok: false,
  error: { code: 'TOO_MANY_ROWS', count: 1001, max: 1000 },
}

describe('deriverEtatImport', () => {
  it('vide quand aucun fichier', () => {
    expect(
      deriverEtatImport({
        file: null,
        lectureEnCours: false,
        parseResult: undefined,
        albert: albertVide,
      }),
    ).toEqual({ kind: 'vide' })
  })

  it('lecture tant que la matrice est en cours de chargement', () => {
    expect(
      deriverEtatImport({
        file: fichier(),
        lectureEnCours: true,
        parseResult: undefined,
        albert: albertVide,
      }),
    ).toEqual({ kind: 'lecture' })
  })

  it('lecture si le parse n’est pas encore disponible', () => {
    expect(
      deriverEtatImport({
        file: fichier(),
        lectureEnCours: false,
        parseResult: undefined,
        albert: albertVide,
      }),
    ).toEqual({ kind: 'lecture' })
  })

  it('standard quand le parse réussit', () => {
    expect(
      deriverEtatImport({
        file: fichier('a.csv'),
        lectureEnCours: false,
        parseResult: parseOk,
        albert: albertVide,
      }),
    ).toEqual({ kind: 'standard', rows, nomFichier: 'a.csv' })
  })

  it('illisible pour une erreur de parse non liée aux colonnes', () => {
    expect(
      deriverEtatImport({
        file: fichier(),
        lectureEnCours: false,
        parseResult: parseTropDeLignes,
        albert: albertVide,
      }),
    ).toEqual({ kind: 'illisible', error: { code: 'TOO_MANY_ROWS', count: 1001, max: 1000 } })
  })

  it('albertEnCours quand le format est hors norme et qu’Albert n’a pas encore répondu', () => {
    expect(
      deriverEtatImport({
        file: fichier(),
        lectureEnCours: false,
        parseResult: parseHorsFormat,
        albert: albertVide,
      }),
    ).toEqual({ kind: 'albertEnCours' })
  })

  it('albertRevue quand Albert a produit une extraction', () => {
    expect(
      deriverEtatImport({
        file: fichier(),
        lectureEnCours: false,
        parseResult: parseHorsFormat,
        albert: { revue, echec: false },
      }),
    ).toEqual({ kind: 'albertRevue', revue })
  })

  it('albertEchec retombe sur l’erreur de format quand Albert échoue', () => {
    expect(
      deriverEtatImport({
        file: fichier(),
        lectureEnCours: false,
        parseResult: parseHorsFormat,
        albert: { revue: null, echec: true },
      }),
    ).toEqual({ kind: 'albertEchec', error: { code: 'MISSING_COLUMNS', missing: ['date'] } })
  })
})

describe('payloadDepuisEtat', () => {
  it('renvoie les rows en mode standard', () => {
    expect(payloadDepuisEtat({ kind: 'standard', rows, nomFichier: 'a.csv' })).toBe(rows)
  })

  it('renvoie les items de la revue Albert', () => {
    expect(payloadDepuisEtat({ kind: 'albertRevue', revue })).toBe(revue.items)
  })

  it('renvoie null pour les autres états', () => {
    expect(payloadDepuisEtat({ kind: 'vide' })).toBeNull()
    expect(payloadDepuisEtat({ kind: 'lecture' })).toBeNull()
    expect(payloadDepuisEtat({ kind: 'albertEnCours' })).toBeNull()
    expect(payloadDepuisEtat({ kind: 'illisible', error: { code: 'EMPTY' } })).toBeNull()
  })
})
