import { type PageContext } from '@pilote/kpilote-shared/assistant/chat'

import { type ResolvedPageContext } from '@/assistant/prompt/systemPrompt'
import { findReadableCollection } from '@/assistant/tools/entityLookups'
import { findReadableIndicateur } from '@/assistant/tools/getSyntheseIndicateur'
import { db } from '@/framework/persistence/dbStore'

/**
 * Les entités de la page, nommées par le serveur. Le client n'envoie que des identifiants :
 * une entité inconnue ou illisible est ignorée, et aucune phrase venue du client n'atteint
 * le prompt.
 */
export const resolvePageContext = async (
  context: PageContext | undefined,
): Promise<ResolvedPageContext | null> => {
  if (!context) return null
  const [indicateur, collection, individu] = await Promise.all([
    context.indicateurId ? findReadableIndicateur(context.indicateurId) : null,
    context.collectionId ? findReadableCollection(context.collectionId) : null,
    context.individuId
      ? db().individu.findUnique({
          where: { publicId: context.individuId },
          select: { publicId: true, nom: true, referentiel: { select: { nom: true } } },
        })
      : null,
  ])
  const resolved: ResolvedPageContext = {
    ...(indicateur ? { indicateur: { id: indicateur.id, nom: indicateur.nom } } : {}),
    ...(collection ? { collection: { id: collection.id, nom: collection.nom } } : {}),
    ...(individu
      ? {
          individu: {
            id: individu.publicId,
            nom: individu.nom,
            referentiel: individu.referentiel.nom,
          },
        }
      : {}),
  }
  return Object.keys(resolved).length === 0 ? null : resolved
}
