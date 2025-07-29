import { prisma } from "@/server/db/prisma";
import { PrismaSyntheseDesResultatsRepository } from "@/server/fiche-territoriale/infrastructure/adapters/PrismaSyntheseDesResultatsRepository";

describe("PrismaSyntheseDesResultatsRepository", () => {
  let prismaSyntheseDesResultatsRepository: PrismaSyntheseDesResultatsRepository;

  beforeEach(() => {
    prismaSyntheseDesResultatsRepository =
      new PrismaSyntheseDesResultatsRepository();
  });

  describe("#recupererMapSyntheseDesResultatsParListeChantierIdEtTerritoire", () => {
    it("doit récupérer les synthèses correspondant à la liste des chantiers id", async () => {
      // Given
      const listeChantierId = ["CH-001", "CH-002"];
      const maille = "DEPT";
      const codeInsee = "34";

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
            zone_id: "D34",
            code_insee: "34",
            maille: "DEPT",
            meteo: null,
            territoire_code: "DEPT-34",
            taux_avancement_mandat: 2,
          },
          {
            id: "CH-002",
            zone_id: "D34",
            code_insee: "34",
            maille: "DEPT",
            meteo: null,
            territoire_code: "DEPT-34",
            taux_avancement_mandat: 2,
          },
          {
            id: "CH-002",
            zone_id: "D35",
            code_insee: "35",
            maille: "DEPT",
            meteo: null,
            territoire_code: "DEPT-35",
            taux_avancement_mandat: 2,
          },
          {
            id: "CH-002",
            zone_id: "R01",
            code_insee: "01",
            maille: "REG",
            meteo: null,
            territoire_code: "REG-01",
            taux_avancement_mandat: 2,
          },
          {
            id: "CH-003",
            zone_id: "D36",
            code_insee: "36",
            maille: "DEPT",
            meteo: null,
            territoire_code: "DEPT-36",
            taux_avancement_mandat: 2,
          },
        ],
      });

      await prisma.synthese_des_resultats.createMany({
        data: [
          {
            id: "871814a6-18b4-434c-a641-6f20659b5349",
            chantier_id: "CH-001",
            code_insee: "34",
            maille: "DEPT",
            territoire_code: "DEPT-34",
            date_meteo: "2023-02-02T00:00:00.000Z",
            date_commentaire: "2024-01-02T00:00:00.000Z",
          },
          {
            id: "9b87031f-6ea1-483c-b404-3cd83114b386",
            chantier_id: "CH-001",
            code_insee: "34",
            maille: "DEPT",
            territoire_code: "DEPT-34",
            date_meteo: "2021-01-02T00:00:00.000Z",
            date_commentaire: "2022-01-02T00:00:00.000Z",
          },
          {
            id: "2e15dc4d-7d59-40a2-96c8-5e1cf3270cf4",
            chantier_id: "CH-002",
            code_insee: "34",
            maille: "DEPT",
            territoire_code: "DEPT-34",
            date_meteo: "2020-03-02T00:00:00.000Z",
            date_commentaire: "2021-04-02T00:00:00.000Z",
          },
          {
            id: "63a7626e-a4ba-46fd-a9c2-73de73e5d6ba",
            chantier_id: "CH-002",
            code_insee: "35",
            maille: "DEPT",
            territoire_code: "DEPT-35",
            date_meteo: "2021-01-02T00:00:00.000Z",
            date_commentaire: "2022-01-02T00:00:00.000Z",
          },
          {
            id: "34b20967-95d0-4716-8a80-90a905676999",
            chantier_id: "CH-002",
            code_insee: "01",
            maille: "REG",
            territoire_code: "REG-01",
            date_meteo: "2021-01-02T00:00:00.000Z",
            date_commentaire: "2022-01-02T00:00:00.000Z",
          },
          {
            id: "71f69f33-d95b-47ca-909d-126810ccf129",
            chantier_id: "CH-003",
            code_insee: "36",
            maille: "DEPT",
            territoire_code: "DEPT-36",
            date_meteo: "2021-01-02T00:00:00.000Z",
            date_commentaire: "2022-01-02T00:00:00.000Z",
          },
        ],
      });

      // When
      const result =
        await prismaSyntheseDesResultatsRepository.recupererMapSyntheseDesResultatsParListeChantierIdEtTerritoire(
          { listeChantierId, maille, codeInsee },
        );

      // Then
      expect([...result.keys()]).toStrictEqual(["CH-001", "CH-002"]);
      expect(result.get("CH-001")?.at(0)?.dateMeteo).toEqual(
        "2023-02-02T00:00:00.000Z",
      );
      expect(result.get("CH-001")?.at(0)?.dateCommentaire).toEqual(
        "2024-01-02T00:00:00.000Z",
      );
      expect(result.get("CH-001")?.at(1)?.dateMeteo).toEqual(
        "2021-01-02T00:00:00.000Z",
      );
      expect(result.get("CH-001")?.at(1)?.dateCommentaire).toEqual(
        "2022-01-02T00:00:00.000Z",
      );

      expect(result.get("CH-002")?.at(0)?.dateMeteo).toEqual(
        "2020-03-02T00:00:00.000Z",
      );
      expect(result.get("CH-002")?.at(0)?.dateCommentaire).toEqual(
        "2021-04-02T00:00:00.000Z",
      );
    });
  });
});
