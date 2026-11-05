import { QueryClient } from "@tanstack/react-query";
import { personBatcher } from "@/components/_commons/ChatUI/persons/personBatcher";
import type { ResolvedPerson } from "@/shared/personne/personReference";

const personne = (id: string): ResolvedPerson => ({
  id,
  prenom: "Jeanne",
  nom: "Martin",
  email: "jeanne.martin@modernisation.gouv.fr",
  service: null,
  fonction: null,
  estDesactive: false,
});

describe("personBatcher", () => {
  test("regroupe en un seul appel les personnes demandées par des composants différents", async () => {
    // Given — chaque composant obtient sa propre fonction d'appel (proxy tRPC recréé par useUtils)
    const queryClient = new QueryClient();
    const appelsDuPremier = vi.fn(async (ids: string[]) => ids.map(personne));
    const appelsDuSecond = vi.fn(async (ids: string[]) => ids.map(personne));

    // When
    const personnes = await Promise.all([
      personBatcher({ queryClient, resolve: appelsDuPremier }).fetch("id-1"),
      personBatcher({ queryClient, resolve: appelsDuSecond }).fetch("id-2"),
    ]);

    // Then
    expect(personnes).toEqual([personne("id-1"), personne("id-2")]);
    expect(appelsDuPremier.mock.calls.map(([ids]) => ids)).toEqual([
      ["id-1", "id-2"],
    ]);
    expect(appelsDuSecond).not.toHaveBeenCalled();
  });
});
