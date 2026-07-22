import { celluleVersTexte } from './celluleXlsx'

// Projection permissive d'une matrice vers des records bruts (entête -> cellule).
// Ne présume aucune structure de colonnes : c'est l'entrée de l'extraction Albert
// pour les fichiers hors format standard.
export function matriceVersRecords({
  matrice,
}: {
  matrice: unknown[][]
}): Array<Record<string, unknown>> {
  const [ligneEntetes, ...lignes] = matrice
  if (ligneEntetes === undefined) return []
  const entetes = ligneEntetes.map((cellule) => celluleVersTexte(cellule).trim())

  return lignes
    .filter((ligne) => ligne.some((cellule) => celluleVersTexte(cellule).trim().length > 0))
    .map((ligne) => {
      const record: Record<string, unknown> = {}
      entetes.forEach((entete, index) => {
        if (entete.length > 0) record[entete] = ligne[index]
      })
      return record
    })
}
