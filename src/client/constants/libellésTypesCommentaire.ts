import { TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';

const libellésTypesCommentaire: Record<TypeCommentaire, string> = {
  commentairesSurLesDonnées: 'Commentaires sur les données',
  autresRésultatsObtenus: 'Autres résultats obtenus (non corrélés aux indicateurs)',
  risquesEtFreinsÀLever: 'Risques et freins à lever',
  solutionsEtActionsÀVenir: 'Solutions et actions à venir',
  exemplesConcretsDeRéussite: 'Exemples concrets de réussite',
};

export default libellésTypesCommentaire;
