import {
  type CiblesSaisieApiModel,
  type PlanTransformation,
  type TableauSource,
} from '@pilote/kpilote-shared/valeurImport'
import { describe, expect, it } from 'vitest'

import {
  deriveEtatImport,
  selectTableauForAlbert,
} from '@/components/import-valeurs/deriveEtatImport'
import { type LectureTableau } from '@/components/import-valeurs/lecture/matriceVersTableau'

const cibles: CiblesSaisieApiModel = {
  individus: [{ id: 'DEPT-01', nom: 'Ain', referentiel: 'REF-DEPT' }],
  axes: [],
}
const standard: TableauSource = {
  entetes: ['individu', 'date', 'valeur'],
  lignes: [['DEPT-01', '2024-01-15', 7.2]],
}
const libre: TableauSource = { entetes: ['Département', '2023'], lignes: [['Ain', 7.2]] }
const lectureOf = (tableau: TableauSource): LectureTableau => ({ ok: true, tableau })
const plan: PlanTransformation = {
  individu: {
    colonne: 'Département',
    rapprochements: { Ain: { statut: 'RESOLU', publicId: 'DEPT-01', par: 'ALBERT' } },
  },
  axes: [],
  valeurs: { disposition: 'COLONNES', colonnes: [{ colonne: '2023', date: '2023-01-01' }] },
}
const base = {
  hasFile: true,
  lecture: lectureOf(libre),
  cibles,
  isCiblesError: false,
  planImport: undefined,
  etapes: [],
}

describe('deriveEtatImport', () => {
  it('est vide sans fichier', () => {
    expect(deriveEtatImport({ ...base, hasFile: false, lecture: undefined })).toEqual({
      kind: 'vide',
    })
  })

  it('lit tant que le fichier ou les cibles ne sont pas chargés', () => {
    expect(deriveEtatImport({ ...base, lecture: undefined }).kind).toBe('lecture')
    expect(deriveEtatImport({ ...base, cibles: undefined }).kind).toBe('lecture')
  })

  it('remonte une erreur de lecture, sans attendre les cibles', () => {
    const lecture: LectureTableau = { ok: false, error: { code: 'EMPTY' } }
    expect(deriveEtatImport({ ...base, lecture, cibles: undefined })).toEqual({
      kind: 'illisible',
      error: { code: 'EMPTY' },
    })
  })

  it('échoue quand les cibles de saisie ne se chargent pas', () => {
    const etat = deriveEtatImport({ ...base, cibles: undefined, isCiblesError: true })
    expect(etat.kind).toBe('echec')
  })

  it('affiche la grille d’un fichier au format standard sans Albert', () => {
    const etat = deriveEtatImport({ ...base, lecture: lectureOf(standard) })
    expect(etat).toMatchObject({ kind: 'grille', origine: 'STANDARD', tableau: standard })
  })

  it('attend Albert pour un fichier hors format, avec ses étapes', () => {
    const etat = deriveEtatImport(base)
    expect(etat.kind).toBe('attente')
    expect(etat.kind === 'attente' ? etat.etapes.map((etape) => etape.id) : []).toEqual([
      'lecture',
      'structure',
      'individus',
      'preparation',
    ])
  })

  it('affiche la grille du plan d’Albert', () => {
    const etat = deriveEtatImport({ ...base, planImport: { ok: true, plan } })
    expect(etat).toEqual({ kind: 'grille', tableau: libre, plan, origine: 'ALBERT' })
  })

  it('reprend l’explication quand le fichier est inexploitable', () => {
    const etat = deriveEtatImport({
      ...base,
      planImport: {
        ok: false,
        erreur: {
          type: 'FICHIER_INEXPLOITABLE',
          motif: 'PAS_DE_VALEUR',
          explication: 'Aucune colonne de valeur.',
        },
      },
    })
    expect(etat).toEqual({ kind: 'echec', explication: 'Aucune colonne de valeur.' })
  })
})

describe('selectTableauForAlbert', () => {
  it('ne confie à Albert qu’un fichier lisible hors format standard', () => {
    expect(selectTableauForAlbert({ lecture: lectureOf(libre), cibles })).toBe(libre)
    expect(selectTableauForAlbert({ lecture: lectureOf(standard), cibles })).toBeNull()
    expect(selectTableauForAlbert({ lecture: undefined, cibles })).toBeNull()
    expect(selectTableauForAlbert({ lecture: lectureOf(libre), cibles: undefined })).toBeNull()
  })
})
