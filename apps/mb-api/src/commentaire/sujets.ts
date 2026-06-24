import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { type Prisma } from '@/generated/prisma/client'
import { ensureIndicateurWritePermission, withIndicateurReadPermission } from '@/indicateur/permissions'
import { ensurePanierWritePermission, withPanierReadPermission } from '@/panier/permissions'

// Fragment `data` du satellite à greffer sur la création d'un Commentaire.
type SatelliteCreate = Pick<
  Prisma.CommentaireCreateInput,
  'indicateurIndividu' | 'panierIndividu' | 'panier'
>

// Données nécessaires pour rattacher un nouveau commentaire à son satellite.
type CibleEcriture = {
  principalId: string
  satelliteCreate: (type: string) => SatelliteCreate
}

export type SujetCommentaireConfig<P extends Record<string, string> = Record<string, string>> = {
  // Résout le path en ids internes + vérifie la permission WRITE ; throw ForbiddenError/404 sinon.
  resoudreCibleEcriture: (params: P) => ResultAsync<CibleEcriture, never>
  // Construit le `where` Prisma sur Commentaire pour le listing (READ permission + scope).
  whereLecture: (params: P, principalId: string) => Prisma.CommentaireWhereInput
}

// --- indicateur + individu ---------------------------------------------------

export const indicateurIndividuConfig: SujetCommentaireConfig<{
  indicateurId: string
  individuId: string
}> = {
  resoudreCibleEcriture: ({ indicateurId, individuId }) => {
    const principalId = requireCurrentPrincipalId()
    return ResultAsync.fromSafePromise(
      db().indicateur.findFirstOrThrow({
        where: withIndicateurReadPermission({ publicId: indicateurId }, principalId),
        select: { id: true },
      }),
    )
      .andThen((indicateur) =>
        ResultAsync.fromSafePromise(
          db().individu.findFirstOrThrow({ where: { publicId: individuId }, select: { id: true } }),
        ).map((individu) => ({ indId: indicateur.id, indivId: individu.id })),
      )
      .andThen(({ indId, indivId }) =>
        ensureIndicateurWritePermission({ indicateurId: indId, principalId }).map(() => ({
          principalId,
          satelliteCreate: (type: string) => ({
            indicateurIndividu: {
              create: { indicateurId: indId, individuId: indivId, type: type as never },
            },
          }),
        })),
      )
  },
  whereLecture: ({ indicateurId, individuId }, principalId) => ({
    indicateurIndividu: {
      indicateur: withIndicateurReadPermission({ publicId: indicateurId }, principalId),
      individu: { publicId: individuId },
    },
  }),
}

// --- panier + individu -------------------------------------------------------

export const panierIndividuConfig: SujetCommentaireConfig<{
  panierId: string
  individuId: string
}> = {
  resoudreCibleEcriture: ({ panierId, individuId }) => {
    const principalId = requireCurrentPrincipalId()
    return ResultAsync.fromSafePromise(
      db().panier.findFirstOrThrow({
        where: withPanierReadPermission({ publicId: panierId }, principalId),
        select: { id: true },
      }),
    )
      .andThen((panier) =>
        ResultAsync.fromSafePromise(
          db().individu.findFirstOrThrow({ where: { publicId: individuId }, select: { id: true } }),
        ).map((individu) => ({ panId: panier.id, indivId: individu.id })),
      )
      .andThen(({ panId, indivId }) =>
        ensurePanierWritePermission({ panierId: panId, principalId }).map(() => ({
          principalId,
          satelliteCreate: (type: string) => ({
            panierIndividu: { create: { panierId: panId, individuId: indivId, type: type as never } },
          }),
        })),
      )
  },
  whereLecture: ({ panierId, individuId }, principalId) => ({
    panierIndividu: {
      panier: withPanierReadPermission({ publicId: panierId }, principalId),
      individu: { publicId: individuId },
    },
  }),
}

// --- panier global -----------------------------------------------------------

export const panierConfig: SujetCommentaireConfig<{ panierId: string }> = {
  resoudreCibleEcriture: ({ panierId }) => {
    const principalId = requireCurrentPrincipalId()
    return ResultAsync.fromSafePromise(
      db().panier.findFirstOrThrow({
        where: withPanierReadPermission({ publicId: panierId }, principalId),
        select: { id: true },
      }),
    ).andThen((panier) =>
      ensurePanierWritePermission({ panierId: panier.id, principalId }).map(() => ({
        principalId,
        satelliteCreate: (type: string) => ({
          panier: { create: { panierId: panier.id, type: type as never } },
        }),
      })),
    )
  },
  whereLecture: ({ panierId }, principalId) => ({
    panier: { panier: withPanierReadPermission({ publicId: panierId }, principalId) },
  }),
}
