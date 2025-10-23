import { AvancementsStatistiquesAccueilContrat } from "@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat";
import { TypeAlerteChantier } from "@/server/chantiers/app/contrats/TypeAlerteChantier";
import { ChantierAccueilContratV2 } from "@/server/chantiers/app/contrats/ChantierAccueilContratV2";
import useVueDEnsemble from "./useVueDEnsemble";

export default function usePageChantiers(
  chantiers: ChantierAccueilContratV2[],
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
