import {
  type BrouillonApiModel,
  type CommentaireApiModel,
  type CreerCommentaireBody,
  type ModifierCommentaireBody,
} from '@pilote/mb-shared/commentaire'
import {
  type CreerNiveauConfianceBody,
  type ModifierNiveauConfianceBody,
  type NiveauConfianceApiModel,
} from '@pilote/mb-shared/niveauConfiance'
import {
  type QueryKey,
  type UseMutationResult,
  type UseSuspenseQueryOptions,
} from '@tanstack/react-query'
import { createContext, useContext } from 'react'

// Type des query options exposées : compatible avec useSuspenseQuery / useSuspenseQueries.
// Le 4e générique `QueryKey` (au lieu d'un tuple littéral) est volontaire : les types
// tanstack-query sont invariants sur le queryKey, donc unifier ici est nécessaire pour
// que les Provider concrets puissent câbler n'importe quelle clé sans cast.
type QueryOpts<TData> = UseSuspenseQueryOptions<TData, Error, TData, QueryKey>

type CreerCommentaireMutation = UseMutationResult<
  CommentaireApiModel,
  Error,
  CreerCommentaireBody<string>
>

type ModifierCommentaireMutation = UseMutationResult<
  CommentaireApiModel,
  Error,
  { commentaireId: string; body: ModifierCommentaireBody }
>

type EnregistrerNiveauConfianceMutations = {
  creer: UseMutationResult<NiveauConfianceApiModel, Error, CreerNiveauConfianceBody>
  modifier: UseMutationResult<
    NiveauConfianceApiModel,
    Error,
    { niveauConfianceId: string; body: ModifierNiveauConfianceBody }
  >
}

// Config injectée par un Provider concret (indicateur-individu, panier, panier-individu, …).
// `type` reste typé `string` ici : seuls les écrans qui montent le Provider connaissent
// l'enum exact (CONFIANCE / DEFAUT / OBJECTIF). Les composants génériques le manipulent
// comme une valeur opaque.
export type CommentaireConfig = {
  brouillonQueryOptions: (type: string) => QueryOpts<BrouillonApiModel>
  commentairesPubliesQueryOptions: (type: string) => QueryOpts<CommentaireApiModel[]>
  niveauPourCommentaireQueryOptions: (
    commentaireId: string,
  ) => QueryOpts<NiveauConfianceApiModel | null>

  useCreerCommentaire: (type: string) => CreerCommentaireMutation
  useModifierCommentaire: (type: string) => ModifierCommentaireMutation
  useEnregistrerNiveauConfiance: () => EnregistrerNiveauConfianceMutations
}

const CommentaireConfigContext = createContext<CommentaireConfig | null>(null)

export const CommentaireConfigProvider = CommentaireConfigContext.Provider

export function useCommentaireConfig(): CommentaireConfig {
  const config = useContext(CommentaireConfigContext)
  if (!config) {
    throw new Error(
      'useCommentaireConfig: aucun CommentaireConfigProvider trouvé dans la hiérarchie.',
    )
  }
  return config
}
