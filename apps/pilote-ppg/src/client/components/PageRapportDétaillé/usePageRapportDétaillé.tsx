import { AvancementsStatistiquesAccueilContrat } from "@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat";
import { TypeAlerteChantier } from "@/server/chantiers/app/contrats/TypeAlerteChantier";
import { ChantierRapportDetailleSansMailles } from "@/server/rapport-detaille/rapportDetaille.interface";
import useVueDEnsemble from "@/client/hooks/useVueDEnsemble";

export default function usePageRapportDétaillé(
  chantiers: ChantierRapportDetailleSansMailles[],
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
