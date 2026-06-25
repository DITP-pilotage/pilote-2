import { queryOptions } from '@tanstack/react-query'

import { fetchNiveauxParCommentaires } from '@/api/niveauConfiance'

import { DEFAULT_STALE_TIME } from './utils'

export const niveauConfianceKeys = {
  // Préfixe par périmètre : invalide tous les batches de ce couple indicateur/individu.
  parScope: (indicateurId: string, individuId: string) =>
    ['indicateur', indicateurId, 'individu', individuId, 'niveaux-confiance'] as const,
  parCommentaires: (indicateurId: string, individuId: string, commentaireIds: string[]) =>
    [
      ...niveauConfianceKeys.parScope(indicateurId, individuId),
      [...commentaireIds].sort(),
    ] as const,
}

export const niveauxParCommentairesQueryOptions = (
  indicateurId: string,
  individuId: string,
  commentaireIds: string[],
) =>
  queryOptions({
    queryKey: niveauConfianceKeys.parCommentaires(indicateurId, individuId, commentaireIds),
    queryFn: () => fetchNiveauxParCommentaires(indicateurId, individuId, commentaireIds),
    staleTime: DEFAULT_STALE_TIME,
  })
