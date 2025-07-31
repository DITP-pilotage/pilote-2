import { PrismaChantierRepository } from "@/server/fiche-conducteur/infrastructure/adapters/PrismaChantierRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";

describe("PrismaChantierRepository", () => {
  let prisma: PrismaPilote;
  let prismaChantierRepository: PrismaChantierRepository;

  beforeEach(() => {
    prisma = new PrismaPilote();
    prismaChantierRepository = new PrismaChantierRepository({ prisma });
  });

  describe("#récupérerParIdEtParTerritoireCode", () => {
    it("doit récupérer le chantier associé", async () => {
      // Given
      await prisma.getInstance().chantier_identite.createMany({
        data: [
          {
            id: "CH-168",
            nom: "Chantier 168",
            est_territorialise: true,
            directeurs_administration_centrale: ["DAC 1", "DAC 2"],
            directeurs_projet: ["DP 1", "DP 2"],
          },
          {
            id: "CH-169",
            nom: "Chantier 169",
            est_territorialise: false,
            directeurs_administration_centrale: ["DAC 5", "DAC 6"],
            directeurs_projet: ["DP 5", "DP 6"],
          },
        ],
      });
      await prisma.getInstance().chantier_territoire.createMany({
        data: [
          {
            id: "CH-168",
            zone_id: "FRANCE",
            code_insee: "FR",
            maille: "NAT",
            territoire_code: "NAT-FR",
          },
          {
            id: "CH-168",
            zone_id: "D01",
            code_insee: "01",
            maille: "DEPT",
            territoire_code: "DEPT-01",
          },
          {
            id: "CH-169",
            zone_id: "FRANCE",
            code_insee: "FR",
            maille: "NAT",
            territoire_code: "NAT-FR",
          },
        ],
      });

      await prisma.getInstance().chantier_territoire_jalon.createMany({
        data: [
          {
            id: "CH-168",
            code_insee: "FR",
            zone_id: "FRANCE",
            maille: "NAT",
            territoire_code: "NAT-FR",
            jalon: 2025,
            taux_avancement: 9.2,
          },
          {
            id: "CH-168",
            code_insee: "01",
            zone_id: "D01",
            maille: "DEPT",
            territoire_code: "DEPT-01",
            jalon: 2025,
            taux_avancement: 14.3,
          },
          {
            id: "CH-168",
            code_insee: "01",
            zone_id: "D01",
            maille: "DEPT",
            territoire_code: "DEPT-01",
            jalon: 2024,
            taux_avancement: 13.3,
          },
          {
            id: "CH-169",
            code_insee: "FR",
            zone_id: "FRANCE",
            maille: "NAT",
            territoire_code: "NAT-FR",
            jalon: 2025,
            taux_avancement: null,
          },
        ],
      });

      // When
      const chantierResult =
        await prismaChantierRepository.récupérerParIdEtParTerritoireCode({
          chantierId: "CH-168",
          territoireCode: "NAT-FR",
          jalon: 2025,
        });

      // Then
      expect(chantierResult.id).toEqual("CH-168");
      expect(chantierResult.nom).toEqual("Chantier 168");
      expect(chantierResult.estTerritorialise).toEqual(true);
      expect(chantierResult.tauxAvancementAnnuel).toEqual(9.2);
      expect(
        chantierResult.listeDirecteursAdministrationCentrale,
      ).toIncludeSameMembers(["DAC 1", "DAC 2"]);
      expect(chantierResult.listeDirecteursProjet).toIncludeSameMembers([
        "DP 1",
        "DP 2",
      ]);
    });
  });

  describe("#récupérerMailleNatEtDeptParId", () => {
    it("doit récupérer le chantier associé", async () => {
      // Given
      await prisma.getInstance().chantier_identite.createMany({
        data: [
          {
            id: "CH-168",
            nom: "Chantier 168",
            est_territorialise: true,
            directeurs_administration_centrale: ["DAC 1", "DAC 2"],
            directeurs_projet: ["DP 1", "DP 2"],
          },
          {
            id: "CH-169",
            nom: "Chantier 169",
            est_territorialise: false,
            directeurs_administration_centrale: ["DAC 5", "DAC 6"],
            directeurs_projet: ["DP 5", "DP 6"],
          },
        ],
      });
      await prisma.getInstance().chantier_territoire.createMany({
        data: [
          {
            id: "CH-168",
            zone_id: "FRANCE",
            code_insee: "FR",
            maille: "NAT",
            territoire_code: "NAT-FR",
            taux_avancement_mandat: 10.2,
            meteo: "SOLEIL",
            est_applicable: true,
          },
          {
            id: "CH-168",
            zone_id: "D01",
            code_insee: "01",
            maille: "DEPT",
            territoire_code: "DEPT-01",
            taux_avancement_mandat: 15.3,
            meteo: "COUVERT",
            est_applicable: true,
          },
          {
            id: "CH-168",
            zone_id: "D02",
            code_insee: "02",
            maille: "DEPT",
            territoire_code: "DEPT-02",
            taux_avancement_mandat: null,
            meteo: "SOLEIL",
            est_applicable: false,
          },
          {
            id: "CH-168",
            zone_id: "R01",
            code_insee: "02",
            maille: "REG",
            territoire_code: "REG-01",
            taux_avancement_mandat: 10,
            meteo: "SOLEIL",
            est_applicable: false,
          },
          {
            id: "CH-169",
            zone_id: "FRANCE",
            code_insee: "FR",
            maille: "NAT",
            territoire_code: "NAT-FR",
            taux_avancement_mandat: 10,
            meteo: "SOLEIL",
            est_applicable: false,
          },
        ],
      });
      await prisma.getInstance().chantier_territoire_jalon.createMany({
        data: [
          {
            id: "CH-168",
            zone_id: "FRANCE",
            code_insee: "FR",
            maille: "NAT",
            territoire_code: "NAT-FR",
            jalon: 2024,
            taux_avancement: 9.2,
          },
          {
            id: "CH-168",
            zone_id: "D01",
            code_insee: "01",
            maille: "DEPT",
            territoire_code: "DEPT-01",
            jalon: 2024,
            taux_avancement: 13.3,
          },
          {
            id: "CH-168",
            zone_id: "D02",
            code_insee: "02",
            maille: "DEPT",
            territoire_code: "DEPT-02",
            jalon: 2024,
            taux_avancement: null,
          },
        ],
      });

      // When
      const chantierResult =
        await prismaChantierRepository.récupérerMailleNatEtDeptParId(
          "CH-168",
          2024,
        );

      // Then
      expect(chantierResult).toHaveLength(3);
      expect(
        chantierResult.map((chantier) => chantier.tauxAvancement),
      ).toIncludeSameMembers([10.2, 15.3, null]);
      expect(
        chantierResult.map((chantier) => chantier.tauxAvancementAnnuel),
      ).toIncludeSameMembers([9.2, 13.3, null]);
      expect(
        chantierResult.map((chantier) => chantier.codeInsee),
      ).toIncludeSameMembers(["FR", "01", "02"]);
      expect(
        chantierResult.map((chantier) => chantier.meteo),
      ).toIncludeSameMembers(["SOLEIL", "SOLEIL", "COUVERT"]);
      expect(
        chantierResult.map((chantier) => chantier.estApplicable),
      ).toIncludeSameMembers([true, true, false]);
    });
  });
});
