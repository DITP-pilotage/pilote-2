import { ChantierAccueilContrat } from '@/server/chantiers/app/contrats/ChantierAccueilContratNew';
import {
  AvancementsStatistiquesAccueilContrat,
} from '@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat';
import useVueDEnsemble from './useVueDEnsemble';

export default function usePageChantiers(chantiers: ChantierAccueilContrat[], territoireCode: string, filtresComptesCalculés: Record<string, {
  nombre: number
}>, avancementsAgrégés: AvancementsStatistiquesAccueilContrat) {
  const aDesDroitsDeLectureSurAuMoinsUnChantierBrouillon = (chantierIds: string[]) => {
    return chantiers.some(chantier => chantier.statut === 'BROUILLON' && chantierIds.includes(chantier.id));
  };

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
