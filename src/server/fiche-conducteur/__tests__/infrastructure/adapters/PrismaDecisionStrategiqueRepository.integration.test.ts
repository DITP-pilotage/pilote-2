import { $Enums } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { PrismaDecisionStrategiqueRepository } from "@/server/fiche-conducteur/infrastructure/adapters/PrismaDecisionStrategiqueRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("PrismaDecisionStrategiqueRepository", () => {
  let prismaDecisionStrategiqueRepository: PrismaDecisionStrategiqueRepository;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    prismaDecisionStrategiqueRepository =
      new PrismaDecisionStrategiqueRepository({ prisma: prismaPilote });
  });

  describe("#listerObjectifParChantierId", () => {
    it(
      "doit lister les decisions strategiques associé au chantier",
      createIntegrationTest(async (prisma) => {
        // Given
        const chantier = await fixtures.chantierIdentite();
        const autreChantier = await fixtures.chantierIdentite();

        await prisma.decision_strategique.createMany({
          data: [
            {
              id: randomUUID(),
              chantier_id: chantier.id,
              type: $Enums.type_decision_strategique.suivi_des_decisions,
              contenu: "contenu OK suivi_des_decisions",
              auteur_modification_id: null,
              date_modification: new Date(),
              date_creation: new Date(),
            },
            // autre chantier, ne doit pas être retourné
            {
              id: randomUUID(),
              chantier_id: autreChantier.id,
              type: $Enums.type_decision_strategique.suivi_des_decisions,
              contenu: "contenu KO chantier_id",
              auteur_modification_id: null,
              date_modification: new Date(),
              date_creation: new Date(),
            },
          ],
        });

        // When
        const listeDecisionsStrategiquesResult =
          await prismaDecisionStrategiqueRepository.listerDecisionStrategiqueParChantierId(
            { chantierId: chantier.id },
          );

        // Then
        expect(
          listeDecisionsStrategiquesResult.map(
            (decisionStrategique) => decisionStrategique.type,
          ),
        ).toIncludeSameMembers(["suivi_des_decisions"]);
        expect(
          listeDecisionsStrategiquesResult.map(
            (decisionStrategique) => decisionStrategique.contenu,
          ),
        ).toIncludeSameMembers(["contenu OK suivi_des_decisions"]);
      }),
    );
  });
});
