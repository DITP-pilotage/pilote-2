import {
  actionsTerritoiresStore,
  mailleSélectionnéeTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import calculerChantierAvancements from '@/client/utils/chantier/avancement/calculerChantierAvancements';
import api from '@/server/infrastructure/api/trpc/api';
import { ChantierRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';

export function useRapportDétailléChantier(chantier: ChantierRapportDetailleContrat) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const territoireParent = territoireSélectionné?.codeParent ? récupérerDétailsSurUnTerritoire(territoireSélectionné.codeParent) : null;

  const { data: avancementsAgrégés } = api.chantier.récupérerStatistiquesAvancements.useQuery(
    {
      chantiers: [chantier.id],
      maille: mailleSélectionnée,
    },
    { refetchOnWindowFocus: false, keepPreviousData: true },
  );

  const avancements = calculerChantierAvancements(
    chantier,
    mailleSélectionnée,
    territoireSélectionné!,
    territoireParent,
    avancementsAgrégés ?? null,
  );

  const chantierTerritoireSélectionné = chantier?.mailles[territoireSélectionné?.maille ?? 'nationale'][territoireSélectionné?.codeInsee ?? 'FR'];
  const responsableLocal = chantierTerritoireSélectionné?.responsableLocal ?? [];
  const coordinateurTerritorial = chantierTerritoireSélectionné?.coordinateurTerritorial ?? [];
  
  return {
    avancements,
    responsableLocal,
    coordinateurTerritorial,
  };
}
