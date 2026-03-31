import { SynthèseDesRésultatsSQLRepository } from "@/server/infrastructure/accès_données/chantier/synthèseDesRésultats/SynthèseDesRésultatsSQLRepository";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";

const TERRITOIRE_CODE = "REG-01";
const MAILLE = "REG";
const CODE_INSEE = "01";

describe("SynthèseDesRésultatsSQLRepository", () => {
  let repository: SynthèseDesRésultatsSQLRepository;

  beforeEach(() => {
    repository = new SynthèseDesRésultatsSQLRepository({
      prisma: new PrismaPilote(),
    });
  });

  describe("récupérerLesPlusRécentesGroupéesParChantier", () => {
    it(
      "retourne la synthèse publiée la plus récente groupée par chantier",
      createIntegrationTest(async () => {
        // Given
        const chantier1 = await fixtures.chantierIdentite();
        const chantier2 = await fixtures.chantierIdentite();
        const chantier3 = await fixtures.chantierIdentite();

        for (const chantier of [chantier1, chantier2, chantier3]) {
          await fixtures.chantierTerritoire({
            id: chantier.id,
            territoire_code: TERRITOIRE_CODE,
            maille: MAILLE,
            code_insee: CODE_INSEE,
          });
        }

        // chantier1 : deux synthèses, la plus récente doit être retournée
        await fixtures.syntheseDesResultats({
          chantier_id: chantier1.id,
          territoire_code: TERRITOIRE_CODE,
          maille: MAILLE,
          code_insee: CODE_INSEE,
          commentaire: "Ancienne synthèse chantier1",
          date_modification: new Date("2022-12-31"),
        });
        const synthese1Recente = await fixtures.syntheseDesResultats({
          chantier_id: chantier1.id,
          territoire_code: TERRITOIRE_CODE,
          maille: MAILLE,
          code_insee: CODE_INSEE,
          commentaire: "Synthèse récente chantier1",
          meteo: "SOLEIL",
          date_modification: new Date("2023-12-31"),
        });

        // chantier2 : deux synthèses dont la plus récente est ORAGE
        await fixtures.syntheseDesResultats({
          chantier_id: chantier2.id,
          territoire_code: TERRITOIRE_CODE,
          maille: MAILLE,
          code_insee: CODE_INSEE,
          commentaire: "Ancienne synthèse chantier2",
          date_modification: new Date("2022-12-31"),
        });
        const synthese2Recente = await fixtures.syntheseDesResultats({
          chantier_id: chantier2.id,
          territoire_code: TERRITOIRE_CODE,
          maille: MAILLE,
          code_insee: CODE_INSEE,
          commentaire: "Synthèse récente chantier2",
          meteo: "ORAGE",
          date_modification: new Date("2023-12-31"),
        });

        // chantier3 : non inclus dans la requête
        await fixtures.syntheseDesResultats({
          chantier_id: chantier3.id,
          territoire_code: TERRITOIRE_CODE,
          maille: MAILLE,
          code_insee: CODE_INSEE,
        });

        // When
        const result =
          await repository.récupérerLesPlusRécentesGroupéesParChantier(
            [chantier1.id, chantier2.id],
            "regionale",
            CODE_INSEE,
          );

        // Then
        expect(result).toEqual({
          [chantier1.id]: {
            id: synthese1Recente.id,
            auteur: "User Test",
            contenu: "Synthèse récente chantier1",
            date: new Date("2023-12-31").toISOString(),
            météo: "SOLEIL",
          },
          [chantier2.id]: {
            id: synthese2Recente.id,
            auteur: "User Test",
            contenu: "Synthèse récente chantier2",
            date: new Date("2023-12-31").toISOString(),
            météo: "ORAGE",
          },
        });
      }),
    );
  });
});
