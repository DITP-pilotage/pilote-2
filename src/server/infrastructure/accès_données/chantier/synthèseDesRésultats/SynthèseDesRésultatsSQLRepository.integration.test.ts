import { SynthèseDesRésultatsSQLRepository } from "@/server/infrastructure/accès_données/chantier/synthèseDesRésultats/SynthèseDesRésultatsSQLRepository";
import { prisma } from "@/server/db/prisma";

describe("SynthèseDesRésultatsSQLRepository ", function () {
  let synthèseDesRésultatsRepository: SynthèseDesRésultatsSQLRepository;

  beforeEach(() => {
    synthèseDesRésultatsRepository = new SynthèseDesRésultatsSQLRepository();
  });

  describe("récupérerLesPlusRécentesGroupéesParChantier", () => {
    test("retourne les objectifs les plus récent groupé par chantier", async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
          },
          {
            id: "CH-002",
            nom: "Chantier 002",
          },
          {
            id: "CH-003",
            nom: "Chantier 003",
          },
        ],
      });
      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            code_insee: "01",
            maille: "REG",
            zone_id: "R01",
            territoire_code: "REG-01",
          },
          {
            id: "CH-001",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
            territoire_code: "DEPT-01",
          },
          {
            id: "CH-002",
            code_insee: "01",
            maille: "REG",
            zone_id: "R01",
            territoire_code: "REG-01",
          },
          {
            id: "CH-002",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
            territoire_code: "DEPT-01",
          },
          {
            id: "CH-003",
            code_insee: "01",
            maille: "REG",
            zone_id: "R01",
            territoire_code: "REG-01",
          },
          {
            id: "CH-003",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
            territoire_code: "DEPT-01",
          },
        ],
      });

      await prisma.synthese_des_resultats.createMany({
        data: [
          {
            id: "85567357-8805-4de0-bb53-b20202f675f8",
            chantier_id: "CH-001",
            code_insee: "01",
            maille: "REG",
            meteo: "SOLEIL",
            territoire_code: "REG-01",
            commentaire: "Ma synthèse REG-01 2022",
            date_creation: new Date("2022-12-31"),
            date_modification: new Date("2022-12-31"),
          },
          {
            id: "9e101e9e-55e2-42e5-a20f-3d746bf6be33",
            chantier_id: "CH-001",
            code_insee: "01",
            maille: "REG",
            meteo: "SOLEIL",
            territoire_code: "REG-01",
            commentaire: "Ma synthèse REG-01 2023",
            date_creation: new Date("2023-12-31"),
            date_modification: new Date("2023-12-31"),
          },
          {
            id: "11926bad-2987-4626-90bc-a251df39271f",
            chantier_id: "CH-001",
            code_insee: "01",
            maille: "DEPT",
            meteo: "SOLEIL",
            territoire_code: "DEPT-01",
            commentaire: "Ma synthèse DEPT-01",
            date_creation: new Date("2023-12-31"),
            date_modification: new Date("2023-12-31"),
          },
          {
            id: "cb416fb2-38c3-4771-8065-efca4dd9b8f9",
            chantier_id: "CH-002",
            code_insee: "01",
            maille: "REG",
            meteo: "SOLEIL",
            territoire_code: "REG-01",
            commentaire: "Ma synthèse REG-01 2022",
            date_creation: new Date("2022-12-31"),
            date_modification: new Date("2022-12-31"),
          },
          {
            id: "8f8792f3-c7d7-48d7-a54a-ecb4c956cadc",
            chantier_id: "CH-002",
            code_insee: "01",
            maille: "REG",
            meteo: "ORAGE",
            territoire_code: "REG-01",
            commentaire: "Ma synthèse REG-01 2023 ch2",
            date_creation: new Date("2023-12-31"),
            date_modification: new Date("2022-12-31"),
          },
          {
            id: "dc006e87-ce1c-40ad-b127-1fab80b3899e",
            chantier_id: "CH-003",
            code_insee: "01",
            maille: "REG",
            meteo: "SOLEIL",
            territoire_code: "REG-01",
            commentaire: "Ma synthèse REG-01 2022",
            date_creation: new Date("2022-12-31"),
            date_modification: new Date("2022-12-31"),
          },
          {
            id: "5b031409-d693-40fc-a717-7c2eea3e51fd",
            chantier_id: "CH-003",
            code_insee: "01",
            maille: "REG",
            meteo: "SOLEIL",
            territoire_code: "REG-01",
            commentaire: "Ma synthèse REG-01 2023",
            date_creation: new Date("2023-12-31"),
            date_modification: new Date("2023-12-31"),
          },
        ],
      });

      // When
      const résultat =
        await synthèseDesRésultatsRepository.récupérerLesPlusRécentesGroupéesParChantier(
          ["CH-001", "CH-002"],
          "regionale",
          "01",
        );

      // Then
      expect(résultat).toStrictEqual({
        "CH-001": {
          id: "9e101e9e-55e2-42e5-a20f-3d746bf6be33",
          auteur: "Auteur Inconnu",
          contenu: "Ma synthèse REG-01 2023",
          date: "2023-12-31T00:00:00.000Z",
          météo: "SOLEIL",
        },
        "CH-002": {
          id: "8f8792f3-c7d7-48d7-a54a-ecb4c956cadc",
          auteur: "Auteur Inconnu",
          contenu: "Ma synthèse REG-01 2023 ch2",
          date: "2023-12-31T00:00:00.000Z",
          météo: "ORAGE",
        },
      });
    });
  });
});
