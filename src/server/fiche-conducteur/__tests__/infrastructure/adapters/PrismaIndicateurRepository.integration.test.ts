import { $Enums } from "@prisma/client";
import { PrismaIndicateurRepository } from "@/server/fiche-conducteur/infrastructure/adapters/PrismaIndicateurRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("PrismaIndicateurRepository", () => {
  let prismaIndicateurRepository: PrismaIndicateurRepository;

  beforeEach(() => {
    prismaIndicateurRepository = new PrismaIndicateurRepository({
      prisma: new PrismaPilote(),
    });
  });

  describe("#récupérerIndicImpactParChantierId", () => {
    it(
      "doit récupérer les indicateurs d'impact avec une pondération national supérieur à 0 du chantier associé",
      createIntegrationTest(async () => {
        // Given
        const chantier = await fixtures.chantierIdentite();

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

        const ind001 = await fixtures.indicateurIdentite({
          chantier_id: chantier.id,
          nom: "Indicateur 001",
          type_id: "IMPACT",
        });
        const ind002 = await fixtures.indicateurIdentite({
          chantier_id: chantier.id,
          nom: "Indicateur 002",
          type_id: "IMPACT",
        });
        // maille DEPT, ne doit pas être retourné
        const ind003 = await fixtures.indicateurIdentite({
          chantier_id: chantier.id,
          nom: "Indicateur 003",
          type_id: "IMPACT",
        });
        const ind004 = await fixtures.indicateurIdentite({
          chantier_id: chantier.id,
          nom: "Indicateur 004",
          type_id: "Q_SERV",
        });
        // ponderation = 0, ne doit pas être retourné
        const ind005 = await fixtures.indicateurIdentite({
          chantier_id: chantier.id,
          nom: "Indicateur 005",
          type_id: "IMPACT",
        });
        // ponderation = 0, ne doit pas être retourné
        const ind006 = await fixtures.indicateurIdentite({
          chantier_id: chantier.id,
          nom: "Indicateur 006",
          type_id: "Q_SERV",
        });

        await fixtures.indicateurTerritoire({
          id: ind001.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          ponderation_zone_reel: 20,
          valeur_cible_mandat: 10,
          taux_avancement_mandat: 30,
        });
        await fixtures.indicateurTerritoire({
          id: ind002.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          ponderation_zone_reel: 20,
          valeur_cible_mandat: 11,
          taux_avancement_mandat: 31,
        });
        await fixtures.indicateurTerritoire({
          id: ind003.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          zone_id: "D01",
          code_insee: "01",
          maille: $Enums.Maille.DEPT,
          ponderation_zone_reel: 20,
          valeur_cible_mandat: 12,
          taux_avancement_mandat: 32,
        });
        await fixtures.indicateurTerritoire({
          id: ind004.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          ponderation_zone_reel: 20,
          valeur_cible_mandat: 13,
          taux_avancement_mandat: 33,
        });
        await fixtures.indicateurTerritoire({
          id: ind005.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          ponderation_zone_reel: 0,
          valeur_cible_mandat: 14,
          taux_avancement_mandat: 34,
        });
        await fixtures.indicateurTerritoire({
          id: ind006.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          ponderation_zone_reel: 0,
          valeur_cible_mandat: 15,
          taux_avancement_mandat: 35,
        });

        await fixtures.indicateurTerritoireJalon({
          id: ind001.id,
          territoire_code: "NAT-FR",
          jalon: 2024,
          taux_avancement: 10,
          valeur_cible: 20,
          valeur_actuelle: 10,
          date_valeur_actuelle: new Date("2024-12-01"),
        });
        // jalon différent, ne doit pas être retourné
        await fixtures.indicateurTerritoireJalon({
          id: ind001.id,
          territoire_code: "NAT-FR",
          jalon: 2025,
          taux_avancement: 10,
          valeur_cible: 20,
          valeur_actuelle: 12,
          date_valeur_actuelle: new Date("2025-12-01"),
        });
        await fixtures.indicateurTerritoireJalon({
          id: ind002.id,
          territoire_code: "NAT-FR",
          jalon: 2024,
          taux_avancement: 11,
          valeur_cible: 21,
        });
        await fixtures.indicateurTerritoireJalon({
          id: ind003.id,
          territoire_code: "DEPT-01",
          zone_id: "D01",
          code_insee: "01",
          maille: $Enums.Maille.DEPT,
          jalon: 2024,
          taux_avancement: 12,
          valeur_cible: 22,
        });
        await fixtures.indicateurTerritoireJalon({
          id: ind004.id,
          territoire_code: "NAT-FR",
          jalon: 2024,
          taux_avancement: 13,
          valeur_cible: 23,
        });
        await fixtures.indicateurTerritoireJalon({
          id: ind005.id,
          territoire_code: "NAT-FR",
          jalon: 2024,
          taux_avancement: 14,
          valeur_cible: 24,
        });
        await fixtures.indicateurTerritoireJalon({
          id: ind006.id,
          territoire_code: "NAT-FR",
          jalon: 2024,
          taux_avancement: 15,
          valeur_cible: 15,
        });

        // When
        const listeIndicateursResult =
          await prismaIndicateurRepository.récupérerIndicImpactParChantierId(
            chantier.id,
            2024,
          );

        // Then
        expect(listeIndicateursResult).toHaveLength(3);
        expect(listeIndicateursResult).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              nom: "Indicateur 001",
              type: "IMPACT",
              valeurCible: 20,
              tauxAvancement: 10,
              dateValeurAvancement: new Date("2024-12-01").toISOString(),
            }),
            expect.objectContaining({
              nom: "Indicateur 002",
              type: "IMPACT",
              valeurCible: 21,
              tauxAvancement: 11,
            }),
            expect.objectContaining({
              nom: "Indicateur 004",
              type: "Q_SERV",
              valeurCible: 23,
              tauxAvancement: 13,
            }),
          ]),
        );
      }),
    );
  });
});
