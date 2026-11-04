import { type CommentairesOutput } from '@pilote/kpilote-shared/assistant/tools'
import {
  collectionCommentaireTypeSchema,
  indicateurIndividuCommentaireTypeSchema,
  type CommentaireApiModel,
} from '@pilote/kpilote-shared/commentaire'

import { findReadableCollection } from '@/assistant/tools/entityLookups'
import { findReadableIndicateur } from '@/assistant/tools/getSyntheseIndicateur'
import { textFromHtml } from '@/assistant/tools/textFromHtml'
import { type ToolDefinition } from '@/assistant/tools/toolDefinition'
import { listerCollectionCommentaires } from '@/collection/queries/listerCollectionCommentaires'
import { listerIndicateurIndividuCommentaires } from '@/indicateur/queries/listerIndicateurIndividuCommentaires'

export const MAX_VERSIONS_PER_TYPE = 10

const TYPE_LABELS: Record<string, string> = {
  DEFAUT: 'Commentaire',
  CONFIANCE: 'Niveau de confiance',
  OBJECTIF: 'Objectif',
}

const normalized = (text: string) => text.replace(/\s+/gu, ' ').trim().toLowerCase()

/** Du plus récent au plus ancien, sans répéter un texte identique à un autre déjà retenu. */
const toGroup = (type: string, commentaires: ReadonlyArray<CommentaireApiModel>) => {
  const seen = new Set<string>()
  const versions: CommentairesOutput['groupes'][number]['versions'] = []
  for (const commentaire of commentaires) {
    const texte = textFromHtml(commentaire.contenu)
    if (texte.length === 0 || seen.has(normalized(texte))) continue
    seen.add(normalized(texte))
    versions.push({
      date: commentaire.createdAt.slice(0, 10),
      auteur:
        commentaire.auteurCreation.type === 'utilisateur'
          ? commentaire.auteurCreation.email
          : commentaire.auteurCreation.label,
      texte,
    })
  }
  return {
    type: TYPE_LABELS[type] ?? type,
    versions: versions.slice(0, MAX_VERSIONS_PER_TYPE),
    truncated: versions.length > MAX_VERSIONS_PER_TYPE,
  }
}

const PAGE_SIZE = 100

export const getCommentaires: ToolDefinition<'get_commentaires'> = {
  description: `Renvoie les commentaires publiés sur un indicateur pour un individu, ou sur une collection, groupés par type (commentaire, niveau de confiance, objectif), du plus récent au plus ancien, en texte et sans répétitions.
- \`truncated\` : seuls les ${MAX_VERSIONS_PER_TYPE} plus récents d'un type sont lus.
- \`notFound\` : identifiants inexistants ou que l'utilisateur ne peut pas consulter ; ne les distingue pas.
Utilise-le pour : ce que disent les pilotes, le contexte d'un retard, la confiance dans les données.
Ne l'utilise pas pour : les valeurs et objectifs chiffrés → get_synthese_indicateur.`,
  execute: async (input) => {
    if (input.cible === 'INDICATEUR') {
      if (!(await findReadableIndicateur(input.indicateurId))) {
        return { groupes: [], notFound: [input.indicateurId] }
      }
      const groupes = await Promise.all(
        indicateurIndividuCommentaireTypeSchema.options.map(async (type) => {
          const page = await listerIndicateurIndividuCommentaires({
            params: { indicateurId: input.indicateurId, individuId: input.individuId },
            query: { type, pageSize: PAGE_SIZE },
          }).unwrapOr({ items: [] })
          return toGroup(type, page.items)
        }),
      )
      return { groupes: groupes.filter((groupe) => groupe.versions.length > 0), notFound: [] }
    }

    if (!(await findReadableCollection(input.collectionId))) {
      return { groupes: [], notFound: [input.collectionId] }
    }
    const groupes = await Promise.all(
      collectionCommentaireTypeSchema.options.map(async (type) => {
        const page = await listerCollectionCommentaires({
          params: { collectionId: input.collectionId },
          query: { type, pageSize: PAGE_SIZE },
        }).unwrapOr({ items: [] })
        return toGroup(type, page.items)
      }),
    )
    return { groupes: groupes.filter((groupe) => groupe.versions.length > 0), notFound: [] }
  },
}
