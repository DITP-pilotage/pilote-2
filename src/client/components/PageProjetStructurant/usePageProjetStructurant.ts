import CommentaireProjetStructurant from '@/server/domain/projetStructurant/commentaire/Commentaire.interface';
import ObjectifProjetStructurant, { typeObjectifProjetStructurant } from '@/server/domain/projetStructurant/objectif/Objectif.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import api from '@/server/infrastructure/api/trpc/api';
import SynthèseDesRésultatsProjetStructurant
  from '@/server/domain/projetStructurant/synthèseDesRésultats/SynthèseDesRésultats.interface';

export default function usePageProjetStructurant(projetStructurantId: ProjetStructurant['id'], territoireCode: ProjetStructurant['territoire']['code']) {

  const { data: synthèseDesRésultats } = api.synthèseDesRésultats.récupérerLaPlusRécente.useQuery(
    {
      réformeId: projetStructurantId,
      territoireCode: territoireCode,
    },
  );

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
    synthèseDesRésultats: synthèseDesRésultats ? synthèseDesRésultats as SynthèseDesRésultatsProjetStructurant : null,
    objectif: objectif ? objectif as ObjectifProjetStructurant : null,
    commentaires: commentaires ? commentaires[projetStructurantId] as CommentaireProjetStructurant[] : null,
  };
}
