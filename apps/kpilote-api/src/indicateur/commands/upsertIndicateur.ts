import { type UpsertIndicateurBody } from '@pilote/kpilote-shared/indicateur'
import { err, ok, type Result, ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { ensureAdminOrOidcUser } from '@/framework/auth/principalPredicates'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { diff } from '@/framework/collections/diff'
import { findUnknown } from '@/framework/collections/findUnknown'
import { db } from '@/framework/persistence/dbStore'
import {
  type FonctionAgregation,
  type FonctionAgregationAxe,
  IndicateurPermissionAction,
} from '@/generated/prisma/enums'
import { ensureIndicateurWriteDataPermission } from '@/indicateur/permissions'
import { type AxesVerrouillesError, checkAxesModifiables } from '@/indicateur/rules'

export type UpsertIndicateurError =
  | { type: 'REFERENTIELS_INCONNUS'; referentiels: string[] }
  | { type: 'UTILISATEURS_INCONNUS'; utilisateurs: string[] }
  | { type: 'AXES_INCONNUS'; axes: string[] }
  | AxesVerrouillesError

type UpsertIndicateurContext = {
  // Une entrée par référentiel du body (le dernier l'emporte en cas de doublon).
  fonctionByReferentielPublicId: Map<string, FonctionAgregation>
  referentielIdByPublicId: Map<string, string>
  utilisateurIdsTrouves: string[]
  axeIdByPublicId: Map<string, string>
  referentielIdsActuels: string[]
  responsableIdsActuels: string[]
  axeIdsActuels: string[]
  nombreValeurs: number
}

const loadUpsertIndicateurContext = async ({
  indicateurId,
  body,
}: {
  // null : l'indicateur n'existe pas encore.
  indicateurId: string | null
  body: UpsertIndicateurBody
}): Promise<UpsertIndicateurContext> => {
  const fonctionByReferentielPublicId = new Map(
    body.referentiels.map((configuration) => [configuration.id, configuration.fonctionAgregation]),
  )
  const referentiels = await db().referentiel.findMany({
    where: { publicId: { in: [...fonctionByReferentielPublicId.keys()] } },
  })
  const utilisateurs = await db().utilisateur.findMany({
    where: { id: { in: body.responsables ?? [] } },
  })
  const axes = await db().axe.findMany({
    where: { publicId: { in: body.axes?.map((declaration) => declaration.id) ?? [] } },
  })
  const context = {
    fonctionByReferentielPublicId,
    referentielIdByPublicId: new Map(
      referentiels.map((referentiel) => [referentiel.publicId, referentiel.id]),
    ),
    utilisateurIdsTrouves: utilisateurs.map((utilisateur) => utilisateur.id),
    axeIdByPublicId: new Map(axes.map((axe) => [axe.publicId, axe.id])),
  }
  if (indicateurId === null) {
    return {
      ...context,
      referentielIdsActuels: [],
      responsableIdsActuels: [],
      axeIdsActuels: [],
      nombreValeurs: 0,
    }
  }

  const liensReferentiels = await db().indicateurReferentiel.findMany({ where: { indicateurId } })
  const responsables = await db().indicateurResponsable.findMany({ where: { indicateurId } })
  const declarations = await db().indicateurAxe.findMany({ where: { indicateurId } })
  const nombreValeurs = await db().valeurAvancement.count({ where: { indicateurId } })
  return {
    ...context,
    referentielIdsActuels: liensReferentiels.map((lien) => lien.referentielId),
    responsableIdsActuels: responsables.map((responsable) => responsable.utilisateurId),
    axeIdsActuels: declarations.map((declaration) => declaration.axeId),
    nombreValeurs,
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

const grantOwnerPermissions = async ({
  principalId,
  indicateurId,
}: {
  principalId: string
  indicateurId: string
}): Promise<void> => {
  await db().indicateurPermission.createMany({
    data: [
      { principalId, indicateurId, action: IndicateurPermissionAction.READ },
      { principalId, indicateurId, action: IndicateurPermissionAction.WRITE_DATA },
      { principalId, indicateurId, action: IndicateurPermissionAction.WRITE_COMMENT },
    ],
  })
}

// Les référentiels sont toujours remplacés ; un référentiel conservé voit sa
// fonction d'agrégation mise à jour.
const replaceReferentiels = async ({
  indicateurId,
  context,
}: {
  indicateurId: string
  context: UpsertIndicateurContext
}): Promise<void> => {
  const cibles = [...context.fonctionByReferentielPublicId].map(
    ([publicId, fonctionAgregation]) => ({
      referentielId: context.referentielIdByPublicId.get(publicId)!,
      fonctionAgregation,
    }),
  )
  const { toRemove } = diff(
    cibles.map((cible) => cible.referentielId),
    context.referentielIdsActuels,
  )
  if (toRemove.length > 0) {
    await db().indicateurReferentiel.deleteMany({
      where: { indicateurId, referentielId: { in: toRemove } },
    })
  }
  for (const { referentielId, fonctionAgregation } of cibles) {
    await db().indicateurReferentiel.upsert({
      where: { indicateurId_referentielId: { indicateurId, referentielId } },
      update: { fonctionAgregation },
      create: { indicateurId, referentielId, fonctionAgregation },
    })
  }
}

const replaceResponsables = async ({
  indicateurId,
  utilisateurIds,
  responsableIdsActuels,
}: {
  indicateurId: string
  utilisateurIds: ReadonlyArray<string>
  responsableIdsActuels: ReadonlyArray<string>
}): Promise<void> => {
  const { toAdd, toRemove } = diff([...new Set(utilisateurIds)], responsableIdsActuels)
  if (toRemove.length > 0) {
    await db().indicateurResponsable.deleteMany({
      where: { indicateurId, utilisateurId: { in: toRemove } },
    })
  }
  if (toAdd.length > 0) {
    await db().indicateurResponsable.createMany({
      data: toAdd.map((utilisateurId) => ({ indicateurId, utilisateurId })),
    })
  }
}

// Remplace la déclaration complète ; l'ordre de déclaration suit la position
// dans le tableau (à partir de 1). Suppression puis recréation : réordonner en
// place heurterait UNIQUE(indicateur, ordre).
const replaceAxes = async ({
  indicateurId,
  declarations,
}: {
  indicateurId: string
  declarations: ReadonlyArray<{ axeId: string; fonction: FonctionAgregationAxe }>
}): Promise<void> => {
  await db().indicateurAxe.deleteMany({ where: { indicateurId } })
  if (declarations.length === 0) return
  await db().indicateurAxe.createMany({
    data: declarations.map((declaration, index) => ({
      indicateurId,
      axeId: declaration.axeId,
      ordre: index + 1,
      fonction: declaration.fonction,
    })),
  })
}

const performUpsert = async (
  publicId: string,
  body: UpsertIndicateurBody,
): Promise<Result<void, UpsertIndicateurError>> => {
  ensureAdminOrOidcUser()
  const principalId = requireCurrentPrincipalId()

  const existant = await db().indicateur.findUnique({ where: { publicId } })
  if (existant)
    await ensureIndicateurWriteDataPermission({ indicateurId: existant.id, principalId })

  const context = await loadUpsertIndicateurContext({ indicateurId: existant?.id ?? null, body })

  const referentielsInconnus = findUnknown({
    requested: [...context.fonctionByReferentielPublicId.keys()],
    found: [...context.referentielIdByPublicId.keys()],
  })
  if (referentielsInconnus.length > 0) {
    return err({ type: 'REFERENTIELS_INCONNUS', referentiels: referentielsInconnus })
  }
  const utilisateursInconnus = findUnknown({
    requested: body.responsables ?? [],
    found: context.utilisateurIdsTrouves,
  })
  if (utilisateursInconnus.length > 0) {
    return err({ type: 'UTILISATEURS_INCONNUS', utilisateurs: utilisateursInconnus })
  }
  const axesInconnus = findUnknown({
    requested: body.axes?.map((declaration) => declaration.id) ?? [],
    found: [...context.axeIdByPublicId.keys()],
  })
  if (axesInconnus.length > 0) return err({ type: 'AXES_INCONNUS', axes: axesInconnus })

  const declarations = body.axes?.map((declaration) => ({
    axeId: context.axeIdByPublicId.get(declaration.id)!,
    fonction: declaration.fonction,
  }))

  if (declarations !== undefined) {
    const axesModifiables = checkAxesModifiables({
      axeIdsActuels: context.axeIdsActuels,
      axeIdsCibles: declarations.map((declaration) => declaration.axeId),
      nombreValeurs: context.nombreValeurs,
    })
    if (axesModifiables.isErr()) return err(axesModifiables.error)
  }

  const champs = {
    nom: body.nom,
    visibilite: body.visibilite,
    unite: body.unite,
    sensSouhaite: body.sensSouhaite,
    ...metadonneesData(body),
  }
  const indicateur = await db().indicateur.upsert({
    where: { publicId },
    update: champs,
    create: { id: uuidv7(), publicId, ...champs },
  })
  if (!existant) await grantOwnerPermissions({ principalId, indicateurId: indicateur.id })

  await replaceReferentiels({ indicateurId: indicateur.id, context })
  if (body.responsables !== undefined) {
    await replaceResponsables({
      indicateurId: indicateur.id,
      utilisateurIds: body.responsables,
      responsableIdsActuels: context.responsableIdsActuels,
    })
  }
  if (declarations !== undefined) {
    await replaceAxes({ indicateurId: indicateur.id, declarations })
  }
  return ok()
}

export const upsertIndicateur = (
  publicId: string,
  body: UpsertIndicateurBody,
): ResultAsync<void, UpsertIndicateurError> => new ResultAsync(performUpsert(publicId, body))
