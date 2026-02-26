import { $Enums } from "@prisma/client";
import { PrismaChantierRepository } from "@/server/fiche-conducteur/infrastructure/adapters/PrismaChantierRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("PrismaChantierRepository", () => {
  let prismaChantierRepository: PrismaChantierRepository;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    prismaChantierRepository = new PrismaChantierRepository({
      prisma: prismaPilote,
    });
  });

  describe("#récupérerParIdEtParTerritoireCode", () => {
    it(
      "doit récupérer le chantier associé",
      createIntegrationTest(async () => {
        // Given
        const chantier = await fixtures.chantierIdentite({
          nom: "Chantier 168",
          est_territorialise: true,
          directeurs_administration_centrale: ["DAC 1", "DAC 2"],
          directeurs_projet: ["DP 1", "DP 2"],
        });
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
          territoire_code: "DEPT-01",
          zone_id: "D01",
          code_insee: "01",
          maille: $Enums.Maille.DEPT,
        });
        await fixtures.chantierTerritoire({
          id: autreChantier.id,
          territoire_code: "NAT-FR",
          zone_id: "FRANCE",
          code_insee: "FR",
          maille: $Enums.Maille.NAT,
        });

        await fixtures.chantierTerritoireJalon({
          id: chantier.id,
          territoire_code: "NAT-FR",
          zone_id: "FRANCE",
          code_insee: "FR",
          maille: $Enums.Maille.NAT,
          jalon: 2025,
          taux_avancement: 9.2,
        });
        await fixtures.chantierTerritoireJalon({
          id: chantier.id,
          territoire_code: "DEPT-01",
          zone_id: "D01",
          code_insee: "01",
          maille: $Enums.Maille.DEPT,
          jalon: 2025,
          taux_avancement: 14.3,
        });
        // jalon différent, ne doit pas être retourné
        await fixtures.chantierTerritoireJalon({
          id: chantier.id,
          territoire_code: "DEPT-01",
          zone_id: "D01",
          code_insee: "01",
          maille: $Enums.Maille.DEPT,
          jalon: 2024,
          taux_avancement: 13.3,
        });
        // autre chantier, ne doit pas être retourné
        await fixtures.chantierTerritoireJalon({
          id: autreChantier.id,
          territoire_code: "NAT-FR",
          zone_id: "FRANCE",
          code_insee: "FR",
          maille: $Enums.Maille.NAT,
          jalon: 2025,
          taux_avancement: null,
        });

        // When
        const chantierResult =
          await prismaChantierRepository.récupérerParIdEtParTerritoireCode({
            chantierId: chantier.id,
            territoireCode: "NAT-FR",
            jalon: 2025,
          });

        // Then
        expect(chantierResult.id).toEqual(chantier.id);
        expect(chantierResult.nom).toEqual("Chantier 168");
        expect(chantierResult.estTerritorialise).toEqual(true);
        expect(chantierResult.tauxAvancement).toEqual(9.2);
        expect(
          chantierResult.listeDirecteursAdministrationCentrale,
        ).toIncludeSameMembers(["DAC 1", "DAC 2"]);
        expect(chantierResult.listeDirecteursProjet).toIncludeSameMembers([
          "DP 1",
          "DP 2",
        ]);
      }),
    );
  });

  describe("#récupérerMailleNatEtDeptParId", () => {
    it(
      "doit récupérer le chantier associé",
      createIntegrationTest(async () => {
        // Given
        const chantier = await fixtures.chantierIdentite();
        const autreChantier = await fixtures.chantierIdentite();

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "NAT-FR",
          zone_id: "FRANCE",
          code_insee: "FR",
          maille: $Enums.Maille.NAT,
          taux_avancement_mandat: 10.2,
          meteo: "SOLEIL",
          est_applicable: true,
        });
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-01",
          zone_id: "D01",
          code_insee: "01",
          maille: $Enums.Maille.DEPT,
          taux_avancement_mandat: 15.3,
          meteo: "COUVERT",
          est_applicable: true,
        });
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-02",
          zone_id: "D02",
          code_insee: "02",
          maille: $Enums.Maille.DEPT,
          taux_avancement_mandat: null,
          meteo: "SOLEIL",
          est_applicable: false,
        });
        // maille REG, ne doit pas être retourné
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "REG-01",
          zone_id: "R01",
          code_insee: "02",
          maille: $Enums.Maille.REG,
          taux_avancement_mandat: 10,
          meteo: "SOLEIL",
          est_applicable: false,
        });
        // autre chantier, ne doit pas être retourné
        await fixtures.chantierTerritoire({
          id: autreChantier.id,
          territoire_code: "NAT-FR",
          zone_id: "FRANCE",
          code_insee: "FR",
          maille: $Enums.Maille.NAT,
          taux_avancement_mandat: 10,
          meteo: "SOLEIL",
          est_applicable: false,
        });

        await fixtures.chantierTerritoireJalon({
          id: chantier.id,
          territoire_code: "NAT-FR",
          zone_id: "FRANCE",
          code_insee: "FR",
          maille: $Enums.Maille.NAT,
          jalon: 2024,
          taux_avancement: 9.2,
        });
        await fixtures.chantierTerritoireJalon({
          id: chantier.id,
          territoire_code: "DEPT-01",
          zone_id: "D01",
          code_insee: "01",
          maille: $Enums.Maille.DEPT,
          jalon: 2024,
          taux_avancement: 13.3,
        });
        await fixtures.chantierTerritoireJalon({
          id: chantier.id,
          territoire_code: "DEPT-02",
          zone_id: "D02",
          code_insee: "02",
          maille: $Enums.Maille.DEPT,
          jalon: 2024,
          taux_avancement: null,
        });

        // When
        const chantierResult =
          await prismaChantierRepository.récupérerMailleNatEtDeptParId(
            chantier.id,
            2024,
          );

        // Then
        expect(chantierResult).toHaveLength(3);
        expect(
          chantierResult.map((territoire) => territoire.tauxAvancement),
        ).toIncludeSameMembers([9.2, 13.3, null]);
        expect(
          chantierResult.map((territoire) => territoire.codeInsee),
        ).toIncludeSameMembers(["FR", "01", "02"]);
        expect(
          chantierResult.map((territoire) => territoire.meteo),
        ).toIncludeSameMembers(["SOLEIL", "SOLEIL", "COUVERT"]);
        expect(
          chantierResult.map((territoire) => territoire.estApplicable),
        ).toIncludeSameMembers([true, true, false]);
      }),
    );
  });
});
