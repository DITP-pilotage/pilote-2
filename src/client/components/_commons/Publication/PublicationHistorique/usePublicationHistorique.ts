import { useState } from 'react';
import { territoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import api from '@/server/infrastructure/api/trpc/api';
import { RouterOutputs } from '@/server/infrastructure/api/trpc/trpc.interface';
import { validationPublicationContexte, zodValidateurEntitéType } from '@/validation/publication';
import PublicationHistoriqueProps from './PublicationHistorique.interface';

export default function usePublicationHistorique(
  type: PublicationHistoriqueProps['type'], 
  entité: PublicationHistoriqueProps['entité'],
  chantierId: PublicationHistoriqueProps['chantierId'],
  maille: PublicationHistoriqueProps['maille'],
  codeInsee: PublicationHistoriqueProps['codeInsee'],
) {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  const [publications, setPublications] = useState<RouterOutputs['publication']['récupérerHistorique']>();

  const inputs = validationPublicationContexte.and(zodValidateurEntitéType).parse({
    maille,
    chantierId,
    codeInsee,
    type,
    entité,
  });

  const { refetch: fetchRécupérerPublications } = api.publication.récupérerHistorique.useQuery(inputs, {
    enabled: false,
  });

  const récupérerPublications = async () => {
    const { data: données } = await fetchRécupérerPublications();
    setPublications(données);
  };

  return {
    publications,
    nomTerritoire: maille === 'nationale' ? 'France' : territoireSélectionné?.nom,
    récupérerPublications,
  };
}
