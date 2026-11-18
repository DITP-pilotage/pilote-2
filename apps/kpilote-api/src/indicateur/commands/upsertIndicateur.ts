import {
  type ConfigurationIndicateurReferentiel,
  type DeclarationAxeIndicateur,
  type UpsertIndicateurBody,
} from '@pilote/kpilote-shared/indicateur'
import { err, ok, type Result, ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { ensurePrincipal, isApiKeyAdmin, isOidcUser } from '@/framework/auth/principalPredicates'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import {
  type FonctionAgregation,
  type FonctionAgregationAxe,
  IndicateurPermissionAction,
} from '@/generated/prisma/enums'

export type UpsertIndicateurError =
  | { type: 'REFERENTIELS_INCONNUS'; referentiels: string[] }
  | { type: 'UTILISATEURS_INCONNUS'; utilisateurs: string[] }
  | { type: 'AXES_INCONNUS'; axes: string[] }
  | { type: 'AXES_VERROUILLES'; nombreValeurs: number }

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
): Promise<{ resolues: ConfigurationResolue[]; inconnus: string[] }> => {
  const fonctionParPublicId = dedupeConfigurations(configurations)
  const publicIds = [...fonctionParPublicId.keys()]
  if (publicIds.length === 0) return { resolues: [], inconnus: [] }

  const referentiels = await db().referentiel.findMany({
    where: { publicId: { in: publicIds } },
  })
  const publicIdsTrouves = new Set(referentiels.map((referentiel) => referentiel.publicId))
  return {
    resolues: referentiels.map((referentiel) => ({
      referentielId: referentiel.id,
      fonctionAgregation: fonctionParPublicId.get(referentiel.publicId)!,
    })),
    inconnus: publicIds.filter((id) => !publicIdsTrouves.has(id)).sort(),
  }
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

const resoudreResponsables = async (
  utilisateurIds: ReadonlyArray<string>,
): Promise<{ resolus: string[]; inconnus: string[] }> => {
  const idsUniques = [...new Set(utilisateurIds)]
  if (idsUniques.length === 0) return { resolus: [], inconnus: [] }
  const utilisateurs = await db().utilisateur.findMany({ where: { id: { in: idsUniques } } })
  const idsTrouves = new Set(utilisateurs.map((utilisateur) => utilisateur.id))
  return { resolus: idsUniques, inconnus: idsUniques.filter((id) => !idsTrouves.has(id)).sort() }
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

type DeclarationAxeResolue = { axeId: string; fonction: FonctionAgregationAxe }

const resoudreAxes = async (
  declarations: ReadonlyArray<DeclarationAxeIndicateur>,
): Promise<{ resolues: DeclarationAxeResolue[]; inconnus: string[] }> => {
  if (declarations.length === 0) return { resolues: [], inconnus: [] }
  const axes = await db().axe.findMany({
    where: { publicId: { in: declarations.map((declaration) => declaration.id) } },
  })
  const axeIdParPublicId = new Map(axes.map((axe) => [axe.publicId, axe.id]))
  const inconnus = declarations.map((d) => d.id).filter((id) => !axeIdParPublicId.has(id))
  if (inconnus.length > 0) return { resolues: [], inconnus: inconnus.sort() }
  return {
    resolues: declarations.map((declaration) => ({
      axeId: axeIdParPublicId.get(declaration.id)!,
      fonction: declaration.fonction,
    })),
    inconnus: [],
  }
}

// Ajouter ou retirer un axe est refusé dès que l'indicateur a des valeurs : une
// valeur est précisée par une modalité de chaque axe déclaré. Les valeurs déjà
// saisies ne portent pas de modalité pour un axe ajouté, et en portent une pour
// un axe retiré : elles deviendraient incohérentes avec la déclaration.
// Changer la fonction ou l'ordre ne touche pas aux valeurs, seulement au calcul
// des totaux : c'est permis. Renvoie le nombre de valeurs qui bloquent le
// changement (0 s'il est permis).
const countValeursBloquantAxes = async (
  indicateurId: string,
  declarations: DeclarationAxeResolue[],
): Promise<number> => {
  const existantes = await db().indicateurAxe.findMany({ where: { indicateurId } })
  const avant = new Set(existantes.map((declaration) => declaration.axeId))
  const apres = new Set(declarations.map((declaration) => declaration.axeId))
  const axesChangent = avant.size !== apres.size || [...apres].some((axeId) => !avant.has(axeId))
  if (!axesChangent) return 0
  return db().valeurAvancement.count({ where: { indicateurId } })
}

// Remplace la déclaration complète ; l'ordre de déclaration suit la position
// dans le tableau (à partir de 1).
const remplacerAxes = async (
  indicateurId: string,
  declarations: DeclarationAxeResolue[],
): Promise<void> => {
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

type References = {
  configurations: ConfigurationResolue[]
  responsablesCibles: string[] | undefined
  axesCibles: DeclarationAxeResolue[] | undefined
}

// Résout les références du body (référentiels, responsables, axes) ; la première
// liste qui contient un inconnu fait échouer l'upsert.
const resolveReferences = async (
  body: UpsertIndicateurBody,
): Promise<Result<References, UpsertIndicateurError>> => {
  const referentiels = await resoudreConfigurationsReferentiels(body.referentiels)
  if (referentiels.inconnus.length > 0) {
    return err({ type: 'REFERENTIELS_INCONNUS', referentiels: referentiels.inconnus })
  }
  const responsables =
    body.responsables === undefined ? undefined : await resoudreResponsables(body.responsables)
  if (responsables && responsables.inconnus.length > 0) {
    return err({ type: 'UTILISATEURS_INCONNUS', utilisateurs: responsables.inconnus })
  }
  const axes = body.axes === undefined ? undefined : await resoudreAxes(body.axes)
  if (axes && axes.inconnus.length > 0) return err({ type: 'AXES_INCONNUS', axes: axes.inconnus })
  return ok({
    configurations: referentiels.resolues,
    responsablesCibles: responsables?.resolus,
    axesCibles: axes?.resolues,
  })
}

const updateIndicateurExistant = async (
  publicId: string,
  indicateurId: string,
  body: UpsertIndicateurBody,
  principalId: string,
): Promise<Result<void, UpsertIndicateurError>> => {
  await assertWritePermission(indicateurId, principalId)
  const references = await resolveReferences(body)
  if (references.isErr()) return err(references.error)
  const { configurations, responsablesCibles, axesCibles } = references.value
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
    const nombreValeurs = await countValeursBloquantAxes(indicateurId, axesCibles)
    // Après les écritures ci-dessus : l'`err` annule la transaction.
    if (nombreValeurs > 0) return err({ type: 'AXES_VERROUILLES', nombreValeurs })
    await remplacerAxes(indicateurId, axesCibles)
  }
  return ok()
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
): Promise<Result<void, UpsertIndicateurError>> => {
  const references = await resolveReferences(body)
  if (references.isErr()) return err(references.error)
  const { configurations, responsablesCibles, axesCibles } = references.value
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
  return ok()
}

const performUpsert = async (
  publicId: string,
  body: UpsertIndicateurBody,
): Promise<Result<void, UpsertIndicateurError>> => {
  ensurePrincipal(
    (principal) => isApiKeyAdmin(principal) || isOidcUser(principal),
    'Cette opération requiert un utilisateur OIDC ou une clé API de rôle ADMIN',
  )
  const principalId = requireCurrentPrincipalId()
  const existant = await db().indicateur.findUnique({ where: { publicId } })
  if (existant) return updateIndicateurExistant(publicId, existant.id, body, principalId)
  return createIndicateurAvecGrants(publicId, body, principalId)
}

export const upsertIndicateur = (
  publicId: string,
  body: UpsertIndicateurBody,
): ResultAsync<void, UpsertIndicateurError> => new ResultAsync(performUpsert(publicId, body))
