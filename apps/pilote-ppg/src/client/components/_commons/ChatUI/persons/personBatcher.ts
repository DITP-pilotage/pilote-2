import type { QueryClient } from "@tanstack/react-query";
import {
  create,
  keyResolver,
  windowedFiniteBatchScheduler,
  type Batcher,
} from "@yornaath/batshit";
import type { ResolvedPerson } from "@/shared/personne/personReference";

type PersonBatcher = Batcher<ResolvedPerson[], string, ResolvedPerson>;

// Indexé sur le QueryClient, stable : useUtils() recrée un proxy tRPC par
// composant, qui ne permettrait pas de regrouper les ids.
const batchers = new WeakMap<QueryClient, PersonBatcher>();

// La procédure accepte 100 ids au plus : 100 UUID tiennent aussi dans la
// limite d'URL de httpBatchLink (6000 caractères).
export const personBatcher = ({
  queryClient,
  resolve,
}: {
  queryClient: QueryClient;
  resolve: (ids: string[]) => Promise<ResolvedPerson[]>;
}): PersonBatcher => {
  const existing = batchers.get(queryClient);
  if (existing) return existing;

  const batcher = create({
    fetcher: resolve,
    resolver: keyResolver("id"),
    scheduler: windowedFiniteBatchScheduler({
      windowMs: 10,
      maxBatchSize: 100,
    }),
  });
  batchers.set(queryClient, batcher);
  return batcher;
};
