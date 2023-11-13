import {
  actionsTerritoiresStore,
  mailleSélectionnéeTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import calculerChantierAvancements from '@/client/utils/chantier/avancement/calculerChantierAvancements';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import api from '@/server/infrastructure/api/trpc/api';

export function useRapportDétailléChantier(chantier: Chantier) {
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
  const responsableLocal = chantierTerritoireSélectionné?.responsableLocal.filter(r => r.habilitations.lecture.chantiers.includes(chantier.id)) ?? [];
  const referentTerritorial = chantierTerritoireSélectionné?.référentTerritorial.filter(r => r.habilitations.lecture.chantiers.includes(chantier.id)) ?? [];

  return {
    avancements,
    responsableLocal,
    referentTerritorial,
  };
}
