import type {
  ConfigurationIndicateurDimension,
  FonctionAgregation,
} from '@pilote/kpilote-shared/indicateur'

// Les dimensions d'un indicateur se déduisent de ses niveaux (référentiel →
// dimension). Tant qu'elles sont moins de deux, l'indicateur est mono-dimension :
// aucune configuration n'est affichée ni envoyée (contrat historique intact).
// Au-delà, chaque dimension couverte reçoit une configuration (ordre, fonction
// de la marginale, grain des objectifs) : celle déjà saisie, sinon un défaut.

const dimensionsDesNiveaux = ({
  niveaux,
  dimensionParReferentiel,
}: {
  niveaux: ReadonlyArray<{ id: string }>
  dimensionParReferentiel: ReadonlyMap<string, string>
}): string[] => {
  const dimensions: string[] = []
  for (const niveau of niveaux) {
    const dimension = dimensionParReferentiel.get(niveau.id)
    if (dimension && !dimensions.includes(dimension)) dimensions.push(dimension)
  }
  return dimensions
}

// `dimensionsConservees` : dimensions d'un indicateur déjà multi-dimension. Le
// PUT remplace les niveaux **par dimension** : retirer tous les niveaux d'une
// dimension du formulaire ne la retire pas côté API, elle reste donc configurée.
export const resoudreDimensionsIndicateur = ({
  niveaux,
  dimensionParReferentiel,
  configurations,
  dimensionsConservees,
}: {
  niveaux: ReadonlyArray<{ id: string }>
  dimensionParReferentiel: ReadonlyMap<string, string>
  configurations: ReadonlyArray<ConfigurationIndicateurDimension>
  dimensionsConservees: ReadonlyArray<string>
}): ConfigurationIndicateurDimension[] => {
  const actives = dimensionsDesNiveaux({ niveaux, dimensionParReferentiel })
  for (const dimension of dimensionsConservees) {
    if (!actives.includes(dimension)) actives.push(dimension)
  }
  if (actives.length < 2) return []

  const saisies = new Map(configurations.map((configuration) => [configuration.id, configuration]))
  const conservees = actives.flatMap((id) => {
    const saisie = saisies.get(id)
    return saisie ? [saisie] : []
  })
  const ordresPris = new Set(conservees.map((configuration) => configuration.ordre))
  let objectifsPortes = conservees.some((configuration) => configuration.porteObjectifs)

  const resolues = actives.map((id): ConfigurationIndicateurDimension => {
    const saisie = saisies.get(id)
    if (saisie) return saisie
    let ordre = 0
    while (ordresPris.has(ordre)) ordre += 1
    ordresPris.add(ordre)
    // Comme l'API : sans grain explicite, les objectifs sont portés par la
    // première dimension seulement.
    const porteObjectifs = !objectifsPortes
    objectifsPortes = true
    return { id, ordre, fonctionAgregation: 'SUM', porteObjectifs }
  })

  return resolues.sort((a, b) => a.ordre - b.ordre || a.id.localeCompare(b.id))
}

export const validerDimensionsIndicateur = (
  configurations: ReadonlyArray<ConfigurationIndicateurDimension>,
): string | null => {
  const ordres = configurations.map((configuration) => configuration.ordre)
  if (new Set(ordres).size !== ordres.length) {
    return 'Chaque dimension doit avoir un ordre distinct.'
  }
  return null
}

export const FONCTION_MARGINALE_LABEL: Record<FonctionAgregation, string> = {
  SUM: 'Somme',
  AVG: 'Moyenne',
  NONE: 'Aucune (marginale saisie)',
}
