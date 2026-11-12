import { type UpsertAxeBody } from '@pilote/kpilote-shared/axe'
import { err, ok, type Result, ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { MESSAGE_ADMIN } from '@/axe/utils'
import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

export type UpsertAxeError =
  | { type: 'NIVEAU_PORTE_MODALITES'; ordres: number[] }
  | { type: 'AXE_UTILISE'; indicateurs: string[] }

// Les niveaux sont identifiés par leur position : `niveaux[i]` devient le
// niveau d'ordre i + 1 (créé ou renommé). Les niveaux au-delà de la liste sont
// supprimés, sauf s'ils portent des modalités.
const performUpsert = async ({
  publicId,
  body,
}: {
  publicId: string
  body: UpsertAxeBody
}): Promise<Result<void, UpsertAxeError>> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)

  const existing = await db().axe.findUnique({ where: { publicId }, include: { niveaux: true } })

  // Un indicateur qui déclare l'axe s'appuie sur ses niveaux pour calculer les
  // totaux : ajouter ou retirer un niveau changerait ses résultats. Renommer
  // reste permis.
  if (existing && existing.niveaux.length !== body.niveaux.length) {
    const declarations = await db().indicateurAxe.findMany({
      where: { axeId: existing.id },
      include: { indicateur: true },
    })
    if (declarations.length > 0) {
      return err({
        type: 'AXE_UTILISE',
        indicateurs: declarations.map((d) => d.indicateur.publicId).sort(),
      })
    }
  }
  const niveauxEnTrop = (existing?.niveaux ?? []).filter((n) => n.ordre > body.niveaux.length)
  if (niveauxEnTrop.length > 0) {
    // `modalites: { some: {} }` : niveaux qui portent au moins une modalité (EXISTS).
    const porteurs = await db().niveauAxe.findMany({
      where: { id: { in: niveauxEnTrop.map((n) => n.id) }, modalites: { some: {} } },
      orderBy: { ordre: 'asc' },
    })
    if (porteurs.length > 0) {
      return err({ type: 'NIVEAU_PORTE_MODALITES', ordres: porteurs.map((n) => n.ordre) })
    }
  }

  const axe = await db().axe.upsert({
    where: { publicId },
    update: { nom: body.nom, description: body.description },
    create: { id: uuidv7(), publicId, nom: body.nom, description: body.description },
  })

  for (const [index, niveau] of body.niveaux.entries()) {
    const ordre = index + 1
    await db().niveauAxe.upsert({
      where: { axeId_ordre: { axeId: axe.id, ordre } },
      update: { nom: niveau.nom },
      create: { id: uuidv7(), axeId: axe.id, nom: niveau.nom, ordre },
    })
  }

  if (niveauxEnTrop.length > 0) {
    await db().niveauAxe.deleteMany({ where: { id: { in: niveauxEnTrop.map((n) => n.id) } } })
  }

  return ok()
}

export const upsertAxe = (params: {
  publicId: string
  body: UpsertAxeBody
}): ResultAsync<void, UpsertAxeError> =>
  ResultAsync.fromSafePromise(performUpsert(params)).andThen((r) => r)
