import {
  type ConfigurationIndicateurReferentiel,
  type DeclarationAxeIndicateur,
  type UpsertIndicateurBody,
} from '@pilote/kpilote-shared/indicateur'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { ensurePrincipal, isApiKeyAdmin, isOidcUser } from '@/framework/auth/principalPredicates'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { AppError, ForbiddenError, ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import {
  type FonctionAgregation,
  type FonctionAgregationAxe,
  IndicateurPermissionAction,
} from '@/generated/prisma/enums'

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

const resoudreResponsables = async (utilisateurIds: ReadonlyArray<string>): Promise<string[]> => {
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

const remplacerResponsables = async (
  indicateurId: string,
  utilisateurIdsCibles: string[],
): Promise<void> => {
  const cibles = new Set(utilisateurIdsCibles)
  const existantes = await db().indicateurResponsable.findMany({ where: { indicateurId } })
  const aSupprimer = existantes
    .filter((liaison) => !cibles.has(liaison.utilisateurId))
    .map((liaison) => liaison.utilisateurId)
  if (aSupprimer.length > 0) {
    await db().indicateurResponsable.deleteMany({
      where: { indicateurId, utilisateurId: { in: aSupprimer } },
    })
  }
  for (const utilisateurId of utilisateurIdsCibles) {
    await db().indicateurResponsable.upsert({
      where: { indicateurId_utilisateurId: { indicateurId, utilisateurId } },
      update: {},
      create: { indicateurId, utilisateurId },
    })
  }
}

// --- Axes ----------------------------------------------------------------------

export class AxesVerrouillesError extends AppError {
  readonly code = 'AXES_VERROUILLES'
  readonly kind = 'conflict' as const
}

type DeclarationAxeResolue = { axeId: string; fonction: FonctionAgregationAxe }

const resoudreAxes = async (
  declarations: ReadonlyArray<DeclarationAxeIndicateur>,
): Promise<DeclarationAxeResolue[]> => {
  if (declarations.length === 0) return []
  const axes = await db().axe.findMany({
    where: { publicId: { in: declarations.map((declaration) => declaration.id) } },
  })
  const axeIdParPublicId = new Map(axes.map((axe) => [axe.publicId, axe.id]))
  const inconnus = declarations.map((d) => d.id).filter((id) => !axeIdParPublicId.has(id))
  if (inconnus.length > 0) {
    throw new ValidationError('Axes inconnus', { unknownAxeIds: inconnus.sort() })
  }
  return declarations.map((declaration) => ({
    axeId: axeIdParPublicId.get(declaration.id)!,
    fonction: declaration.fonction,
  }))
}

// Remplace la déclaration complète ; l'ordre de déclaration suit la position
// dans le tableau (à partir de 1).
//
// Ajouter ou retirer un axe est refusé dès que l'indicateur a des valeurs : une
// valeur est précisée par une modalité de chaque axe déclaré. Les valeurs déjà
// saisies ne portent pas de modalité pour un axe ajouté, et en portent une pour
// un axe retiré : elles deviendraient incohérentes avec la déclaration.
// Changer la fonction ou l'ordre ne touche pas aux valeurs, seulement au calcul
// des totaux : c'est permis.
const remplacerAxes = async (
  indicateurId: string,
  declarations: DeclarationAxeResolue[],
): Promise<void> => {
  const existantes = await db().indicateurAxe.findMany({ where: { indicateurId } })
  const avant = new Set(existantes.map((declaration) => declaration.axeId))
  const apres = new Set(declarations.map((declaration) => declaration.axeId))
  const axesChangent = avant.size !== apres.size || [...apres].some((axeId) => !avant.has(axeId))
  if (axesChangent) {
    const nombreValeurs = await db().valeurAvancement.count({ where: { indicateurId } })
    if (nombreValeurs > 0) {
      throw new AxesVerrouillesError(
        'Cet indicateur a déjà des valeurs : on ne peut plus lui ajouter ni lui retirer d’axe. Changer la fonction ou l’ordre des axes reste possible.',
        { nombreValeurs },
      )
    }
  }
  // Suppression puis recréation : réordonner en place heurterait UNIQUE(indicateur, ordre).
  await db().indicateurAxe.deleteMany({ where: { indicateurId } })
  if (declarations.length > 0) {
    await db().indicateurAxe.createMany({
      data: declarations.map((declaration, index) => ({
        indicateurId,
        axeId: declaration.axeId,
        ordre: index + 1,
        fonction: declaration.fonction,
      })),
    })
  }
}

const assertWritePermission = async (indicateurId: string, principalId: string): Promise<void> => {
  const hasWrite = await db().indicateurPermission.findUnique({
    where: {
      principalId_indicateurId_action: {
        principalId,
        indicateurId,
        action: IndicateurPermissionAction.WRITE_DATA,
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
  ...(body.delaiMiseADisposition !== undefined && {
    delaiMiseADispositionNombre: body.delaiMiseADisposition?.nombre ?? null,
    delaiMiseADispositionUnite: body.delaiMiseADisposition?.unite ?? null,
  }),
})

const updateIndicateurExistant = async (
  publicId: string,
  indicateurId: string,
  body: UpsertIndicateurBody,
  principalId: string,
): Promise<void> => {
  await assertWritePermission(indicateurId, principalId)
  const configurations = await resoudreConfigurationsReferentiels(body.referentiels)
  const responsablesCibles =
    body.responsables === undefined ? undefined : await resoudreResponsables(body.responsables)
  const axesCibles = body.axes === undefined ? undefined : await resoudreAxes(body.axes)
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
  if (responsablesCibles !== undefined) {
    await remplacerResponsables(indicateurId, responsablesCibles)
  }
  if (axesCibles !== undefined) {
    await remplacerAxes(indicateurId, axesCibles)
  }
}

const grantOwnerPermissions = async (principalId: string, indicateurId: string): Promise<void> => {
  await db().indicateurPermission.createMany({
    data: [
      { principalId, indicateurId, action: IndicateurPermissionAction.READ },
      { principalId, indicateurId, action: IndicateurPermissionAction.WRITE_DATA },
      { principalId, indicateurId, action: IndicateurPermissionAction.WRITE_COMMENT },
    ],
  })
}

const createIndicateurAvecGrants = async (
  publicId: string,
  body: UpsertIndicateurBody,
  principalId: string,
): Promise<void> => {
  const configurations = await resoudreConfigurationsReferentiels(body.referentiels)
  const responsablesCibles =
    body.responsables === undefined ? undefined : await resoudreResponsables(body.responsables)
  const axesCibles = body.axes === undefined ? undefined : await resoudreAxes(body.axes)
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
  if (responsablesCibles !== undefined) {
    await remplacerResponsables(indicateurId, responsablesCibles)
  }
  if (axesCibles !== undefined) {
    await remplacerAxes(indicateurId, axesCibles)
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
