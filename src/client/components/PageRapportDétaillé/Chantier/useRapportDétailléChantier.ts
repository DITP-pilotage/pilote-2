import {
  mailleAssociéeAuTerritoireSélectionnéTerritoiresStore,
  mailleSélectionnéeTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import calculerChantierAvancements from '@/client/utils/chantier/avancement/calculerChantierAvancements';
import Chantier from '@/server/domain/chantier/Chantier.interface';

export function useRapportDétailléChantier(chantier: Chantier) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const mailleAssociéeAuTerritoireSélectionné = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();

  const {
    commentaires,
    objectifs,
    décisionStratégique,
  } = {
    commentaires: null,
    objectifs: null,
    décisionStratégique: null,
  };

  const avancements = calculerChantierAvancements(
    chantier,
    mailleSélectionnée,
    territoireSélectionné,
    mailleAssociéeAuTerritoireSélectionné,
  );

  return {
    commentaires: commentaires ?? null,
    objectifs: objectifs ?? null,
    décisionStratégique: décisionStratégique ?? null,
    avancements,
  };
}
