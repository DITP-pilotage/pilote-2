import api from "@/server/infrastructure/api/trpc/api";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";

export const useModaleHistoriqueIndicateurTerritoireValeurEvenement = (
  open: boolean,
) => {
  const { indicateur, territoireCode } = useBlocIndicateurContext();

  const { data: historique, isLoading } =
    api.indicateur.recupererHistoriqueIndicateurTerritoire.useQuery(
      {
        indicateurId: indicateur.id,
        territoireCode,
      },
      { enabled: open },
    );

  return {
    historique: historique ?? {},
    isLoading,
  };
};
