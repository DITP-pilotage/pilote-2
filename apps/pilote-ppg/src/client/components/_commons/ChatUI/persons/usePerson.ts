import { useQuery, type QueryClient } from "@tanstack/react-query";
import { api } from "@/server/framework/trpc/api";
import type { ResolvedPerson } from "@/shared/personne/personReference";
import { personBatcher } from "@/components/_commons/ChatUI/persons/personBatcher";

const DIX_MINUTES_MS = 10 * 60 * 1000;

export const personQueryKey = (id: string) => ["personne", id] as const;

export const usePerson = (id: string) => {
  const { client } = api.useUtils();
  return useQuery({
    queryKey: personQueryKey(id),
    queryFn: async (): Promise<ResolvedPerson | null> =>
      (await personBatcher(client).fetch(id)) ?? null,
    staleTime: DIX_MINUTES_MS,
  });
};

export const readCachedPerson = (
  queryClient: QueryClient,
  id: string,
): ResolvedPerson | null | undefined =>
  queryClient.getQueryData<ResolvedPerson | null>(personQueryKey(id));
