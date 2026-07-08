import {
  type ConfigurationIndicateurReferentiel,
  type UpsertIndicateurBody,
} from '@pilote/kpilot-shared/indicateur'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { ensurePrincipal, isApiKeyAdmin, isOidcUser } from '@/framework/auth/principalPredicates'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { ForbiddenError, ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { type FonctionAgregation, PermissionAction } from '@/generated/prisma/enums'

type ConfigurationResolue = {
  referentielId: string
  fonctionAgregation: FonctionAgregation
}

const dedupeConfigurations = (
  configurations: ReadonlyArray<ConfigurationIndicateurReferentiel>,
): Map<string, FonctionAgregation> => {
  const parPublicId = new Map<string, FonctionAgregation>()
  for (const configuration of configurations) {
    parPublicId.set(configuration.id, configuration.fonctionAgregation)
  }
  return parPublicId
}

const resoudreConfigurationsReferentiels = async (
  configurations: ReadonlyArray<ConfigurationIndicateurReferentiel>,
): Promise<ConfigurationResolue[]> => {
  const fonctionParPublicId = dedupeConfigurations(configurations)
  const publicIds = [...fonctionParPublicId.keys()]
  if (publicIds.length === 0) return []

  const referentiels = await db().referentiel.findMany({
    where: { publicId: { in: publicIds } },
  })
  const publicIdsTrouves = new Set(referentiels.map((referentiel) => referentiel.publicId))
  const publicIdsInconnus = publicIds.filter((id) => !publicIdsTrouves.has(id))
  if (publicIdsInconnus.length > 0) {
    throw new ValidationError('Référentiels inconnus', {
      unknownReferentielIds: publicIdsInconnus.sort(),
    })
  }
  return referentiels.map((referentiel) => ({
    referentielId: referentiel.id,
    fonctionAgregation: fonctionParPublicId.get(referentiel.publicId)!,
  }))
}

const supprimerConfigurationsRetirees = async (
  indicateurId: string,
  referentielIdsCibles: Set<string>,
): Promise<void> => {
  const existantes = await db().indicateurReferentiel.findMany({ where: { indicateurId } })
  const aSupprimer = existantes
    .filter((configuration) => !referentielIdsCibles.has(configuration.referentielId))
    .map((configuration) => configuration.referentielId)
  if (aSupprimer.length === 0) return
  await db().indicateurReferentiel.deleteMany({
    where: { indicateurId, referentielId: { in: aSupprimer } },
  })
}

const upsertConfigurationsCibles = async (
  indicateurId: string,
  configurations: ConfigurationResolue[],
): Promise<void> => {
  for (const configuration of configurations) {
    await db().indicateurReferentiel.upsert({
      where: {
        indicateurId_referentielId: {
          indicateurId,
          referentielId: configuration.referentielId,
        },
      },
      update: { fonctionAgregation: configuration.fonctionAgregation },
      create: {
        indicateurId,
        referentielId: configuration.referentielId,
        fonctionAgregation: configuration.fonctionAgregation,
      },
    })
  }
}

const remplacerConfigurationsReferentiels = async (
  indicateurId: string,
  configurations: ConfigurationResolue[],
): Promise<void> => {
  const referentielIdsCibles = new Set(
    configurations.map((configuration) => configuration.referentielId),
  )
  await supprimerConfigurationsRetirees(indicateurId, referentielIdsCibles)
  await upsertConfigurationsCibles(indicateurId, configurations)
}

const assertWritePermission = async (indicateurId: string, principalId: string): Promise<void> => {
  const hasWrite = await db().indicateurPermission.findUnique({
    where: {
      principalId_indicateurId_action: {
        principalId,
        indicateurId,
        action: PermissionAction.WRITE,
      },
    },
  })
  if (!hasWrite) {
    throw new ForbiddenError("Vous n'avez pas la permission de modifier cet indicateur")
  }
}

// Les champs métadonnées sont optionnels dans le body : une clé absente signifie
// « ne pas toucher » (sémantique PATCH-like), `null` signifie « effacer ».
const metadonneesData = (body: UpsertIndicateurBody) => ({
  ...(body.description !== undefined && { description: body.description }),
  ...(body.methodeCalcul !== undefined && { methodeCalcul: body.methodeCalcul }),
  ...(body.sourceDonnees !== undefined && { sourceDonnees: body.sourceDonnees }),
  ...(body.sourceUrl !== undefined && { sourceUrl: body.sourceUrl }),
  ...(body.periodeMiseAJour !== undefined && { periodeMiseAJour: body.periodeMiseAJour }),
  ...(body.jourMiseAJour !== undefined && { jourMiseAJour: body.jourMiseAJour }),
})

const updateIndicateurExistant = async (
  publicId: string,
  indicateurId: string,
  body: UpsertIndicateurBody,
  principalId: string,
): Promise<void> => {
  await assertWritePermission(indicateurId, principalId)
  const configurations = await resoudreConfigurationsReferentiels(body.referentiels)
  await db().indicateur.update({
    where: { publicId },
    data: {
      nom: body.nom,
      visibilite: body.visibilite,
      unite: body.unite,
      ...metadonneesData(body),
    },
  })
  await remplacerConfigurationsReferentiels(indicateurId, configurations)
}

const grantOwnerPermissions = async (principalId: string, indicateurId: string): Promise<void> => {
  await db().indicateurPermission.createMany({
    data: [
      { principalId, indicateurId, action: PermissionAction.READ },
      { principalId, indicateurId, action: PermissionAction.WRITE },
    ],
  })
}

const createIndicateurAvecGrants = async (
  publicId: string,
  body: UpsertIndicateurBody,
  principalId: string,
): Promise<void> => {
  const configurations = await resoudreConfigurationsReferentiels(body.referentiels)
  const indicateurId = uuidv7()
  await db().indicateur.create({
    data: {
      id: indicateurId,
      publicId,
      nom: body.nom,
      visibilite: body.visibilite,
      unite: body.unite,
      ...metadonneesData(body),
    },
  })
  await grantOwnerPermissions(principalId, indicateurId)
  if (configurations.length > 0) {
    await db().indicateurReferentiel.createMany({
      data: configurations.map((configuration) => ({
        indicateurId,
        referentielId: configuration.referentielId,
        fonctionAgregation: configuration.fonctionAgregation,
      })),
    })
  }
}

const performUpsert = async (publicId: string, body: UpsertIndicateurBody): Promise<void> => {
  ensurePrincipal(
    (principal) => isApiKeyAdmin(principal) || isOidcUser(principal),
    'Cette opération requiert un utilisateur OIDC ou une clé API de rôle ADMIN',
  )
  const principalId = requireCurrentPrincipalId()
  const existant = await db().indicateur.findUnique({ where: { publicId } })
  if (existant) {
    await updateIndicateurExistant(publicId, existant.id, body, principalId)
    return
  }
  await createIndicateurAvecGrants(publicId, body, principalId)
}

export const upsertIndicateur = (
  publicId: string,
  body: UpsertIndicateurBody,
): ResultAsync<void, never> => ResultAsync.fromSafePromise(performUpsert(publicId, body))
