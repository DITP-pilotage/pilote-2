import {
  create,
  keyResolver,
  windowedFiniteBatchScheduler,
  type Batcher,
} from "@yornaath/batshit";
import type { api } from "@/server/framework/trpc/api";
import type { ResolvedPerson } from "@/shared/personne/personReference";

export type PersonsClient = ReturnType<typeof api.useUtils>["client"];

type PersonBatcher = Batcher<ResolvedPerson[], string, ResolvedPerson>;

const batchers = new WeakMap<PersonsClient, PersonBatcher>();

// La procédure accepte 100 ids au plus : 100 UUID tiennent aussi dans la
// limite d'URL de httpBatchLink (6000 caractères).
export const personBatcher = (client: PersonsClient): PersonBatcher => {
  const existing = batchers.get(client);
  if (existing) return existing;

  const batcher = create({
    fetcher: (ids: string[]) => client.albert.persons.resolve.query({ ids }),
    resolver: keyResolver("id"),
    scheduler: windowedFiniteBatchScheduler({
      windowMs: 10,
      maxBatchSize: 100,
    }),
  });
  batchers.set(client, batcher);
  return batcher;
};
