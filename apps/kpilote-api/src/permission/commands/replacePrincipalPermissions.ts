import { type ReplacePrincipalPermissionsBody } from '@pilote/kpilote-shared/permission'
import { err, ok, type Result, ResultAsync } from 'neverthrow'

import { ensureAdmin } from '@/framework/auth/principalPredicates'
import { findUnknown } from '@/framework/collections/findUnknown'
import { NotFoundError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { checkSansDoublon, type DoublonsError } from '@/permission/rules'

export type ReplacePrincipalPermissionsError = DoublonsError

// Une ressource introuvable est une 404, comme une référence isolée.
const ensureRessourcesTrouvees = ({
  requested,
  lignes,
  libelle,
}: {
  requested: ReadonlyArray<string>
  lignes: ReadonlyArray<{ id: string; publicId: string }>
  libelle: string
}): Map<string, string> => {
  const inconnus = findUnknown({ requested, found: lignes.map((ligne) => ligne.publicId) })
  if (inconnus.length > 0)
    throw new NotFoundError(`${libelle} introuvable(s) : ${inconnus.join(', ')}`)
  return new Map(lignes.map((ligne) => [ligne.publicId, ligne.id]))
}

const performReplace = async (
  body: ReplacePrincipalPermissionsBody,
): Promise<Result<void, ReplacePrincipalPermissionsError>> => {
  ensureAdmin()
  await db().principal.findUniqueOrThrow({ where: { id: body.principalId } })

  const indicateurPublicIds = body.indicateurs.map((entree) => entree.publicId)
  const collectionPublicIds = body.collections.map((entree) => entree.publicId)

  // Toute la validation avant la moindre écriture : un payload invalide laisse
  // l'état existant intact, sans dépendre du rollback de la transaction.
  const indicateursSansDoublon = checkSansDoublon({
    ressource: 'indicateur',
    publicIds: indicateurPublicIds,
  })
  if (indicateursSansDoublon.isErr()) return err(indicateursSansDoublon.error)
  const collectionsSansDoublon = checkSansDoublon({
    ressource: 'collection',
    publicIds: collectionPublicIds,
  })
  if (collectionsSansDoublon.isErr()) return err(collectionsSansDoublon.error)

  const [lignesIndicateur, lignesCollection] = await Promise.all([
    db().indicateur.findMany({
      where: { publicId: { in: indicateurPublicIds } },
      select: { id: true, publicId: true },
    }),
    db().collection.findMany({
      where: { publicId: { in: collectionPublicIds } },
      select: { id: true, publicId: true },
    }),
  ])

  const idsIndicateur = ensureRessourcesTrouvees({
    requested: indicateurPublicIds,
    lignes: lignesIndicateur,
    libelle: 'Indicateur',
  })
  const idsCollection = ensureRessourcesTrouvees({
    requested: collectionPublicIds,
    lignes: lignesCollection,
    libelle: 'Collection',
  })

  await db().indicateurPermission.deleteMany({ where: { principalId: body.principalId } })
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

  return ok()
}

export const replacePrincipalPermissions = (
  body: ReplacePrincipalPermissionsBody,
): ResultAsync<void, ReplacePrincipalPermissionsError> => new ResultAsync(performReplace(body))
