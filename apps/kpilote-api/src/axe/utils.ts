import { type AxeApiModel, type ModaliteApiModel } from '@pilote/kpilote-shared/axe'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { type AxeModel, type ModaliteModel, type NiveauAxeModel } from '@/generated/prisma/models'

// Les écritures sur les axes sont réservées aux clés API ADMIN ; les lectures
// sont ouvertes à tout utilisateur authentifié.
export const requireAdmin = (): void =>
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')

export type AxeAvecNiveaux = AxeModel & {
  niveaux: ReadonlyArray<NiveauAxeModel>
  _count: { modalites: number }
}

export const axeInclude = {
  niveaux: { orderBy: { ordre: 'asc' } },
  _count: { select: { modalites: true } },
} as const

export const toAxeApiModel = (axe: AxeAvecNiveaux): AxeApiModel => ({
  id: axe.publicId,
  nom: axe.nom,
  description: axe.description,
  niveaux: axe.niveaux.map((niveau) => ({ ordre: niveau.ordre, nom: niveau.nom })),
  nombreModalites: axe._count.modalites,
  createdAt: axe.createdAt.toISOString(),
  updatedAt: axe.updatedAt.toISOString(),
})

export type ModaliteAvecNiveauEtParent = ModaliteModel & {
  niveauAxe: NiveauAxeModel
  parent: ModaliteModel | null
}

export const modaliteInclude = { niveauAxe: true, parent: true } as const

export const toModaliteApiModel = (modalite: ModaliteAvecNiveauEtParent): ModaliteApiModel => ({
  id: modalite.publicId,
  nom: modalite.nom,
  niveau: modalite.niveauAxe.ordre,
  parent: modalite.parent?.publicId ?? null,
  createdAt: modalite.createdAt.toISOString(),
  updatedAt: modalite.updatedAt.toISOString(),
})
