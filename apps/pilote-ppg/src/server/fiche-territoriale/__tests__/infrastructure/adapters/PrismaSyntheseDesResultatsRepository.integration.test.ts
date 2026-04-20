import { randomUUID } from "node:crypto";
import { PrismaSyntheseDesResultatsRepository } from "@/server/fiche-territoriale/infrastructure/adapters/PrismaSyntheseDesResultatsRepository";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";

describe("PrismaSyntheseDesResultatsRepository", () => {
  let prismaSyntheseDesResultatsRepository: PrismaSyntheseDesResultatsRepository;

  beforeEach(() => {
    prismaSyntheseDesResultatsRepository =
      new PrismaSyntheseDesResultatsRepository({ prisma: new PrismaPilote() });
  });

  describe("#recupererMapSyntheseDesResultatsParListeChantierIdEtTerritoire", () => {
    it(
      "doit récupérer les synthèses correspondant à la liste des chantiers id",
      createIntegrationTest(async (prisma) => {
        // Given
        const auteur = await fixtures.utilisateur();
        const ch1 = await fixtures.chantierIdentite();
        const ch2 = await fixtures.chantierIdentite();
        const ch3 = await fixtures.chantierIdentite();

        await fixtures.chantierTerritoire({
          id: ch1.id,
          territoire_code: "DEPT-34",
          maille: "DEPT",
          code_insee: "34",
          zone_id: "D34",
        });
        await fixtures.chantierTerritoire({
          id: ch2.id,
          territoire_code: "DEPT-34",
          maille: "DEPT",
          code_insee: "34",
          zone_id: "D34",
        });
        await fixtures.chantierTerritoire({
          id: ch2.id,
          territoire_code: "DEPT-35",
          maille: "DEPT",
          code_insee: "35",
          zone_id: "D35",
        });
        await fixtures.chantierTerritoire({
          id: ch2.id,
          territoire_code: "REG-01",
          maille: "REG",
          code_insee: "01",
          zone_id: "R01",
        });
        await fixtures.chantierTerritoire({
          id: ch3.id,
          territoire_code: "DEPT-36",
          maille: "DEPT",
          code_insee: "36",
          zone_id: "D36",
        });

        await prisma.synthese_des_resultats.createMany({
          data: [
            // ch1/DEPT-34 - la plus récente
            {
              id: randomUUID(),
              chantier_id: ch1.id,
              code_insee: "34",
              maille: "DEPT",
              territoire_code: "DEPT-34",
              auteur_creation_id: auteur.id,
              auteur_modification_id: auteur.id,
              date_creation: new Date("2023-02-02T00:00:00.000Z"),
              date_modification: new Date("2024-01-02T00:00:00.000Z"),
            },
            // ch1/DEPT-34 - moins récente
            {
              id: randomUUID(),
              chantier_id: ch1.id,
              code_insee: "34",
              maille: "DEPT",
              territoire_code: "DEPT-34",
              auteur_creation_id: auteur.id,
              auteur_modification_id: auteur.id,
              date_creation: new Date("2021-01-02T00:00:00.000Z"),
              date_modification: new Date("2023-01-02T00:00:00.000Z"),
            },
            // ch2/DEPT-34
            {
              id: randomUUID(),
              chantier_id: ch2.id,
              code_insee: "34",
              maille: "DEPT",
              territoire_code: "DEPT-34",
              auteur_creation_id: auteur.id,
              auteur_modification_id: auteur.id,
              date_creation: new Date("2020-03-02T00:00:00.000Z"),
              date_modification: new Date("2021-04-02T00:00:00.000Z"),
            },
            // ch2/DEPT-35 - ne doit pas être retourné (mauvais territoire)
            {
              id: randomUUID(),
              chantier_id: ch2.id,
              code_insee: "35",
              maille: "DEPT",
              territoire_code: "DEPT-35",
              auteur_creation_id: auteur.id,
              auteur_modification_id: auteur.id,
              date_creation: new Date("2021-01-02T00:00:00.000Z"),
              date_modification: new Date("2022-01-02T00:00:00.000Z"),
            },
            // ch2/REG-01 - ne doit pas être retourné (mauvaise maille)
            {
              id: randomUUID(),
              chantier_id: ch2.id,
              code_insee: "01",
              maille: "REG",
              territoire_code: "REG-01",
              auteur_creation_id: auteur.id,
              auteur_modification_id: auteur.id,
              date_creation: new Date("2021-01-02T00:00:00.000Z"),
              date_modification: new Date("2022-01-02T00:00:00.000Z"),
            },
            // ch3 - ne doit pas être retourné (chantier non demandé)
            {
              id: randomUUID(),
              chantier_id: ch3.id,
              code_insee: "36",
              maille: "DEPT",
              territoire_code: "DEPT-36",
              auteur_creation_id: auteur.id,
              auteur_modification_id: auteur.id,
              date_creation: new Date("2021-01-02T00:00:00.000Z"),
              date_modification: new Date("2022-01-02T00:00:00.000Z"),
            },
          ],
        });

        // When
        const result =
          await prismaSyntheseDesResultatsRepository.recupererMapSyntheseDesResultatsParListeChantierIdEtTerritoire(
            {
              listeChantierId: [ch1.id, ch2.id],
              maille: "DEPT",
              codeInsee: "34",
            },
          );

        // Then
        expect([...result.keys()]).toIncludeSameMembers([ch1.id, ch2.id]);
        expect(result.get(ch1.id)?.at(0)?.dateMeteo).toEqual(
          "2024-01-02T00:00:00.000Z",
        );
        expect(result.get(ch1.id)?.at(0)?.dateCommentaire).toEqual(
          "2024-01-02T00:00:00.000Z",
        );
        expect(result.get(ch1.id)?.at(1)?.dateMeteo).toEqual(
          "2023-01-02T00:00:00.000Z",
        );
        expect(result.get(ch1.id)?.at(1)?.dateCommentaire).toEqual(
          "2023-01-02T00:00:00.000Z",
        );
        expect(result.get(ch2.id)?.at(0)?.dateMeteo).toEqual(
          "2021-04-02T00:00:00.000Z",
        );
        expect(result.get(ch2.id)?.at(0)?.dateCommentaire).toEqual(
          "2021-04-02T00:00:00.000Z",
        );
      }),
    );
  });
});
