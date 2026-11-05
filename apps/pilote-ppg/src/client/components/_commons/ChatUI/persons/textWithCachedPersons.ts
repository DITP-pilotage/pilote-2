import type { QueryClient } from "@tanstack/react-query";
import { readCachedPerson } from "@/components/_commons/ChatUI/persons/usePerson";
import {
  formatPerson,
  replacePersonReferences,
} from "@/shared/personne/personReference";

// Synchrone : le presse-papiers exige le geste de l'utilisateur, qu'un appel
// réseau avant la copie ferait perdre. Les personnes affichées sont en cache.
export const textWithCachedPersons = ({
  text,
  queryClient,
}: {
  text: string;
  queryClient: QueryClient;
}): string =>
  replacePersonReferences(text, (id) =>
    formatPerson(readCachedPerson(queryClient, id)),
  );
