import { PrismaPilote } from "@/server/db/PrismaPilote";
import { InMemoryTransaction } from "@/server/db/InMemoryTransaction";
import { ModifierObjectifHandler } from "@/server/evaluation/handlers/ModifierObjectifHandler";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("ModifierObjectifHandler", () => {
  let handler: ModifierObjectifHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new InMemoryTransaction();

  beforeEach(() => {
    handler = new ModifierObjectifHandler({
      prisma: prismaPilote,
      transaction,
    });
  });

  describe("#execute", () => {
    it(
      "doit modifier le descriptif et l'indicateur cible de l'objectif",
      createIntegrationTest(async (tx) => {
        // Given
        const rattachement = await fixtures.rattachement();
        const objectif = await fixtures.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif 1",
          descriptif: "Description initiale",
          indicateur_cible: "Indicateur initial",
        });

        const fiche = await fixtures.fiche({
          rattachement_code: rattachement.code,
          etape_courante: "AUTO_EVALUATION",
        });

        // When
        await handler.execute({
          ficheEvaluationId: fiche.id,
          objectifId: objectif.id,
          descriptif: "Description modifiée",
          indicateurCible: "Indicateur modifié",
        });

        // Then
        const objectifUpdated = await tx.referentiel_objectif.findUnique({
          where: { id: objectif.id },
        });

        expect(objectifUpdated?.descriptif).toEqual("Description modifiée");
        expect(objectifUpdated?.indicateur_cible).toEqual("Indicateur modifié");
      }),
    );

    it(
      "doit échouer si l'objectif n'est pas lié à la fiche d'évaluation",
      createIntegrationTest(async () => {
        // Given
        const rattachement1 = await fixtures.rattachement();
        const rattachement2 = await fixtures.rattachement();

        const objectif = await fixtures.objectif({
          rattachement_code: rattachement1.code,
          libelle: "Objectif 2",
          descriptif: "Description initiale",
          indicateur_cible: "Indicateur initial",
        });

        const fiche = await fixtures.fiche({
          rattachement_code: rattachement2.code,
          etape_courante: "AUTO_EVALUATION",
        });

        // When/Then
        await expect(
          handler.execute({
            ficheEvaluationId: fiche.id,
            objectifId: objectif.id,
            descriptif: "Description modifiée",
            indicateurCible: "Indicateur modifié",
          }),
        ).rejects.toThrow("Objectif non trouvé pour cette fiche d'évaluation");
      }),
    );

    it(
      "doit échouer si l'objectif n'existe pas",
      createIntegrationTest(async () => {
        // Given
        const fiche = await fixtures.fiche({
          etape_courante: "AUTO_EVALUATION",
        });
        const nonExistentObjectifId = "e1f2a3b4-c5d6-7890-ef12-333333333333";

        // When/Then
        await expect(
          handler.execute({
            ficheEvaluationId: fiche.id,
            objectifId: nonExistentObjectifId,
            descriptif: "Description modifiée",
            indicateurCible: "Indicateur modifié",
          }),
        ).rejects.toThrow("Objectif non trouvé pour cette fiche d'évaluation");
      }),
    );
  });
});
