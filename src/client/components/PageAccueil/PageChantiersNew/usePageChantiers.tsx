import { useEffect } from 'react';
import { ChantierAccueilContrat } from '@/server/chantiers/app/contrats/ChantierAccueilContratNew';
import {
  AvancementsStatistiquesAccueilContrat,
} from '@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat';
import { désactiverUnFiltreFn } from '@/stores/useFiltresStoreNew/useFiltresStore';
import useVueDEnsemble from './useVueDEnsemble';

export default function usePageChantiers(chantiers: ChantierAccueilContrat[], territoireCode: string, filtresComptesCalculés: Record<string, { nombre: number }>, avancementsAgrégés: AvancementsStatistiquesAccueilContrat) {
  const aDesDroitsDeLectureSurAuMoinsUnChantierBrouillon = (chantierIds: string[]) => {
    return chantiers.some(chantier => chantier.statut === 'BROUILLON' && chantierIds.includes(chantier.id));
  };

  const [maille] = territoireCode.split('-');

  const mailleChantier = maille === 'NAT' ? 'nationale' : maille === 'REG' ? 'régionale' : 'départementale';

  useEffect(() => {
    if (mailleChantier === 'nationale') {
      désactiverUnFiltreFn('estEnAlerteÉcart', 'filtresAlerte');
    } else {
      désactiverUnFiltreFn('estEnAlerteTauxAvancementNonCalculé', 'filtresAlerte');
    }
  }, [mailleChantier]); // Totalement inutile mais casse les filtres si supprimé .....

  const {
    chantiersVueDEnsemble,
    remontéesAlertes,
  } = useVueDEnsemble(chantiers, territoireCode, filtresComptesCalculés, avancementsAgrégés);

  return {
    chantiersFiltrés: chantiers,
    avancementsAgrégés,
    donnéesTableauChantiers: chantiersVueDEnsemble,
    remontéesAlertes,
    aDesDroitsDeLectureSurAuMoinsUnChantierBrouillon,
  };
}
