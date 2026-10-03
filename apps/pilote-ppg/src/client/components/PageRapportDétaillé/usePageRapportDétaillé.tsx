import { AvancementsStatistiquesAccueilContrat } from "@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat";
import { TypeAlerteChantier } from "@/server/chantiers/app/contrats/TypeAlerteChantier";
import { ChantierRapportDetailleWithoutMailles } from "@/server/rapport-detaille/rapportDetaille.interface";
import useVueDEnsemble from "@/client/hooks/useVueDEnsemble";

export function usePageRapportDétaillé(
  chantiers: ChantierRapportDetailleWithoutMailles[],
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
