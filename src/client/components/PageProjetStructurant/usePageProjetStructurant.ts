import CommentaireProjetStructurant from '@/server/domain/projetStructurant/commentaire/Commentaire.interface';
import ObjectifProjetStructurant, { typeObjectifProjetStructurant } from '@/server/domain/projetStructurant/objectif/Objectif.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import api from '@/server/infrastructure/api/trpc/api';

export default function usePageProjetStructurant(projetStructurantId: ProjetStructurant['id'], territoireCode: ProjetStructurant['codeTerritoire']) {
  const { data: objectif } = api.publication.récupérerLaPlusRécente.useQuery(
    {
      réformeId: projetStructurantId,
      territoireCode: territoireCode,
      entité: 'objectifs',
      type: typeObjectifProjetStructurant,
    },
  );

  const { data: commentaires } = api.publication.récupérerLesPlusRécentesParTypeGroupéesParRéformes.useQuery(
    {
      réformeId: projetStructurantId,
      territoireCode: territoireCode,
      entité: 'commentaires',
    },
  );  
    
  return {
    objectif: objectif ? objectif as ObjectifProjetStructurant : null,
    commentaires: commentaires ? commentaires[projetStructurantId] as CommentaireProjetStructurant[] : null,
  };
}
