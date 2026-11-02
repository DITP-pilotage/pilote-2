import { type UpsertRelationBody } from '@pilote/kpilote-shared/relation'
import { err, ok, type Result, ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { MESSAGE_ADMIN } from '@/relation/utils'

export type UpsertRelationParentError =
  | { type: 'AUTO_PARENT' }
  | { type: 'CYCLE_DETECTE' }
  | { type: 'DIMENSIONS_DIFFERENTES' }
  | { type: 'FAITS_MASQUES' }

// Verrou « feuille à faits » (POC dimensions) : sur un indicateur
// multi-dimension, donner un enfant à un membre agrégeable (niveau ≠ NONE) qui
// porte déjà des faits rendrait ses cellules agrégées et masquerait ces faits.
// Les indicateurs mono-dimension gardent la sémantique historique (D6).
const masqueraitDesFaits = async (parentId: string, referentielId: string): Promise<boolean> => {
  const faits = { coordonnees: { some: { individuId: parentId } } }
  const indicateurs = await db().indicateur.findMany({
    where: {
      referentiels: { some: { referentielId, fonctionAgregation: { not: 'NONE' } } },
      OR: [{ valeurs: { some: { cellule: faits } } }, { objectifs: { some: { cellule: faits } } }],
    },
    select: { _count: { select: { dimensions: true } } },
  })
  return indicateurs.some((indicateur) => indicateur._count.dimensions > 1)
}

// Remontée des ancêtres du candidat. Le Set de visités protège des cycles déjà
// présents en base : les données historiques n'ont pas traversé cette garde.
const estDescendant = async (candidatId: string, ancetreId: string): Promise<boolean> => {
  const visites = new Set<string>([candidatId])
  let courant = [candidatId]

  while (courant.length > 0) {
    if (courant.includes(ancetreId)) return true
    const relations = await db().relation.findMany({
      where: { childId: { in: courant } },
      select: { parentId: true },
    })
    courant = relations.map((relation) => relation.parentId).filter((id) => !visites.has(id))
    for (const id of courant) visites.add(id)
  }

  return false
}

const performUpsert = async (
  enfantPublicId: string,
  body: UpsertRelationBody,
): Promise<Result<void, UpsertRelationParentError>> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)

  if (enfantPublicId === body.parent) return err({ type: 'AUTO_PARENT' })

  const enfant = await db().individu.findUniqueOrThrow({
    where: { publicId: enfantPublicId },
    select: { id: true, referentiel: { select: { dimensionId: true } } },
  })
  const parent = await db().individu.findUniqueOrThrow({
    where: { publicId: body.parent },
    select: { id: true, referentielId: true, referentiel: { select: { dimensionId: true } } },
  })
  // Une hiérarchie vit dans une seule dimension (un opérateur n'est jamais
  // parent d'un territoire).
  if (enfant.referentiel.dimensionId !== parent.referentiel.dimensionId) {
    return err({ type: 'DIMENSIONS_DIFFERENTES' })
  }
  if (await masqueraitDesFaits(parent.id, parent.referentielId)) {
    return err({ type: 'FAITS_MASQUES' })
  }

  // Verrou sur la ligne de l'enfant pour la durée de la transaction. Sans lui,
  // et faute de contrainte d'unicité sur `child_id`, deux écritures concurrentes
  // sur le même enfant intercalent leur deleteMany/create et laissent deux
  // parents — le cas se produit même sans relation préexistante, puisque
  // `deleteMany` ne verrouille alors aucune ligne.
  await db().$executeRaw`SELECT id FROM individu WHERE id = ${enfant.id}::uuid FOR UPDATE`

  if (await estDescendant(parent.id, enfant.id)) return err({ type: 'CYCLE_DETECTE' })

  await db().relation.deleteMany({ where: { childId: enfant.id } })
  await db().relation.create({
    data: { id: uuidv7(), parentId: parent.id, childId: enfant.id },
  })

  return ok(undefined)
}

export const upsertRelationParent = (
  enfantPublicId: string,
  body: UpsertRelationBody,
): ResultAsync<void, UpsertRelationParentError> =>
  ResultAsync.fromSafePromise(performUpsert(enfantPublicId, body)).andThen((result) => result)
