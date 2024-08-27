import { ChantierAccueilContrat } from '@/server/chantiers/app/contrats/ChantierAccueilContratNew';
import {
  AvancementsStatistiquesAccueilContrat,
} from '@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat';
import { TypeAlerteChantier } from '@/server/chantiers/app/contrats/TypeAlerteChantier';
import useVueDEnsemble from './useVueDEnsemble';

export default function usePageChantiers(chantiers: ChantierAccueilContrat[], territoireCode: string, filtresComptesCalculés: Record<TypeAlerteChantier, number>, avancementsAgrégés: AvancementsStatistiquesAccueilContrat) {
  const {
    chantiersVueDEnsemble,
    remontéesAlertes,
  } = useVueDEnsemble(chantiers, territoireCode, filtresComptesCalculés, avancementsAgrégés);

  return {
    chantiersFiltrés: chantiers,
    avancementsAgrégés,
    donnéesTableauChantiers: chantiersVueDEnsemble,
    remontéesAlertes,
  };
}
