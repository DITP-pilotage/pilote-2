import {
  type BrouillonApiModel,
  type CommentaireApiModel,
  type CreerCommentaireBody,
  type ModifierCommentaireBody,
} from '@pilote/kpilote-shared/commentaire'
import {
  type CreerNiveauConfianceBody,
  type ModifierNiveauConfianceBody,
  type NiveauConfianceApiModel,
} from '@pilote/kpilote-shared/niveauConfiance'
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

// Config injectée par un Provider concret. `type` reste opaque (`string`) : seuls les
// écrans qui montent le Provider connaissent l'enum exact.
export type CommentaireConfig = {
  brouillonQueryOptions: (type: string) => QueryOpts<BrouillonApiModel>
  commentairesPubliesQueryOptions: (type: string) => QueryOpts<CommentaireApiModel[]>
  niveauPourCommentaireQueryOptions: (
    commentaireId: string,
  ) => QueryOpts<NiveauConfianceApiModel | null>

  useCreerCommentaire: (type: string) => CreerCommentaireMutation
  useModifierCommentaire: (type: string) => ModifierCommentaireMutation
  useEnregistrerNiveauConfiance: () => EnregistrerNiveauConfianceMutations

  // Droit d'écriture du principal sur la ressource commentée (gate l'ajout/édition).
  useCanWrite: () => boolean
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
