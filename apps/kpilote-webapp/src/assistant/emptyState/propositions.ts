import type { PageContext } from '@pilote/kpilote-shared/assistant/chat'

export type Proposition = {
  id: string
  label: string
  message: string
  /** `fill` pré-remplit le champ quand il reste quelque chose à préciser. */
  mode: 'send' | 'fill'
}

/**
 * Les points de départ de l'écran vide, selon la page. Le prompt système sait quelles
 * entités la page affiche : « cet indicateur » suffit à les désigner.
 */
export const propositionsFor = (page: PageContext | undefined): Proposition[] => {
  const surIndividu = page?.individuId ? ' sur l’individu sélectionné' : ''

  if (page?.indicateurId) {
    return [
      {
        id: 'synthese_indicateur',
        label: 'Synthèse de cet indicateur',
        message: `Fais la synthèse de cet indicateur${surIndividu}.`,
        mode: 'send',
      },
      {
        id: 'dashboard_indicateur',
        label: 'Tableau de bord de cet indicateur',
        message: `Compose un tableau de bord de cet indicateur${surIndividu}.`,
        mode: 'send',
      },
      {
        id: 'comparaison_indicateur',
        label: 'Comparer des individus sur cet indicateur',
        message: 'Compare cet indicateur entre ',
        mode: 'fill',
      },
      {
        id: 'calcul_indicateur',
        label: 'Comment cet indicateur est-il calculé ?',
        message: 'Comment cet indicateur est-il calculé, et d’où viennent ses données ?',
        mode: 'send',
      },
    ]
  }

  if (page?.collectionId) {
    return [
      {
        id: 'synthese_collection',
        label: 'Synthèse de cette collection',
        message: `Fais la synthèse de cette collection${surIndividu}.`,
        mode: 'send',
      },
      {
        id: 'ecarts_collection',
        label: 'Indicateurs les plus éloignés de leur cible',
        message: `Quels indicateurs de cette collection sont les plus éloignés de leur cible${surIndividu} ?`,
        mode: 'send',
      },
      {
        id: 'dashboard_collection',
        label: 'Tableau de bord de cette collection',
        message: `Compose un tableau de bord de cette collection${surIndividu}.`,
        mode: 'send',
      },
      {
        id: 'comparaison_collection',
        label: 'Comparer des individus sur cette collection',
        message: 'Compare cette collection entre ',
        mode: 'fill',
      },
    ]
  }

  return [
    {
      id: 'trouver',
      label: 'Trouver un indicateur',
      message: 'Quels indicateurs suivent ',
      mode: 'fill',
    },
    {
      id: 'synthese',
      label: 'Synthèse d’un indicateur ou d’une collection',
      message: 'Fais la synthèse de ',
      mode: 'fill',
    },
    {
      id: 'comparaison',
      label: 'Comparer des individus',
      message: 'Compare ',
      mode: 'fill',
    },
    {
      id: 'aide',
      label: 'Comment utiliser kpilote ?',
      message: 'Que puis-je faire dans kpilote, et par où commencer ?',
      mode: 'send',
    },
  ]
}
