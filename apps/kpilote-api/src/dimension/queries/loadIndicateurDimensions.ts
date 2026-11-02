import { db } from '@/framework/persistence/dbStore'
import { type FonctionAgregation } from '@/generated/prisma/enums'

export type NiveauIndicateur = {
  referentielId: string
  publicId: string
  fonctionAgregation: FonctionAgregation
}

export type DimensionIndicateur = {
  dimensionId: string
  publicId: string
  nom: string
  ordre: number
  // Fonction de la marginale (racine virtuelle « tous » de la dimension).
  fonctionAgregation: FonctionAgregation
  porteObjectifs: boolean
  niveaux: NiveauIndicateur[]
}

// Dimensions d'un indicateur, triées par `ordre`. Elles se déduisent de ses
// niveaux (IndicateurReferentiel → referentiel.dimension) ; `indicateur_dimension`
// porte leur configuration. Une dimension sans ligne de configuration (donnée
// incohérente) reçoit les défauts documentés, en fin d'ordre.
export const loadIndicateurDimensions = async (
  indicateurId: string,
): Promise<DimensionIndicateur[]> => {
  const [liens, configurations] = await Promise.all([
    db().indicateurReferentiel.findMany({
      where: { indicateurId },
      include: { referentiel: { include: { dimension: true } } },
    }),
    db().indicateurDimension.findMany({ where: { indicateurId } }),
  ])
  const configurationParDimension = new Map(configurations.map((c) => [c.dimensionId, c]))
  const parDimension = new Map<string, DimensionIndicateur>()
  for (const lien of liens) {
    const { dimension } = lien.referentiel
    const configuration = configurationParDimension.get(dimension.id)
    const existante = parDimension.get(dimension.id) ?? {
      dimensionId: dimension.id,
      publicId: dimension.publicId,
      nom: dimension.nom,
      ordre: configuration?.ordre ?? Number.MAX_SAFE_INTEGER,
      fonctionAgregation: configuration?.fonctionAgregation ?? 'SUM',
      porteObjectifs: configuration?.porteObjectifs ?? false,
      niveaux: [],
    }
    existante.niveaux.push({
      referentielId: lien.referentielId,
      publicId: lien.referentiel.publicId,
      fonctionAgregation: lien.fonctionAgregation,
    })
    parDimension.set(dimension.id, existante)
  }
  return [...parDimension.values()]
    .map((dimension) => ({
      ...dimension,
      niveaux: dimension.niveaux.sort((a, b) => a.publicId.localeCompare(b.publicId)),
    }))
    .sort((a, b) => a.ordre - b.ordre || a.publicId.localeCompare(b.publicId))
}

// Sous-cube des objectifs : dimensions `porteObjectifs`. À défaut (aucune), la
// première dimension — un indicateur a toujours un grain d'objectif.
export const dimensionsObjectifs = (
  dimensions: ReadonlyArray<DimensionIndicateur>,
): DimensionIndicateur[] => {
  const portees = dimensions.filter((dimension) => dimension.porteObjectifs)
  if (portees.length > 0) return portees
  return dimensions.slice(0, 1)
}
