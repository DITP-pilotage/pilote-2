import {
  type PrincipalPermissionsApiModel,
  type ReplacePrincipalPermissionsBody,
} from '@pilote/kpilote-shared/permission'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { NotFoundError, ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { loadPrincipalPermissions } from '@/permission/queries/loadPrincipalPermissions'

type Entree = { publicId: string; actions: string[] }

const ensureAucunDoublon = (entrees: Entree[], libelle: string): void => {
  const publicIds = entrees.map((entree) => entree.publicId)
  if (new Set(publicIds).size !== publicIds.length)
    throw new ValidationError(`Le payload contient plusieurs fois la même ${libelle}`)
}

const indexerParPublicId = (
  entrees: Entree[],
  lignes: { id: string; publicId: string }[],
  libelle: string,
): Map<string, string> => {
  const connus = new Map(lignes.map((ligne) => [ligne.publicId, ligne.id]))
  const manquants = entrees
    .map((entree) => entree.publicId)
    .filter((publicId) => !connus.has(publicId))
  if (manquants.length > 0)
    throw new NotFoundError(`${libelle} introuvable(s) : ${manquants.join(', ')}`)
  return connus
}

const performReplace = async (
  body: ReplacePrincipalPermissionsBody,
): Promise<PrincipalPermissionsApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  await db().principal.findUniqueOrThrow({ where: { id: body.principalId } })

  // Toute la validation avant la moindre écriture : un payload invalide laisse
  // l'état existant intact, sans dépendre du rollback de la transaction.
  ensureAucunDoublon(body.indicateurs, 'indicateur')
  ensureAucunDoublon(body.collections, 'collection')

  const [lignesIndicateur, lignesCollection] = await Promise.all([
    db().indicateur.findMany({
      where: { publicId: { in: body.indicateurs.map((entree) => entree.publicId) } },
      select: { id: true, publicId: true },
    }),
    db().collection.findMany({
      where: { publicId: { in: body.collections.map((entree) => entree.publicId) } },
      select: { id: true, publicId: true },
    }),
  ])

  const idsIndicateur = indexerParPublicId(body.indicateurs, lignesIndicateur, 'Indicateur')
  const idsCollection = indexerParPublicId(body.collections, lignesCollection, 'Collection')

  // Différentiel côté indicateurs : une permission conservée garde sa
  // restriction et son périmètre (cloisonnement) ; seules les permissions
  // retirées sont supprimées (leur périmètre part avec elles, FK en cascade).
  const ciblesIndicateur = new Set(
    body.indicateurs.flatMap((entree) =>
      entree.actions.map((action) => `${idsIndicateur.get(entree.publicId)!}|${action}`),
    ),
  )
  const existantes = await db().indicateurPermission.findMany({
    where: { principalId: body.principalId },
    select: { indicateurId: true, action: true },
  })
  for (const existante of existantes) {
    if (ciblesIndicateur.has(`${existante.indicateurId}|${existante.action}`)) continue
    await db().indicateurPermission.delete({
      where: { principalId_indicateurId_action: { principalId: body.principalId, ...existante } },
    })
  }
  await db().collectionPermission.deleteMany({ where: { principalId: body.principalId } })

  await db().indicateurPermission.createMany({
    data: body.indicateurs.flatMap((entree) =>
      entree.actions.map((action) => ({
        principalId: body.principalId,
        indicateurId: idsIndicateur.get(entree.publicId)!,
        action,
      })),
    ),
    skipDuplicates: true,
  })
  await db().collectionPermission.createMany({
    data: body.collections.flatMap((entree) =>
      entree.actions.map((action) => ({
        principalId: body.principalId,
        collectionId: idsCollection.get(entree.publicId)!,
        action,
      })),
    ),
    skipDuplicates: true,
  })

  return loadPrincipalPermissions(body.principalId)
}

export const replacePrincipalPermissions = (
  body: ReplacePrincipalPermissionsBody,
): ResultAsync<PrincipalPermissionsApiModel, never> =>
  ResultAsync.fromSafePromise(performReplace(body))
