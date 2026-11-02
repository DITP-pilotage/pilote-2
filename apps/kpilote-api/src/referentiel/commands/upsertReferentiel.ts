import { type UpsertReferentielBody } from '@pilote/kpilote-shared/referentiel'
import { err, ok, type Result, ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { ensurePrincipal, isApiKeyAdmin, isOidcUser } from '@/framework/auth/principalPredicates'
import { ConflictError, ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'

export type UpsertReferentielError = {
  type: 'INDIVIDUS_ALREADY_ATTACHED'
  individuIds: string[]
}

const detectConflicts = async (
  referentielId: string | undefined,
  individuPublicIds: string[],
): Promise<string[]> => {
  if (individuPublicIds.length === 0) return []
  const conflicts = await db().individu.findMany({
    where: {
      publicId: { in: individuPublicIds },
      ...(referentielId ? { referentielId: { not: referentielId } } : {}),
    },
    select: { publicId: true },
    orderBy: { publicId: 'asc' },
  })
  return conflicts.map((row) => row.publicId)
}

// Changer la dimension d'un référentiel ne doit ni casser des cellules
// existantes, ni faire passer en silence un indicateur mono-dimension en multi
// (ses niveaux se répartiraient sur deux dimensions), ni couper une hiérarchie
// (une `Relation` relierait deux dimensions). Chaque cas est refusé (409).
const verifierChangementDimension = async ({
  referentielId,
  ancienneDimensionId,
}: {
  referentielId: string
  ancienneDimensionId: string
}): Promise<void> => {
  const autreReferentielAncienneDimension = {
    referentielId: { not: referentielId },
    referentiel: { dimensionId: ancienneDimensionId },
  }
  const [cellules, indicateursPartages, relations] = await Promise.all([
    db().celluleCoordonnee.count({ where: { individu: { referentielId } } }),
    db().indicateur.count({
      where: {
        AND: [
          { referentiels: { some: { referentielId } } },
          { referentiels: { some: autreReferentielAncienneDimension } },
        ],
      },
    }),
    db().relation.count({
      where: {
        OR: [
          { parent: { referentielId }, child: autreReferentielAncienneDimension },
          { child: { referentielId }, parent: autreReferentielAncienneDimension },
        ],
      },
    }),
  ])
  if (cellules > 0) {
    throw new ConflictError(
      'Changement de dimension refusé : des cellules référencent déjà les individus de ce référentiel.',
    )
  }
  if (indicateursPartages > 0) {
    throw new ConflictError(
      "Changement de dimension refusé : un indicateur déclare ce référentiel avec d'autres niveaux de sa dimension actuelle (il deviendrait multi-dimension).",
    )
  }
  if (relations > 0) {
    throw new ConflictError(
      "Changement de dimension refusé : des relations relient ses individus à d'autres niveaux de sa dimension actuelle.",
    )
  }
}

// Dimension du référentiel (cf. dimensions-design.md) :
// - fournie : elle doit exister ; la changer sur un référentiel existant est
//   refusé si ses individus sont déjà coordonnées de cellules (faits,
//   commentaires), s'il partage un indicateur ou une hiérarchie avec d'autres
//   niveaux de sa dimension actuelle ;
// - absente à la création : une dimension dédiée `DIM-<slug>` est créée ;
// - absente à la mise à jour : inchangée (retourne undefined).
const resoudreDimension = async ({
  referentielId,
  referentielPublicId,
  nom,
  dimensionPublicId,
}: {
  referentielId: string | undefined
  referentielPublicId: string
  nom: string
  dimensionPublicId: string | undefined
}): Promise<string | undefined> => {
  if (dimensionPublicId) {
    const dimension = await db().dimension.findUnique({ where: { publicId: dimensionPublicId } })
    if (!dimension) {
      throw new ValidationError('Dimension inconnue', { unknownDimensionIds: [dimensionPublicId] })
    }
    if (referentielId) {
      const actuel = await db().referentiel.findUniqueOrThrow({ where: { id: referentielId } })
      if (actuel.dimensionId !== dimension.id) {
        await verifierChangementDimension({
          referentielId,
          ancienneDimensionId: actuel.dimensionId,
        })
      }
    }
    return dimension.id
  }
  if (referentielId) return undefined
  const dimensionPublicIdDedie = `DIM-${referentielPublicId.replace(/^REF-/, '')}`.slice(0, 20)
  const existante = await db().dimension.findUnique({ where: { publicId: dimensionPublicIdDedie } })
  if (existante) {
    throw new ValidationError(
      `La dimension ${dimensionPublicIdDedie} existe déjà : préciser \`dimension\` explicitement`,
      { dimension: dimensionPublicIdDedie },
    )
  }
  const dimension = await db().dimension.create({
    data: { id: uuidv7(), publicId: dimensionPublicIdDedie, nom, description: null },
  })
  return dimension.id
}

const performUpsert = async (
  publicId: string,
  body: UpsertReferentielBody,
): Promise<Result<void, UpsertReferentielError>> => {
  ensurePrincipal(
    (principal) => isApiKeyAdmin(principal) || isOidcUser(principal),
    'Cette opération requiert un utilisateur OIDC ou une clé API de rôle ADMIN',
  )
  const existingReferentiel = await db().referentiel.findUnique({
    where: { publicId },
    select: { id: true, dimensionId: true },
  })

  const individuPublicIds = body.individus?.map((i) => i.publicId) ?? []
  const conflicts = await detectConflicts(existingReferentiel?.id, individuPublicIds)
  if (conflicts.length > 0) {
    return err({ type: 'INDIVIDUS_ALREADY_ATTACHED', individuIds: conflicts })
  }

  const dimensionId = await resoudreDimension({
    referentielId: existingReferentiel?.id,
    referentielPublicId: publicId,
    nom: body.nom,
    dimensionPublicId: body.dimension,
  })

  const referentiel = await db().referentiel.upsert({
    where: { publicId },
    update: {
      nom: body.nom,
      description: body.description,
      ...(dimensionId ? { dimensionId } : {}),
    },
    create: {
      id: uuidv7(),
      publicId,
      nom: body.nom,
      description: body.description,
      // Prisma valide `create` même quand la ligne existe : dimension actuelle.
      dimensionId: dimensionId ?? existingReferentiel!.dimensionId,
    },
  })

  for (const item of body.individus ?? []) {
    await db().individu.upsert({
      where: { publicId: item.publicId },
      update: { nom: item.nom },
      create: {
        id: uuidv7(),
        publicId: item.publicId,
        nom: item.nom,
        referentielId: referentiel.id,
      },
    })
  }

  return ok()
}

export const upsertReferentiel = (
  publicId: string,
  body: UpsertReferentielBody,
): ResultAsync<void, UpsertReferentielError> =>
  ResultAsync.fromSafePromise(performUpsert(publicId, body)).andThen((r) => r)
