import {
  AvancementsStatistiquesAccueilContrat,
} from '@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat';
import { ChantierRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';
import useVueDEnsemble from './useVueDEnsemble';

export default function usePageRapportDétaillé(chantiers: ChantierRapportDetailleContrat[], territoireCode: string, filtresComptesCalculés: Record<string, {
  nombre: number
}>, avancementsAgrégés: AvancementsStatistiquesAccueilContrat) {
  const {
    chantiersVueDEnsemble,
    remontéesAlertes,
  } = useVueDEnsemble(chantiers, territoireCode, filtresComptesCalculés, avancementsAgrégés);

  return {
    donnéesTableauChantiers: chantiersVueDEnsemble,
    remontéesAlertes,
  };
}
