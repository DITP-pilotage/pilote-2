import {
  actionsTerritoiresStore,
  mailleSélectionnéeTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import calculerChantierAvancements from '@/client/utils/chantier/avancement/calculerChantierAvancements';
import Chantier from '@/server/domain/chantier/Chantier.interface';

export function useRapportDétailléChantier(chantier: Chantier) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const territoireParent = territoireSélectionné?.codeParent ? récupérerDétailsSurUnTerritoire(territoireSélectionné.codeParent) : null;
  const avancements = calculerChantierAvancements(
    chantier,
    mailleSélectionnée,
    territoireSélectionné!,
    territoireParent,
  );

  return {
    avancements,
  };
}
