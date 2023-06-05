import { typesCommentaireMailleNationale, typesCommentaireMailleRégionaleOuDépartementale } from '@/server/domain/chantier/commentaire/Commentaire.interface';
import { typesCommentaireProjetStructurant } from '@/server/domain/projetStructurant/commentaire/Commentaire.interface';

export const typesCommentaire = [...typesCommentaireMailleNationale, ...typesCommentaireMailleRégionaleOuDépartementale, ...typesCommentaireProjetStructurant] as const;
export type TypeCommentaire = typeof typesCommentaire[number];

export const libellésTypesCommentaire: Record<TypeCommentaire, string> = {
  commentairesSurLesDonnées: 'Commentaires sur les données',
  autresRésultatsObtenus: 'Autres résultats obtenus',
  autresRésultatsObtenusNonCorrélésAuxIndicateurs: 'Autres résultats obtenus (non corrélés aux indicateurs)',
  risquesEtFreinsÀLever: 'Risques et freins à lever',
  solutionsEtActionsÀVenir: 'Solutions et actions à venir',
  exemplesConcretsDeRéussite: 'Exemples concrets de réussite',
  dernieresRealisationEtSuiviDesDecisions: 'Suivi des décisions et réalisations',
  difficultésRencontréesEtRisquesAnticipés: 'Difficultés rencontrées et risques anticipés',
  solutionsProposéesEtProchainesÉtapes: 'Solutions proposées et prochaines étapes',
  partenariatsEtMoyensMobilisés: 'Partenariats et moyens mobilisés',
};

export const consignesDÉcritureCommentaire: Record<TypeCommentaire, string> = {
  commentairesSurLesDonnées: 'Présentez les résultats obtenus pour votre territoire. Précisez ce qui pourrait expliquer l’avance ou le retard du territoire par rapport aux autres.',
  autresRésultatsObtenusNonCorrélésAuxIndicateurs: 'Avez-vous constaté des résultats importants qui ne transparaissent pas dans les chiffres des indicateurs ?',
  autresRésultatsObtenus: 'Le cas échéant, présentez les résultats obtenus qui ne transparaissent pas dans les chiffres.',
  risquesEtFreinsÀLever: 'Résumez les principaux risques et freins que vous identifiez. Préciser si ces risques nécessitent un soutien de haut niveau ou des arbitrages interministériels.',
  solutionsEtActionsÀVenir: 'Quelles solutions envisagez-vous pour faire face aux risques listés précédemment ? Avez-vous déjà initié des actions liées à ces solutions ?',
  exemplesConcretsDeRéussite: 'Avez-vous des exemples de réussites au niveau national ou déconcentré qu’il vous semble utile de communiquer et de partager ?',
  dernieresRealisationEtSuiviDesDecisions: '',
  difficultésRencontréesEtRisquesAnticipés: '',
  solutionsProposéesEtProchainesÉtapes: '',
  partenariatsEtMoyensMobilisés: '',
};
