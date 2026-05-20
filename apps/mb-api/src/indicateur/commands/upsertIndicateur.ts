import { type IndicateurReferentielLink, type UpsertIndicateurBody } from '@pilote/mb-shared/indicateur'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { ForbiddenError, ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { type FonctionAgregation, PermissionAction } from '@/generated/prisma/enums'

type UpsertIndicateurParams = {
  publicId: string
  body: UpsertIndicateurBody
}

type ResolvedLink = { referentielId: string; fonctionAgregation: FonctionAgregation }

const resolveReferentielLinks = async (
  links: ReadonlyArray<IndicateurReferentielLink>,
): Promise<ResolvedLink[]> => {
  const dedupedByPublicId = new Map<string, FonctionAgregation>()
  for (const link of links) {
    dedupedByPublicId.set(link.referentielId, link.fonctionAgregation)
  }
  const publicIds = [...dedupedByPublicId.keys()]
  if (publicIds.length === 0) return []

  const found = await db().referentiel.findMany({
    where: { publicId: { in: publicIds } },
    select: { id: true, publicId: true },
  })
  const foundPublicIds = new Set(found.map((r) => r.publicId))
  const unknownIds = publicIds.filter((id) => !foundPublicIds.has(id))
  if (unknownIds.length > 0) {
    throw new ValidationError('Référentiels inconnus', {
      unknownReferentielIds: unknownIds.sort(),
    })
  }
  return found.map((r) => ({
    referentielId: r.id,
    fonctionAgregation: dedupedByPublicId.get(r.publicId)!,
  }))
}

const replaceReferentielLinks = async (
  indicateurId: string,
  links: ResolvedLink[],
): Promise<void> => {
  const existing = await db().indicateurReferentiel.findMany({
    where: { indicateurId },
    select: { referentielId: true, fonctionAgregation: true },
  })
  const existingByReferentielId = new Map(
    existing.map((row) => [row.referentielId, row.fonctionAgregation]),
  )
  const targetReferentielIds = new Set(links.map((l) => l.referentielId))

  const toRemove = existing
    .filter((row) => !targetReferentielIds.has(row.referentielId))
    .map((row) => row.referentielId)

  const toAdd: ResolvedLink[] = []
  const toUpdate: ResolvedLink[] = []
  for (const link of links) {
    const existingFonction = existingByReferentielId.get(link.referentielId)
    if (existingFonction === undefined) {
      toAdd.push(link)
    } else if (existingFonction !== link.fonctionAgregation) {
      toUpdate.push(link)
    }
  }

  if (toRemove.length > 0) {
    await db().indicateurReferentiel.deleteMany({
      where: { indicateurId, referentielId: { in: toRemove } },
    })
  }
  if (toAdd.length > 0) {
    await db().indicateurReferentiel.createMany({
      data: toAdd.map((link) => ({
        indicateurId,
        referentielId: link.referentielId,
        fonctionAgregation: link.fonctionAgregation,
      })),
    })
  }
  for (const link of toUpdate) {
    await db().indicateurReferentiel.update({
      where: {
        indicateurId_referentielId: {
          indicateurId,
          referentielId: link.referentielId,
        },
      },
      data: { fonctionAgregation: link.fonctionAgregation },
    })
  }
}

const assertWritePermission = async ({
  indicateurId,
  principalId,
}: {
  indicateurId: string
  principalId: string
}): Promise<void> => {
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

const updateExisting = async ({
  publicId,
  indicateurId,
  body,
  principalId,
}: {
  publicId: string
  indicateurId: string
  body: UpsertIndicateurBody
  principalId: string
}): Promise<void> => {
  await assertWritePermission({ indicateurId, principalId })
  const links = await resolveReferentielLinks(body.referentiels)
  await db().indicateur.update({ where: { publicId }, data: { nom: body.nom } })
  await replaceReferentielLinks(indicateurId, links)
}

const createWithGrants = async ({
  publicId,
  body,
  principalId,
}: {
  publicId: string
  body: UpsertIndicateurBody
  principalId: string
}): Promise<void> => {
  const links = await resolveReferentielLinks(body.referentiels)
  const id = uuidv7()
  await db().indicateur.create({ data: { id, publicId, nom: body.nom } })
  await db().indicateurPermission.createMany({
    data: [
      { principalId, indicateurId: id, action: PermissionAction.READ },
      { principalId, indicateurId: id, action: PermissionAction.WRITE },
    ],
  })
  if (links.length > 0) {
    await db().indicateurReferentiel.createMany({
      data: links.map((link) => ({
        indicateurId: id,
        referentielId: link.referentielId,
        fonctionAgregation: link.fonctionAgregation,
      })),
    })
  }
}

const performUpsert = async ({ publicId, body }: UpsertIndicateurParams): Promise<void> => {
  const principalId = requireCurrentPrincipalId()
  const existing = await db().indicateur.findUnique({ where: { publicId } })
  if (existing) {
    await updateExisting({ publicId, indicateurId: existing.id, body, principalId })
    return
  }
  await createWithGrants({ publicId, body, principalId })
}

export const upsertIndicateur = (params: UpsertIndicateurParams): ResultAsync<void, never> =>
  ResultAsync.fromSafePromise(performUpsert(params))
