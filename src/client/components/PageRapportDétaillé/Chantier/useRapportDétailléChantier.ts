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
    détailsIndicateurs,
    commentaires,
    objectifs,
    synthèseDesRésultats,
    décisionStratégique,
  } = {
    détailsIndicateurs: null,
    commentaires: null,
    objectifs: null,
    synthèseDesRésultats: null,
    décisionStratégique: null,
  };

  const avancements = calculerChantierAvancements(
    chantier,
    mailleSélectionnée,
    territoireSélectionné,
    mailleAssociéeAuTerritoireSélectionné,
  );

  return {
    détailsIndicateurs,
    commentaires: commentaires ?? null,
    objectifs: objectifs ?? null,
    synthèseDesRésultats: synthèseDesRésultats ?? null,
    décisionStratégique: décisionStratégique ?? null,
    avancements,
  };
}
