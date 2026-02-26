import { $Enums } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { PrismaObjectifRepository } from "@/server/fiche-conducteur/infrastructure/adapters/PrismaObjectifRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("PrismaObjectifRepository", () => {
  let prismaObjectifRepository: PrismaObjectifRepository;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    prismaObjectifRepository = new PrismaObjectifRepository({
      prisma: prismaPilote,
    });
  });

  describe("#listerObjectifParChantierId", () => {
    it(
      "doit lister les objectifs associé au chantier",
      createIntegrationTest(async (prisma) => {
        // Given
        const chantier = await fixtures.chantierIdentite();
        const autreChantier = await fixtures.chantierIdentite();

        await prisma.objectif.createMany({
          data: [
            {
              id: randomUUID(),
              chantier_id: chantier.id,
              type: $Enums.type_objectif.deja_fait,
              contenu: "contenu OK deja_fait",
              auteur_id: null,
              date: new Date(),
            },
            {
              id: randomUUID(),
              chantier_id: chantier.id,
              type: $Enums.type_objectif.notre_ambition,
              contenu: "contenu OK notre_ambition",
              auteur_id: null,
              date: new Date(),
            },
            {
              id: randomUUID(),
              chantier_id: chantier.id,
              type: $Enums.type_objectif.a_faire,
              contenu: "contenu OK a_faire",
              auteur_id: null,
              date: new Date(),
            },
            // autre chantier, ne doit pas être retourné
            {
              id: randomUUID(),
              chantier_id: autreChantier.id,
              type: $Enums.type_objectif.notre_ambition,
              contenu: "contenu KO chantier_id",
              auteur_id: null,
              date: new Date(),
            },
          ],
        });

        // When
        const listeObjectifsResult =
          await prismaObjectifRepository.listerObjectifParChantierId({
            chantierId: chantier.id,
          });

        // Then
        expect(
          listeObjectifsResult.map((objectif) => objectif.type),
        ).toIncludeSameMembers(["deja_fait", "a_faire", "notre_ambition"]);
        expect(
          listeObjectifsResult.map((objectif) => objectif.contenu),
        ).toIncludeSameMembers([
          "contenu OK deja_fait",
          "contenu OK a_faire",
          "contenu OK notre_ambition",
        ]);
      }),
    );
  });
});
