import { $Enums } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { PrismaSynthèseDesRésultatsRepository } from "@/server/fiche-conducteur/infrastructure/adapters/PrismaSynthèseDesRésultatsRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("PrismaSynthèseDesRésultatsRepository", () => {
  let prismaSynthèseDesRésultatsRepository: PrismaSynthèseDesRésultatsRepository;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    prismaSynthèseDesRésultatsRepository =
      new PrismaSynthèseDesRésultatsRepository({ prisma: prismaPilote });
  });

  describe("#recupererLaPlusRecenteMailleNatParChantierId", () => {
    it(
      "doit récupérer la synthèse la plus récente pour un chantier de maille nationale",
      createIntegrationTest(async (prisma) => {
        // Given
        const chantier = await fixtures.chantierIdentite();
        const autreChantier = await fixtures.chantierIdentite();

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "NAT-FR",
          zone_id: "FRANCE",
          code_insee: "FR",
          maille: $Enums.Maille.NAT,
        });
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-34",
          zone_id: "D01",
          code_insee: "34",
          maille: $Enums.Maille.DEPT,
        });
        await fixtures.chantierTerritoire({
          id: autreChantier.id,
          territoire_code: "NAT-FR",
          zone_id: "FRANCE",
          code_insee: "FR",
          maille: $Enums.Maille.NAT,
        });
        await fixtures.chantierTerritoire({
          id: autreChantier.id,
          territoire_code: "DEPT-34",
          zone_id: "D01",
          code_insee: "34",
          maille: $Enums.Maille.DEPT,
        });

        await prisma.synthese_des_resultats.create({
          data: {
            id: randomUUID(),
            chantier_id: chantier.id,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: $Enums.Maille.NAT,
            date_commentaire: "2022-01-02T00:00:00.000Z",
            meteo: "SOLEIL",
            commentaire: "commentaire synthèse OK maille",
          },
        });
        // date plus ancienne, ne doit pas être retournée
        await prisma.synthese_des_resultats.create({
          data: {
            id: randomUUID(),
            chantier_id: chantier.id,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: $Enums.Maille.NAT,
            date_commentaire: "2021-01-02T00:00:00.000Z",
            meteo: "COUVERT",
            commentaire: "commentaire synthèse KO ancienne",
          },
        });
        // maille DEPT, ne doit pas être retournée
        await prisma.synthese_des_resultats.create({
          data: {
            id: randomUUID(),
            chantier_id: chantier.id,
            territoire_code: "DEPT-34",
            code_insee: "34",
            maille: $Enums.Maille.DEPT,
            meteo: "SOLEIL",
            commentaire: "commentaire synthèse KO maille",
          },
        });
        // autre chantier, ne doit pas être retourné
        await prisma.synthese_des_resultats.create({
          data: {
            id: randomUUID(),
            chantier_id: autreChantier.id,
            territoire_code: "DEPT-34",
            code_insee: "34",
            maille: $Enums.Maille.DEPT,
            meteo: "SOLEIL",
            commentaire: "commentaire synthèse KO chantierID",
          },
        });

        // When
        const syntheseDesResultatsResult =
          await prismaSynthèseDesRésultatsRepository.recupererLaPlusRecenteMailleNatParChantierId(
            chantier.id,
          );

        // Then
        expect(syntheseDesResultatsResult?.meteo).toEqual("SOLEIL");
        expect(syntheseDesResultatsResult?.commentaire).toEqual(
          "commentaire synthèse OK maille",
        );
      }),
    );
  });
});
