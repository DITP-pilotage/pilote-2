/* eslint-disable react-hooks/exhaustive-deps */
import {
  checkAuthorizationChantierScope,
  Habilitation,
  SCOPE_SAISIE_INDICATEURS,
} from '@/server/domain/identité/Habilitation';
import {
  mailleAssociéeAuTerritoireSélectionnéTerritoiresStore,
  mailleSélectionnéeTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import api from '@/server/infrastructure/api/trpc/api';
import calculerChantierAvancements from '@/client/utils/chantier/avancement/calculerChantierAvancements';
import useChantier from '@/components/useChantier';

export default function usePageChantier(chantierId: string, habilitation: Habilitation) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const mailleAssociéeAuTerritoireSélectionné = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();

  const {
    détailsIndicateurs,
    commentaires,
    objectifs,
    synthèseDesRésultats,
    décisionStratégique,
  } = useChantier(chantierId);

  const modeÉcriture = checkAuthorizationChantierScope(habilitation, chantierId, SCOPE_SAISIE_INDICATEURS);

  const { data: chantier, refetch: rechargerChantier } = api.chantier.récupérer.useQuery(
    {
      chantierId,
    },
    { refetchOnWindowFocus: false },

  );

  const avancements = !chantier
    ? null
    : (
      calculerChantierAvancements(
        chantier,
        mailleSélectionnée,
        territoireSélectionné,
        mailleAssociéeAuTerritoireSélectionné,
      )
    );

  return {
    détailsIndicateurs, 
    commentaires: commentaires ?? null,
    objectifs: objectifs ?? null,
    synthèseDesRésultats: synthèseDesRésultats ?? null,
    décisionStratégique: décisionStratégique ?? null,
    modeÉcriture,
    chantier: chantier ?? null,
    rechargerChantier,
    avancements,
  };
}
