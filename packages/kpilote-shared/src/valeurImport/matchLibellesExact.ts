import { groupBy, mapValues, uniq } from 'es-toolkit'

import { unaccent } from '../texte'
import { type Rapprochement } from '../valeurImport'

export type CandidatRapprochement = { id: string; nom: string }

// Libellé comparable : sans accents, en minuscules, ponctuation réduite à des espaces.
export const normalizeLibelle = (libelle: string): string =>
  unaccent(libelle)
    .toLowerCase()
    .replaceAll(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim()

// Rapproche sans IA les libellés qui désignent sans ambiguïté un candidat, par
// son identifiant public ou par son nom. Deux candidats de même nom laissent le
// libellé à rapprocher : on ne tranche pas au hasard.
export const matchLibellesExact = ({
  libelles,
  candidats,
}: {
  libelles: ReadonlyArray<string>
  candidats: ReadonlyArray<CandidatRapprochement>
}): { rapprochements: Record<string, Rapprochement>; restants: string[] } => {
  const keys = candidats.flatMap((candidat) =>
    [normalizeLibelle(candidat.id), normalizeLibelle(candidat.nom)].map((key) => ({
      key,
      id: candidat.id,
    })),
  )
  const idsByKey = mapValues(
    groupBy(keys, (entry) => entry.key),
    (entries) => uniq(entries.map((entry) => entry.id)),
  )

  const rapprochements: Record<string, Rapprochement> = {}
  const restants: string[] = []
  for (const libelle of libelles) {
    const ids = idsByKey[normalizeLibelle(libelle)] ?? []
    const [id] = ids
    if (ids.length === 1 && id !== undefined) {
      rapprochements[libelle] = { statut: 'RESOLU', publicId: id, par: 'EXACT' }
    } else {
      restants.push(libelle)
    }
  }
  return { rapprochements, restants }
}
