// Rattachement des colonnes d'identité d'un fichier aux dimensions d'un indicateur
// multi-dimension. Pur et déterministe : la résolution sémantique (Albert) vient
// ensuite, colonne par colonne, contre les SEULS membres de la dimension retenue —
// « Orange » commune et « Orange » opérateur ne se confondent donc jamais.

export type DimensionCandidate = {
  publicId: string
  nom: string
  // Position dans l'ordre de l'indicateur (ordre canonique des coordonnées).
  rang: number
  membres: ReadonlyArray<{ publicId: string; nom: string }>
}

export type AffectationColonne<D extends DimensionCandidate> = {
  colonne: string
  dimension: D
}

// Comparaison tolérante (casse, accents, ponctuation) : « Saint-Étienne » = « saint etienne ».
export const normaliserLibelle = (texte: string): string =>
  texte
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

type Score = { indexColonne: number; indexDimension: number; taux: number; nombre: number }

// Pour chaque colonne, la dimension dont les membres correspondent le mieux à ses
// libellés (correspondance exacte nom/publicId), une dimension par colonne au plus.
// Affectation gloutonne par taux de correspondance décroissant (puis nombre, puis
// ordre des colonnes et des dimensions). Une colonne sans aucune correspondance
// exacte prend la première dimension restante dans l'ordre de l'indicateur ; à
// défaut (plus de colonnes que de dimensions), elle est ignorée.
export const choisirDimensionsColonnes = <D extends DimensionCandidate>({
  colonnes,
  dimensions,
}: {
  colonnes: ReadonlyArray<{ colonne: string; libelles: ReadonlyArray<string> }>
  dimensions: ReadonlyArray<D>
}): { affectations: AffectationColonne<D>[]; colonnesIgnorees: string[] } => {
  const clesParDimension = dimensions.map(
    (dimension) =>
      new Set(
        dimension.membres
          .flatMap((membre) => [normaliserLibelle(membre.nom), normaliserLibelle(membre.publicId)])
          .filter((cle) => cle.length > 0),
      ),
  )

  const scores: Score[] = colonnes.flatMap(({ libelles }, indexColonne) =>
    clesParDimension.map((cles, indexDimension) => {
      const nombre = libelles.filter((libelle) => cles.has(normaliserLibelle(libelle))).length
      return {
        indexColonne,
        indexDimension,
        nombre,
        taux: libelles.length === 0 ? 0 : nombre / libelles.length,
      }
    }),
  )

  const dimensionParColonne = new Map<number, number>()
  const dimensionsPrises = new Set<number>()
  const candidats = scores
    .filter((score) => score.nombre > 0)
    .sort(
      (a, b) =>
        b.taux - a.taux ||
        b.nombre - a.nombre ||
        a.indexColonne - b.indexColonne ||
        a.indexDimension - b.indexDimension,
    )
  for (const { indexColonne, indexDimension } of candidats) {
    if (dimensionParColonne.has(indexColonne) || dimensionsPrises.has(indexDimension)) continue
    dimensionParColonne.set(indexColonne, indexDimension)
    dimensionsPrises.add(indexDimension)
  }

  // Repli : colonnes sans correspondance exacte (abréviations…), dans l'ordre du plan.
  const ordreDimensions = dimensions
    .map((dimension, index) => ({ index, rang: dimension.rang }))
    .sort((a, b) => a.rang - b.rang)
  for (const indexColonne of colonnes.keys()) {
    if (dimensionParColonne.has(indexColonne)) continue
    const restante = ordreDimensions.find(({ index }) => !dimensionsPrises.has(index))
    if (!restante) continue
    dimensionParColonne.set(indexColonne, restante.index)
    dimensionsPrises.add(restante.index)
  }

  const affectations: AffectationColonne<D>[] = []
  const colonnesIgnorees: string[] = []
  for (const [indexColonne, { colonne }] of colonnes.entries()) {
    const indexDimension = dimensionParColonne.get(indexColonne)
    if (indexDimension === undefined) colonnesIgnorees.push(colonne)
    else affectations.push({ colonne, dimension: dimensions[indexDimension]! })
  }
  return { affectations, colonnesIgnorees }
}
