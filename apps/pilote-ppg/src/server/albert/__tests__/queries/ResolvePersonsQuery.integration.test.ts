import { randomUUID } from "node:crypto";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { ResolvePersonsQuery } from "@/server/albert/queries/ResolvePersonsQuery";

describe("ResolvePersonsQuery", () => {
  const buildQuery = () =>
    new ResolvePersonsQuery({ prisma: new PrismaPilote() });

  it(
    "renvoie le prénom, le nom, l'e-mail, le service et la fonction des personnes connues",
    createIntegrationTest(async () => {
      // Given
      const jeanne = await fixtures.utilisateur({
        prenom: "Jeanne",
        nom: "Martin",
        email: "jeanne.martin@modernisation.gouv.fr",
        service: "autre",
        service_autre: "Bureau du pilotage",
        fonction: "Cheffe de projet",
      });

      // When
      const personnes = await buildQuery().execute({ ids: [jeanne.id] });

      // Then
      expect(personnes).toEqual([
        {
          id: jeanne.id,
          prenom: "Jeanne",
          nom: "Martin",
          email: "jeanne.martin@modernisation.gouv.fr",
          service: "Bureau du pilotage",
          fonction: "Cheffe de projet",
          estDesactive: false,
        },
      ]);
    }),
  );

  it(
    "signale un compte désactivé",
    createIntegrationTest(async () => {
      // Given
      const desactive = await fixtures.utilisateur({
        date_desactivation: new Date("2026-01-01T00:00:00Z"),
      });

      // When
      const personnes = await buildQuery().execute({ ids: [desactive.id] });

      // Then
      expect(personnes).toEqual([
        expect.objectContaining({ id: desactive.id, estDesactive: true }),
      ]);
    }),
  );

  it(
    "omet les ids inconnus et ignore les ids malformés",
    createIntegrationTest(async () => {
      // Given
      const connu = await fixtures.utilisateur({});

      // When
      const personnes = await buildQuery().execute({
        ids: [connu.id, randomUUID(), "pas-un-uuid"],
      });

      // Then
      expect(personnes).toEqual([expect.objectContaining({ id: connu.id })]);
    }),
  );
});
