import { useState } from 'react';
import { territoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import api from '@/server/infrastructure/api/trpc/api';
import { RouterOutputs } from '@/server/infrastructure/api/trpc/trpc.interface';
import PublicationHistoriqueProps from './PublicationHistorique.interface';

export default function useHistoriqueDUnCommentaire(
  type: PublicationHistoriqueProps['type'], 
  entité: PublicationHistoriqueProps['entité'],
  chantierId: PublicationHistoriqueProps['chantierId'],
  maille: PublicationHistoriqueProps['maille'],
  codeInsee: PublicationHistoriqueProps['codeInsee'],
) {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  
  const [publications, setPublications] = useState<RouterOutputs['publication']['récupérerHistorique']>();

  const { data } = api.publication.récupérerHistorique.useQuery({
    maille,
    chantierId,
    codeInsee,
    type,
    entité,
  });

  const récupérerPublications = () => {
    setPublications(data);
  };

  return {
    publications,
    territoireSélectionné,
    récupérerPublications,
  };
}
