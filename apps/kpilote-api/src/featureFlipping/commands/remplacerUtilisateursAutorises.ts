import {
  type FeatureFlippingDetailApiModel,
  type RemplacerUtilisateursAutorisesBody,
} from '@pilote/kpilote-shared/featureFlipping'
import { ResultAsync } from 'neverthrow'

import { featureFlippingInclude, toFeatureFlippingDetailApiModel } from '@/featureFlipping/utils'
import { ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'

// findUniqueOrThrow lève Prisma P2025 (→ 404) si le FF n'existe pas.
const ensureFeatureFlippingExiste = async (id: string): Promise<void> => {
  await db().featureFlipping.findUniqueOrThrow({ where: { id }, select: { id: true } })
}

const resoudreUtilisateurs = async (utilisateurIds: ReadonlyArray<string>): Promise<string[]> => {
  const idsUniques = [...new Set(utilisateurIds)]
  if (idsUniques.length === 0) return []
  const utilisateurs = await db().utilisateur.findMany({ where: { id: { in: idsUniques } } })
  const idsTrouves = new Set(utilisateurs.map((utilisateur) => utilisateur.id))
  const idsInconnus = idsUniques.filter((id) => !idsTrouves.has(id))
  if (idsInconnus.length > 0) {
    throw new ValidationError('Utilisateurs inconnus', {
      unknownUtilisateurIds: idsInconnus.sort(),
    })
  }
  return idsUniques
}

const remplacerLiaisons = async (
  featureFlippingId: string,
  utilisateurIdsCibles: string[],
): Promise<void> => {
  const cibles = new Set(utilisateurIdsCibles)
  const existantes = await db().featureFlippingUtilisateur.findMany({ where: { featureFlippingId } })
  const aSupprimer = existantes
    .filter((liaison) => !cibles.has(liaison.utilisateurId))
    .map((liaison) => liaison.utilisateurId)
  if (aSupprimer.length > 0) {
    await db().featureFlippingUtilisateur.deleteMany({
      where: { featureFlippingId, utilisateurId: { in: aSupprimer } },
    })
  }
  for (const utilisateurId of utilisateurIdsCibles) {
    await db().featureFlippingUtilisateur.upsert({
      where: { featureFlippingId_utilisateurId: { featureFlippingId, utilisateurId } },
      update: {},
      create: { featureFlippingId, utilisateurId },
    })
  }
}

export const remplacerUtilisateursAutorises = (
  id: string,
  body: RemplacerUtilisateursAutorisesBody,
): ResultAsync<FeatureFlippingDetailApiModel, never> =>
  ResultAsync.fromSafePromise(
    ensureFeatureFlippingExiste(id)
      .then(() => resoudreUtilisateurs(body.utilisateurIds))
      .then((utilisateurIds) => remplacerLiaisons(id, utilisateurIds))
      .then(() =>
        db().featureFlipping.findUniqueOrThrow({ where: { id }, include: featureFlippingInclude }),
      ),
  ).map(toFeatureFlippingDetailApiModel)
