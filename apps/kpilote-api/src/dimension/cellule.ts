// Clé canonique d'une cellule : uuids de ses membres triés (ordre ASCII des
// chaînes uuid en minuscules), joints par ','. Seule fonction autorisée à la
// calculer — l'unicité `cellule(indicateur_id, cle)` en dépend. Une cellule à une
// coordonnée a pour clé l'uuid de l'individu (c'est ainsi que la migration a
// repris l'historique mono-dimension).
export const cleCellule = (individuIds: ReadonlyArray<string>): string =>
  [...individuIds]
    .map((id) => id.toLowerCase())
    .sort()
    .join(',')

export const individuIdsDeCle = (cle: string): string[] => (cle === '' ? [] : cle.split(','))
