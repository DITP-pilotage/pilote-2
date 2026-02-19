import { keepPreviousData } from "@tanstack/react-query";
import api from "@/server/infrastructure/api/trpc/api";

export const useNouveautés = () => {
  const { data: listeNouveautes, isLoading: estChargementListeNouveautes } =
    api.parametrageNouveautes.lister.useQuery(undefined, {
      placeholderData: keepPreviousData,
    });

  return {
    listeNouveautes,
    estChargementListeNouveautes,
  };
};
