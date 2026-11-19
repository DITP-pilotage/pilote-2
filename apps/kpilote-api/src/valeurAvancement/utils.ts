import {
  type ContributionApiModel,
  type IndividuAvecValeursApiModel,
  type ValeurAvancementApiModel,
  type ValeurSaisieApiModel,
} from '@pilote/kpilote-shared/valeurAvancement'

import { formatBucket } from '@/framework/bucket'
import { type ValeurAvancementModel } from '@/generated/prisma/models'
import { type IndividuWithReferentiel, toIndividuApiModel } from '@/individu/utils'
import { type PointInterne } from '@/valeurAvancement/resolveSerieNoeud'

export const toValeurAvancementApiModel = ({
  indicateurPublicId,
  individuPublicId,
  point,
}: {
  indicateurPublicId: string
  individuPublicId: string
  point: PointInterne
}): ValeurAvancementApiModel => {
  if (point.type === 'saisie') {
    return {
      indicateur: indicateurPublicId,
      individu: individuPublicId,
      date: formatBucket(point.bucket),
      valeur: point.valeur.toNumber(),
      type: 'saisie',
    }
  }
  const contributions: ContributionApiModel[] = point.contributions.map((contribution) => ({
    individu: contribution.individuPublicId,
    valeur: contribution.valeur === null ? null : contribution.valeur.toNumber(),
    date: contribution.dateOrigine === null ? null : formatBucket(contribution.dateOrigine),
    source: contribution.source,
    // Champ absent sans axe : la réponse des indicateurs sans axe ne change pas.
    ...(contribution.modalites.length > 0 ? { modalites: [...contribution.modalites] } : {}),
  }))
  return {
    indicateur: indicateurPublicId,
    individu: individuPublicId,
    date: formatBucket(point.bucket),
    valeur: point.valeur.toNumber(),
    type: 'derivee',
    fonctionAgregation: point.fonctionAgregation,
    contributions,
    couverture: point.couverture,
  }
}

export type ValeurAvancementWithRelations = ValeurAvancementModel & {
  indicateur: { publicId: string }
  individu: { publicId: string }
}

// `modalites` n'apparaît que pour un indicateur à axes.
export const toValeurSaisieApiModel = (
  valeur: ValeurAvancementWithRelations,
  { modalites }: { modalites: ReadonlyArray<string> } = { modalites: [] },
): ValeurSaisieApiModel => ({
  indicateur: valeur.indicateur.publicId,
  individu: valeur.individu.publicId,
  ...(modalites.length > 0 ? { modalites: [...modalites] } : {}),
  date: valeur.date,
  valeur: valeur.valeur.toNumber(),
  type: 'saisie',
})

export type IndividuAvecValeursRow = IndividuWithReferentiel & {
  valeurs: ValeurAvancementModel[]
  _count: { valeurs: number }
}

export const toIndividuAvecValeursApiModel = (
  row: IndividuAvecValeursRow,
): IndividuAvecValeursApiModel => {
  const derniere = row.valeurs[0]
  if (!derniere) {
    throw new Error(
      `Individu ${row.publicId} a un nombreValeurs > 0 mais aucune valeur dans le payload — incohérence interne.`,
    )
  }
  return {
    individu: toIndividuApiModel(row),
    derniereValeur: {
      date: derniere.date,
      valeur: derniere.valeur.toNumber(),
    },
    nombreValeurs: row._count.valeurs,
  }
}
