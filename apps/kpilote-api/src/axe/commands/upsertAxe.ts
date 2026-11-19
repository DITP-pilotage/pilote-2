import { type UpsertAxeBody } from '@pilote/kpilote-shared/axe'
import { err, ok, type Result, ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import {
  type AxeUtiliseError,
  checkNiveauxSupprimables,
  checkNombreNiveauxModifiable,
  type NiveauPorteModalitesError,
} from '@/axe/rules'
import { ensureAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

export type UpsertAxeError = AxeUtiliseError | NiveauPorteModalitesError

type UpsertAxeParams = { publicId: string; body: UpsertAxeBody }

type AxeExistant = { id: string; niveaux: Array<{ id: string; ordre: number }> }

type UpsertAxeContext = {
  axe: AxeExistant | null
  indicateursDeclarants: string[]
  ordresPorteursDeModalites: number[]
}

const loadUpsertAxeContext = async ({
  publicId,
}: {
  publicId: string
}): Promise<UpsertAxeContext> => {
  const axe = await db().axe.findUnique({ where: { publicId }, include: { niveaux: true } })
  if (!axe) return { axe: null, indicateursDeclarants: [], ordresPorteursDeModalites: [] }

  const declarations = await db().indicateurAxe.findMany({
    where: { axeId: axe.id },
    include: { indicateur: true },
  })
  // `modalites: { some: {} }` : niveaux qui portent au moins une modalité (EXISTS).
  const porteurs = await db().niveauAxe.findMany({
    where: { axeId: axe.id, modalites: { some: {} } },
    orderBy: { ordre: 'asc' },
  })
  return {
    axe,
    indicateursDeclarants: declarations
      .map((declaration) => declaration.indicateur.publicId)
      .sort(),
    ordresPorteursDeModalites: porteurs.map((niveau) => niveau.ordre),
  }
}

// Les niveaux sont identifiés par leur position : `niveaux[i]` devient le
// niveau d'ordre i + 1 (créé ou renommé). Les niveaux au-delà de la liste sont
// supprimés.
const saveAxe = async ({
  publicId,
  body,
  axeExistant,
}: UpsertAxeParams & { axeExistant: AxeExistant | null }): Promise<void> => {
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

  const niveauxEnTrop = (axeExistant?.niveaux ?? []).filter(
    (niveau) => niveau.ordre > body.niveaux.length,
  )
  if (niveauxEnTrop.length > 0) {
    await db().niveauAxe.deleteMany({ where: { id: { in: niveauxEnTrop.map((n) => n.id) } } })
  }
}

const performUpsert = async ({
  publicId,
  body,
}: UpsertAxeParams): Promise<Result<void, UpsertAxeError>> => {
  ensureAdmin()

  const context = await loadUpsertAxeContext({ publicId })
  const nombreNiveauxCible = body.niveaux.length

  const modifiable = checkNombreNiveauxModifiable({
    nombreNiveauxActuel: context.axe?.niveaux.length ?? null,
    nombreNiveauxCible,
    indicateursDeclarants: context.indicateursDeclarants,
  })
  if (modifiable.isErr()) return err(modifiable.error)

  const supprimables = checkNiveauxSupprimables({
    nombreNiveauxCible,
    ordresPorteursDeModalites: context.ordresPorteursDeModalites,
  })
  if (supprimables.isErr()) return err(supprimables.error)

  await saveAxe({ publicId, body, axeExistant: context.axe })
  return ok()
}

export const upsertAxe = (params: UpsertAxeParams): ResultAsync<void, UpsertAxeError> =>
  new ResultAsync(performUpsert(params))
