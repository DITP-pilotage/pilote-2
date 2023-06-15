import { useState } from 'react';
import { territoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import api from '@/server/infrastructure/api/trpc/api';
import { RouterOutputs } from '@/server/infrastructure/api/trpc/trpc.interface';
import { validationPublicationContexte, zodValidateurEntitéType } from '@/validation/publication';
import { typeDeRéformeSélectionnéeStore } from '@/client/stores/useTypeDeRéformeStore/useTypeDeRéformeStore';
import PublicationHistoriqueProps from './PublicationHistorique.interface';

export default function usePublicationHistorique(
  type: PublicationHistoriqueProps['type'], 
  entité: PublicationHistoriqueProps['entité'],
  réformeId: PublicationHistoriqueProps['réformeId'],
  maille: PublicationHistoriqueProps['maille'],
) {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const typeDeRéforme = typeDeRéformeSélectionnéeStore();

  const [publications, setPublications] = useState<RouterOutputs['publication']['récupérerHistorique']>();

  const inputs = validationPublicationContexte.and(zodValidateurEntitéType).parse({
    réformeId,
    territoireCode: territoireSélectionné!.code,
    type,
    entité,
    typeDeRéforme,
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
    nomTerritoire: maille === 'nationale' ? 'France' : territoireSélectionné!.nom,
    récupérerPublications,
  };
}
