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
      createIntegrationTest(async () => {
        // Given
        const auteur = await fixtures.utilisateur();
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

        await prismaPilote.getInstance().synthese_des_resultats.create({
          data: {
            id: randomUUID(),
            chantier_id: chantier.id,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: $Enums.Maille.NAT,
            auteur_creation_id: auteur.id,
            auteur_modification_id: auteur.id,
            date_creation: "2022-01-02T00:00:00.000Z",
            date_modification: "2022-01-02T00:00:00.000Z",
            meteo: "SOLEIL",
            commentaire: "commentaire synthèse OK maille",
          },
        });
        // date plus ancienne, ne doit pas être retournée
        await prismaPilote.getInstance().synthese_des_resultats.create({
          data: {
            id: randomUUID(),
            chantier_id: chantier.id,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: $Enums.Maille.NAT,
            auteur_creation_id: auteur.id,
            auteur_modification_id: auteur.id,
            date_creation: "2021-01-02T00:00:00.000Z",
            date_modification: "2021-01-02T00:00:00.000Z",
            meteo: "COUVERT",
            commentaire: "commentaire synthèse KO ancienne",
          },
        });
        // maille DEPT, ne doit pas être retournée
        await prismaPilote.getInstance().synthese_des_resultats.create({
          data: {
            id: randomUUID(),
            chantier_id: chantier.id,
            territoire_code: "DEPT-34",
            code_insee: "34",
            maille: $Enums.Maille.DEPT,
            auteur_creation_id: auteur.id,
            auteur_modification_id: auteur.id,
            meteo: "SOLEIL",
            commentaire: "commentaire synthèse KO maille",
            date_creation: "2021-01-02T00:00:00.000Z",
            date_modification: "2021-01-02T00:00:00.000Z",
          },
        });
        // autre chantier, ne doit pas être retourné
        await prismaPilote.getInstance().synthese_des_resultats.create({
          data: {
            id: randomUUID(),
            chantier_id: autreChantier.id,
            territoire_code: "DEPT-34",
            code_insee: "34",
            maille: $Enums.Maille.DEPT,
            auteur_creation_id: auteur.id,
            auteur_modification_id: auteur.id,
            meteo: "SOLEIL",
            commentaire: "commentaire synthèse KO chantierID",
            date_creation: "2021-01-02T00:00:00.000Z",
            date_modification: "2021-01-02T00:00:00.000Z",
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
