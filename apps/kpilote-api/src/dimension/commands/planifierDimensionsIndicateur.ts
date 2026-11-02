import { type ConfigurationIndicateurDimension } from '@pilote/kpilote-shared/indicateur'

import { ConflictError, ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { type Prisma } from '@/generated/prisma/client'
import { type FonctionAgregation } from '@/generated/prisma/enums'

// Règles de `PUT /indicateurs/{id}` sur les niveaux et dimensions (cf.
// dimensions-design.md « Ce qu'un indicateur déclare ») :
// - indicateur mono-dimension (avant comme après) : remplacement complet
//   historique des niveaux, inchangé (format pilote-ppg) ;
// - indicateur multi-dimension : remplacement **par dimension** — les niveaux
//   des dimensions absentes du payload sont conservés ;
// - ajouter ou retirer une dimension est refusé si l'indicateur a des faits
//   (valeurs ou objectifs) : une migration explicite serait nécessaire ;
// - dès 2 dimensions, chaque dimension sans configuration doit être décrite
//   dans `dimensions[]` (ordre, fonction de la marginale, grain des objectifs) :
//   l'ordre n'est jamais déduit de l'ordre du payload ;
// - `porteObjectifs` n'est modifiable que si l'indicateur n'a aucun objectif.

export type NiveauDemande = {
  referentielId: string
  dimensionId: string
  fonctionAgregation: FonctionAgregation
}

type ConfigurationDimension = {
  dimensionId: string
  ordre: number
  fonctionAgregation: FonctionAgregation
  porteObjectifs: boolean
}

export type PlanDimensions = {
  niveaux: NiveauDemande[]
  configurations: ConfigurationDimension[]
}

export const planifierDimensionsIndicateur = async ({
  indicateurId,
  niveauxDemandes,
  dimensionsDemandees,
}: {
  // null à la création.
  indicateurId: string | null
  niveauxDemandes: ReadonlyArray<NiveauDemande>
  dimensionsDemandees: ReadonlyArray<ConfigurationIndicateurDimension> | undefined
}): Promise<PlanDimensions> => {
  const [existants, configurationsExistantes, nbValeurs, nbObjectifs] = indicateurId
    ? await Promise.all([
        db().indicateurReferentiel.findMany({
          where: { indicateurId },
          include: { referentiel: { select: { dimensionId: true } } },
        }),
        db().indicateurDimension.findMany({ where: { indicateurId } }),
        db().valeurAvancement.count({ where: { indicateurId } }),
        db().objectifIndicateurIndividu.count({ where: { indicateurId } }),
      ])
    : [[], [], 0, 0]
  const dimensionsAvant = new Set(existants.map((n) => n.referentiel.dimensionId))
  const dimensionsDemandeesNiveaux = new Set(niveauxDemandes.map((n) => n.dimensionId))

  const niveaux: NiveauDemande[] =
    dimensionsAvant.size <= 1
      ? [...niveauxDemandes]
      : [
          ...niveauxDemandes,
          ...existants
            .filter((n) => !dimensionsDemandeesNiveaux.has(n.referentiel.dimensionId))
            .map((n) => ({
              referentielId: n.referentielId,
              dimensionId: n.referentiel.dimensionId,
              fonctionAgregation: n.fonctionAgregation,
            })),
        ]
  const dimensionsApres = new Set(niveaux.map((n) => n.dimensionId))

  const aDesFaits = nbValeurs + nbObjectifs > 0
  const ajoutees = [...dimensionsApres].filter((d) => !dimensionsAvant.has(d))
  const retirees = [...dimensionsAvant].filter((d) => !dimensionsApres.has(d))
  const changementDeStructure =
    (dimensionsAvant.size > 1 || dimensionsApres.size > 1) &&
    (ajoutees.length > 0 || retirees.length > 0)
  if (indicateurId && aDesFaits && changementDeStructure) {
    throw new ConflictError(
      "Ajout ou retrait d'une dimension refusé : l'indicateur porte déjà des valeurs ou des objectifs " +
        '(une migration explicite des faits serait nécessaire).',
    )
  }

  const demandees = new Map<string, ConfigurationIndicateurDimension>()
  if (dimensionsDemandees && dimensionsDemandees.length > 0) {
    const dimensions = await db().dimension.findMany({
      where: { publicId: { in: dimensionsDemandees.map((d) => d.id) } },
      select: { id: true, publicId: true },
    })
    const idParPublicId = new Map(dimensions.map((d) => [d.publicId, d.id]))
    const inconnues = dimensionsDemandees.filter((d) => {
      const id = idParPublicId.get(d.id)
      return !id || !dimensionsApres.has(id)
    })
    if (inconnues.length > 0) {
      throw new ValidationError("Dimensions inconnues ou sans niveau déclaré sur l'indicateur", {
        unknownDimensionIds: inconnues.map((d) => d.id).sort(),
      })
    }
    for (const d of dimensionsDemandees) demandees.set(idParPublicId.get(d.id)!, d)
  }

  // Passage mono → multi : toutes les dimensions doivent être décrites
  // explicitement (la marginale de la dimension historique comprise).
  const passageEnMulti = dimensionsAvant.size <= 1 && dimensionsApres.size > 1
  const existantesParDimension = new Map(
    passageEnMulti ? [] : configurationsExistantes.map((c) => [c.dimensionId, c]),
  )
  const configurations: ConfigurationDimension[] = []
  const nonConfigurees: string[] = []
  for (const dimensionId of dimensionsApres) {
    const demandee = demandees.get(dimensionId)
    const existante = existantesParDimension.get(dimensionId)
    if (demandee) {
      if (existante && existante.porteObjectifs !== demandee.porteObjectifs && nbObjectifs > 0) {
        throw new ConflictError(
          "Changement du grain des objectifs refusé : l'indicateur porte déjà des objectifs.",
        )
      }
      configurations.push({
        dimensionId,
        ordre: demandee.ordre,
        fonctionAgregation: demandee.fonctionAgregation,
        porteObjectifs: demandee.porteObjectifs,
      })
    } else if (existante) {
      configurations.push(existante)
    } else if (dimensionsApres.size <= 1) {
      // Mono-dimension : configuration implicite (cas historique).
      configurations.push({
        dimensionId,
        ordre: 0,
        fonctionAgregation: 'SUM',
        porteObjectifs: true,
      })
    } else {
      nonConfigurees.push(dimensionId)
    }
  }
  if (nonConfigurees.length > 0) {
    const publicIds = await db().dimension.findMany({
      where: { id: { in: nonConfigurees } },
      select: { publicId: true },
    })
    throw new ValidationError(
      'Indicateur multi-dimension : configurer chaque nouvelle dimension dans `dimensions` (ordre, fonctionAgregation, porteObjectifs)',
      { dimensionsAConfigurer: publicIds.map((d) => d.publicId).sort() },
    )
  }
  if (new Set(configurations.map((c) => c.ordre)).size !== configurations.length) {
    throw new ValidationError('Les dimensions doivent avoir des `ordre` distincts', {})
  }
  if (indicateurId && aDesFaits && dimensionsApres.size > 1) {
    await verrouillerFeuillesAFaits({
      indicateurId,
      niveauxAvant: existants.map((n) => ({
        referentielId: n.referentielId,
        fonctionAgregation: n.fonctionAgregation,
      })),
      niveauxApres: niveaux,
      configurationsAvant: configurationsExistantes,
      configurationsApres: configurations,
    })
  }
  return { niveaux, configurations }
}

const compterFaits = async (indicateurId: string, cellule: Prisma.CelluleWhereInput) => {
  const where = { indicateurId, cellule }
  const [valeurs, objectifs] = await Promise.all([
    db().valeurAvancement.count({ where }),
    db().objectifIndicateurIndividu.count({ where }),
  ])
  return valeurs + objectifs
}

// Verrou « feuille à faits » (M1‴) : sur un indicateur multi-dimension, une
// modification de configuration ne doit jamais rendre agrégée — donc masquer —
// une cellule qui porte des faits. Refusé (409) : retirer un niveau à faits,
// passer un niveau à faits de NONE à SUM/AVG, passer une marginale de NONE à
// SUM/AVG alors que des faits sont saisis sur cette marginale.
const verrouillerFeuillesAFaits = async ({
  indicateurId,
  niveauxAvant,
  niveauxApres,
  configurationsAvant,
  configurationsApres,
}: {
  indicateurId: string
  niveauxAvant: ReadonlyArray<{ referentielId: string; fonctionAgregation: FonctionAgregation }>
  niveauxApres: ReadonlyArray<NiveauDemande>
  configurationsAvant: ReadonlyArray<ConfigurationDimension>
  configurationsApres: ReadonlyArray<ConfigurationDimension>
}): Promise<void> => {
  const apresParNiveau = new Map(niveauxApres.map((n) => [n.referentielId, n]))
  for (const avant of niveauxAvant) {
    const apres = apresParNiveau.get(avant.referentielId)
    const masque =
      !apres || (avant.fonctionAgregation === 'NONE' && apres.fonctionAgregation !== 'NONE')
    if (!masque) continue
    const faits = await compterFaits(indicateurId, {
      coordonnees: { some: { individu: { referentielId: avant.referentielId } } },
    })
    if (faits > 0) {
      throw new ConflictError(
        'Modification refusée : elle masquerait des faits saisis sur un niveau (retrait du niveau, ou passage de NONE à une agrégation).',
      )
    }
  }
  const apresParDimension = new Map(configurationsApres.map((c) => [c.dimensionId, c]))
  for (const avant of configurationsAvant) {
    const apres = apresParDimension.get(avant.dimensionId)
    if (!apres || avant.fonctionAgregation !== 'NONE' || apres.fonctionAgregation === 'NONE') {
      continue
    }
    const faits = await compterFaits(indicateurId, {
      coordonnees: { none: { dimensionId: avant.dimensionId } },
    })
    if (faits > 0) {
      throw new ConflictError(
        'Modification refusée : la marginale porte des faits saisis ; la passer de NONE à une agrégation les masquerait.',
      )
    }
  }
}

export const appliquerConfigurationsDimensions = async ({
  indicateurId,
  configurations,
}: {
  indicateurId: string
  configurations: ReadonlyArray<ConfigurationDimension>
}): Promise<void> => {
  // Remplacement complet : la table ne porte que de la configuration (aucun fait
  // ne la référence) ; supprimer puis recréer évite les conflits transitoires sur
  // l'unicité (indicateur, ordre).
  await db().indicateurDimension.deleteMany({ where: { indicateurId } })
  if (configurations.length === 0) return
  await db().indicateurDimension.createMany({
    data: configurations.map((c) => ({
      indicateurId,
      dimensionId: c.dimensionId,
      ordre: c.ordre,
      fonctionAgregation: c.fonctionAgregation,
      porteObjectifs: c.porteObjectifs,
    })),
  })
}
