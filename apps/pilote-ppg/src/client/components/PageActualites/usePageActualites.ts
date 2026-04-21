import api from "@/server/infrastructure/api/trpc/api";

export const usePageActualites = () => {
  const [newsletters] = api.actualites.listerNewsletters.useSuspenseQuery(
    undefined,
    { staleTime: 3_600_000 },
  );

  return { newsletters };
};
