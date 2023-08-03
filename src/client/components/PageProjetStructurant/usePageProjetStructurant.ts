import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import CommentaireProjetStructurant from '@/server/domain/projetStructurant/commentaire/Commentaire.interface';
import ObjectifProjetStructurant, { typeObjectifProjetStructurant } from '@/server/domain/projetStructurant/objectif/Objectif.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import api from '@/server/infrastructure/api/trpc/api';
import SynthèseDesRésultatsProjetStructurant
  from '@/server/domain/projetStructurant/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { actionsTypeDeRéformeStore, typeDeRéformeSélectionnéeStore } from '@/client/stores/useTypeDeRéformeStore/useTypeDeRéformeStore';

export default function usePageProjetStructurant(projetStructurantId: ProjetStructurant['id'], territoireCode: ProjetStructurant['territoire']['code']) {
  const { modifierTypeDeRéformeSélectionné } = actionsTypeDeRéformeStore();
  const typeDeRéformeSélectionné = typeDeRéformeSélectionnéeStore();
  const { data: session } = useSession();


  useEffect(() => {
    if (typeDeRéformeSélectionné === 'chantier') modifierTypeDeRéformeSélectionné();
  }, [modifierTypeDeRéformeSélectionné, typeDeRéformeSélectionné]);  

  const modeÉcriture = !!session?.habilitations['saisie.commentaire'].territoires.includes(territoireCode);
  
  const { data: synthèseDesRésultats } = api.synthèseDesRésultats.récupérerLaPlusRécente.useQuery(
    {
      réformeId: projetStructurantId,
      territoireCode: territoireCode,
      typeDeRéforme: 'projet structurant',
    },
  );

  const { data: objectif } = api.publication.récupérerLaPlusRécente.useQuery(
    {
      réformeId: projetStructurantId,
      territoireCode: territoireCode,
      entité: 'objectifs',
      type: typeObjectifProjetStructurant,
      typeDeRéforme: 'projet structurant',

    },
  );

  const { data: commentaires } = api.publication.récupérerLesPlusRécentesParTypeGroupéesParRéformes.useQuery(
    {
      réformeId: projetStructurantId,
      territoireCode: territoireCode,
      entité: 'commentaires',
      typeDeRéforme: 'projet structurant',
    },
  );  
    
  return {
    synthèseDesRésultats: synthèseDesRésultats ? synthèseDesRésultats as SynthèseDesRésultatsProjetStructurant : null,
    objectif: objectif ? objectif as ObjectifProjetStructurant : null,
    commentaires: commentaires ? commentaires[projetStructurantId] as CommentaireProjetStructurant[] : null,
    modeÉcriture,
  };
}
