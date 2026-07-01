import { type NiveauConfianceApiModel } from '@pilote/mb-shared/niveauConfiance'
import { type QueryKey, queryOptions } from '@tanstack/react-query'
import { create, windowedFiniteBatchScheduler } from '@yornaath/batshit'

import {
  fetchNiveauxParCommentaires,
  fetchNiveauxParCommentairesPanier,
} from '@/api/niveauConfiance'

import { DEFAULT_STALE_TIME } from './utils'

// L'endpoint /indicateurs/{id}/individus/{individuId}/niveaux-confiance est
// paramétré par (indicateur, individu). On instancie un batcher par couple :
// l'utilisateur observe un seul périmètre à la fois, et les commentaires
// affichés dans une page partagent ce périmètre.
const batchersByScope = new Map<string, Batcher>()

type Batcher = ReturnType<typeof createBatcher>

const scopeKey = (indicateurId: string, individuId: string) => `${indicateurId}::${individuId}`

const createBatcher = (indicateurId: string, individuId: string) =>
  create({
    fetcher: async (commentaireIds: string[]): Promise<ReadonlyArray<NiveauConfianceApiModel>> => {
      const { items } = await fetchNiveauxParCommentaires(indicateurId, individuId, commentaireIds)
      return items
    },
    // Items renvoyés antichronologiquement par l'API → `find` garde le plus
    // récent par commentaire. Pas de niveau → null (commentaire sans niveau de confiance).
    resolver: (items, commentaireId) =>
      items.find((niveau) => niveau.commentaire.id === commentaireId) ?? null,
    scheduler: windowedFiniteBatchScheduler({ windowMs: 10, maxBatchSize: 100 }),
  })

const getBatcher = (indicateurId: string, individuId: string): Batcher => {
  const key = scopeKey(indicateurId, individuId)
  const existing = batchersByScope.get(key)
  if (existing) return existing
  const batcher = createBatcher(indicateurId, individuId)
  batchersByScope.set(key, batcher)
  return batcher
}

export const niveauConfianceKeys = {
  // Préfixe par périmètre : invalide toutes les queries de niveau de confiance de ce périmètre.
  parScope: (indicateurId: string, individuId: string) =>
    ['indicateur', indicateurId, 'individu', individuId, 'niveau-confiance'] as const,
  parCommentaire: (indicateurId: string, individuId: string, commentaireId: string) =>
    [...niveauConfianceKeys.parScope(indicateurId, individuId), commentaireId] as const,
}

// Cf. commentaires.ts : queryKey élargi à `QueryKey` pour permettre l'exposition
// via un Context React polymorphique (types tanstack-query invariants sur queryKey).
export const niveauPourCommentaireQueryOptions = (
  indicateurId: string,
  individuId: string,
  commentaireId: string,
) =>
  queryOptions<NiveauConfianceApiModel | null, Error, NiveauConfianceApiModel | null, QueryKey>({
    queryKey: niveauConfianceKeys.parCommentaire(indicateurId, individuId, commentaireId),
    queryFn: (): Promise<NiveauConfianceApiModel | null> =>
      getBatcher(indicateurId, individuId).fetch(commentaireId),
    staleTime: DEFAULT_STALE_TIME,
  })

// --- Panier global -----------------------------------------------------------

const batchersPanierByScope = new Map<string, BatcherPanier>()

type BatcherPanier = ReturnType<typeof createBatcherPanier>

const createBatcherPanier = (panierId: string) =>
  create({
    fetcher: async (commentaireIds: string[]): Promise<ReadonlyArray<NiveauConfianceApiModel>> => {
      const { items } = await fetchNiveauxParCommentairesPanier(panierId, commentaireIds)
      return items
    },
    resolver: (items, commentaireId) =>
      items.find((niveau) => niveau.commentaire.id === commentaireId) ?? null,
    scheduler: windowedFiniteBatchScheduler({ windowMs: 10, maxBatchSize: 100 }),
  })

const getBatcherPanier = (panierId: string): BatcherPanier => {
  const existing = batchersPanierByScope.get(panierId)
  if (existing) return existing
  const batcher = createBatcherPanier(panierId)
  batchersPanierByScope.set(panierId, batcher)
  return batcher
}

export const niveauConfiancePanierKeys = {
  parScope: (panierId: string) => ['panier', panierId, 'niveau-confiance'] as const,
  parCommentaire: (panierId: string, commentaireId: string) =>
    [...niveauConfiancePanierKeys.parScope(panierId), commentaireId] as const,
}

export const niveauPourCommentairePanierQueryOptions = (panierId: string, commentaireId: string) =>
  queryOptions<NiveauConfianceApiModel | null, Error, NiveauConfianceApiModel | null, QueryKey>({
    queryKey: niveauConfiancePanierKeys.parCommentaire(panierId, commentaireId),
    queryFn: (): Promise<NiveauConfianceApiModel | null> =>
      getBatcherPanier(panierId).fetch(commentaireId),
    staleTime: DEFAULT_STALE_TIME,
  })
