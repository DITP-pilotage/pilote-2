import api from "@/server/infrastructure/api/trpc/api";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";

export const useModaleHistoriqueIndicateurTerritoireValeurEvenement = () => {
  const { indicateur, territoireCode } = useBlocIndicateurContext();

  const { data: historique, isLoading } =
    api.indicateur.recupererHistoriqueIndicateurTerritoire.useQuery({
      indicateurId: indicateur.id,
      territoireCode,
    });

  return {
    historique: historique ?? {},
    isLoading,
  };
};
