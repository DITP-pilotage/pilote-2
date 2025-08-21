import api from "@/server/infrastructure/api/trpc/api";

export const useModaleHistoriqueIndicateurTerritoireValeurEvenement = ({
  indicateurId,
  territoireCode,
}: {
  indicateurId: string;
  territoireCode: string;
}) => {
  const { data: historique, isLoading } =
    api.indicateur.recupererHistoriqueIndicateurTerritoire.useQuery({
      indicateurId,
      territoireCode,
    });

  return {
    historique: historique ?? {},
    isLoading,
  };
};
