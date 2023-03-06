import { TypeCommentaire } from '@/server/domain/chantier/Commentaire.interface';

const typesCommentaire: Record<TypeCommentaire, string> = {
  'freinsÀLever': 'Freins à lever',
  'actionsÀVenir': 'Actions à venir',
  'actionsÀValoriser': 'Actions à valoriser',
  'autresRésultatsObtenus': 'Autres résultats obtenus',
};

export default typesCommentaire;
