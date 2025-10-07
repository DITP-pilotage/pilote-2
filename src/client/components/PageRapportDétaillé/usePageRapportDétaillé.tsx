import { AvancementsStatistiquesAccueilContrat } from "@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat";
import { TypeAlerteChantier } from "@/server/chantiers/app/contrats/TypeAlerteChantier";
import { ChantierRapportDetailleContrat } from "@/server/chantiers/app/contrats/ChantierRapportDetailleContratV2";
import useVueDEnsemble from "./useVueDEnsemble";

export default function usePageRapportDétaillé(
  chantiers: ChantierRapportDetailleContrat[],
  territoireCode: string,
  filtresComptesCalculés: Record<TypeAlerteChantier, number>,
  avancementsAgrégés: AvancementsStatistiquesAccueilContrat,
) {
  const { chantiersVueDEnsemble, remontéesAlertes } = useVueDEnsemble(
    chantiers,
    territoireCode,
    filtresComptesCalculés,
    avancementsAgrégés,
  );

  return {
    donnéesTableauChantiers: chantiersVueDEnsemble,
    remontéesAlertes,
  };
}
