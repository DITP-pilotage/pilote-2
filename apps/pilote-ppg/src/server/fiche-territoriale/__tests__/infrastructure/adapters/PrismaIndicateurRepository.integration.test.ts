import { prisma } from "@/server/framework/persistence/prisma";
import { PrismaIndicateurRepository } from "@/server/fiche-territoriale/infrastructure/adapters/PrismaIndicateurRepository";
import { Indicateur } from "@/server/fiche-territoriale/domain/Indicateur";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";

describe("PrismaIndicateurRepository", () => {
  let prismaIndicateurRepository: PrismaIndicateurRepository;

  beforeEach(() => {
    prismaIndicateurRepository = new PrismaIndicateurRepository();
  });

  describe("recupererMapIndicateursParListeChantierIdEtTerritoire", () => {
    it(
      "quand la maille est un département, doit récupérer les indicateurs associés à la liste des chantiers",
      createIntegrationTest(async () => {
        // Given
        const maille = "DEPT";
        const codeInsee = "01";

        const chantier1 = await fixtures.chantierIdentite({
          nom: "Un nom de chantier 1",
        });
        const chantier2 = await fixtures.chantierIdentite({
          nom: "Un nom de chantier 2",
        });
        const chantier3 = await fixtures.chantierIdentite({
          nom: "Un nom de chantier 3",
        });
        await fixtures.chantierIdentite({
          nom: "Un nom de chantier 4",
        });

        const listeChantierId = [chantier1.id, chantier2.id];

        await prisma.chantier_territoire.createMany({
          data: [
            {
              id: chantier1.id,
              code_insee: "FR",
              maille: "NAT",
              zone_id: "FRANCE",
              territoire_code: "NAT-FR",
            },
            {
              id: chantier1.id,
              code_insee: "01",
              maille: "DEPT",
              zone_id: "D01",
              territoire_code: "DEPT-01",
            },
            {
              id: chantier2.id,
              code_insee: "01",
              maille: "DEPT",
              zone_id: "D01",
              territoire_code: "DEPT-01",
            },
            {
              id: chantier2.id,
              code_insee: "01",
              maille: "REG",
              zone_id: "R01",
              territoire_code: "REG-01",
            },
            {
              id: chantier3.id,
              code_insee: "01",
              maille: "DEPT",
              zone_id: "D01",
              territoire_code: "DEPT-01",
            },
          ],
        });

        const indicateur1 = await fixtures.indicateurIdentite({
          nom: "Un nom indicateur 1 OK baromètre",
          chantier_id: chantier1.id,
          type_id: "IMPACT",
          est_barometre: true,
          unite_mesure: "Pourcentage",
        });
        const indicateur2 = await fixtures.indicateurIdentite({
          nom: "Un nom indicateur 2 OK pondération et maille",
          chantier_id: chantier1.id,
          type_id: "IMPACT",
          est_barometre: false,
          unite_mesure: "Pourcentage",
        });
        const indicateur3 = await fixtures.indicateurIdentite({
          nom: "Un nom indicateur 3 OK pondération et maille",
          chantier_id: chantier2.id,
          type_id: "IMPACT",
          est_barometre: true,
          unite_mesure: "million habitant",
        });
        const indicateur4 = await fixtures.indicateurIdentite({
          nom: "Un nom indicateur 4 KO maille",
          chantier_id: chantier2.id,
          type_id: "IMPACT",
          est_barometre: false,
        });
        const indicateur5 = await fixtures.indicateurIdentite({
          nom: "Un nom indicateur 5 KO chantier id",
          chantier_id: chantier3.id,
          type_id: "IMPACT",
          est_barometre: true,
        });
        const indicateur6 = await fixtures.indicateurIdentite({
          nom: "Un nom indicateur 6 KO pas barometre pondération null",
          chantier_id: chantier3.id,
          type_id: "IMPACT",
          est_barometre: false,
        });
        const indicateur7 = await fixtures.indicateurIdentite({
          nom: "Un nom indicateur 7 KO pas barometre pondération 0",
          chantier_id: chantier3.id,
          type_id: "IMPACT",
          est_barometre: false,
        });

        await prisma.indicateur_territoire.createMany({
          data: [
            {
              id: indicateur1.id,
              chantier_id: chantier1.id,
              code_insee: "01",
              maille: "DEPT",
              zone_id: "D01",
              territoire_code: "DEPT-01",
              ponderation_zone_reel: null,
            },
            {
              id: indicateur2.id,
              chantier_id: chantier1.id,
              code_insee: "01",
              maille: "DEPT",
              zone_id: "D01",
              territoire_code: "DEPT-01",
              ponderation_zone_reel: 20,
            },
            {
              id: indicateur3.id,
              chantier_id: chantier2.id,
              code_insee: "01",
              maille: "DEPT",
              zone_id: "D01",
              territoire_code: "DEPT-01",
            },
            {
              id: indicateur4.id,
              chantier_id: chantier2.id,
              code_insee: "01",
              maille: "REG",
              zone_id: "R01",
              territoire_code: "REG-01",
              ponderation_zone_reel: 20,
            },
            {
              id: indicateur5.id,
              chantier_id: chantier3.id,
              code_insee: "01",
              maille: "DEPT",
              zone_id: "D01",
              territoire_code: "DEPT-01",
              ponderation_zone_reel: 20,
            },
            {
              id: indicateur6.id,
              chantier_id: chantier3.id,
              code_insee: "01",
              maille: "DEPT",
              zone_id: "D01",
              territoire_code: "DEPT-01",
              ponderation_zone_reel: null,
            },
            {
              id: indicateur7.id,
              chantier_id: chantier3.id,
              code_insee: "01",
              maille: "DEPT",
              zone_id: "D01",
              territoire_code: "DEPT-01",
              ponderation_zone_reel: 0,
            },
          ],
        });

        await prisma.indicateur_territoire_jalon.createMany({
          data: [
            {
              id: indicateur1.id,
              code_insee: "01",
              maille: "DEPT",
              zone_id: "D01",
              territoire_code: "DEPT-01",
              valeur_cible: 20,
              date_valeur_cible: new Date("2024-12-06"),
              taux_avancement: 13,
              date_valeur_actuelle: new Date("2021-01-01"),
              valeur_actuelle: 10.1,
              jalon: 2024,
            },
            {
              id: indicateur1.id,
              code_insee: "01",
              maille: "DEPT",
              zone_id: "D01",
              territoire_code: "DEPT-01",
              valeur_cible: 20,
              date_valeur_cible: new Date("2024-12-06"),
              taux_avancement: 13,
              date_valeur_actuelle: new Date("2025-01-01"),
              valeur_actuelle: 20.1,
              jalon: 2025,
            },
            {
              id: indicateur2.id,
              code_insee: "01",
              maille: "DEPT",
              zone_id: "D01",
              territoire_code: "DEPT-01",
              valeur_cible: 23.3,
              date_valeur_cible: new Date("2024-12-06"),
              taux_avancement: 13,
              date_valeur_actuelle: new Date("2023-02-04"),
              valeur_actuelle: 22.3,
              jalon: 2024,
            },
            {
              id: indicateur3.id,
              code_insee: "01",
              maille: "DEPT",
              zone_id: "D01",
              territoire_code: "DEPT-01",
              valeur_cible: 32.3,
              date_valeur_cible: new Date("2024-12-06"),
              taux_avancement: 13,
              date_valeur_actuelle: new Date("2022-08-02"),
              valeur_actuelle: 31.3,
              jalon: 2024,
            },
          ],
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererMapIndicateursParListeChantierIdEtTerritoire(
            { listeChantierId, maille, codeInsee, jalon: 2024 },
          );
        // Then
        expect([...result.keys()]).toIncludeSameMembers([
          chantier1.id,
          chantier2.id,
        ]);
        expect(result.get(chantier1.id)).toIncludeSameMembers([
          Indicateur.creerIndicateur({
            id: indicateur1.id,
            nom: "Un nom indicateur 1 OK baromètre",
            dateValeurAvancement: "2021-01-01T00:00:00.000Z",
            tauxAvancement: 13,
            valeurAvancement: 10.1,
            valeurCible: 20,
            uniteMesure: "Pourcentage",
          }),
          Indicateur.creerIndicateur({
            id: indicateur2.id,
            nom: "Un nom indicateur 2 OK pondération et maille",
            dateValeurAvancement: "2023-02-04T00:00:00.000Z",
            tauxAvancement: 13,
            valeurAvancement: 22.3,
            valeurCible: 23.3,
            uniteMesure: "Pourcentage",
          }),
        ]);
        expect(result.get(chantier2.id)).toEqual([
          Indicateur.creerIndicateur({
            id: indicateur3.id,
            nom: "Un nom indicateur 3 OK pondération et maille",
            dateValeurAvancement: "2022-08-02T00:00:00.000Z",
            tauxAvancement: 13,
            valeurAvancement: 31.3,
            valeurCible: 32.3,
            uniteMesure: "million habitant",
          }),
        ]);
      }),
    );

    it(
      "quand la maille est une région, doit récupérer les indicateurs associés à la liste des chantiers",
      createIntegrationTest(async () => {
        // Given
        const maille = "REG";
        const codeInsee = "01";

        const chantier1 = await fixtures.chantierIdentite({
          nom: "Un nom de chantier 1",
        });
        const chantier2 = await fixtures.chantierIdentite({
          nom: "Un nom de chantier 2",
        });
        const chantier3 = await fixtures.chantierIdentite({
          nom: "Un nom de chantier 3",
        });
        await fixtures.chantierIdentite({
          nom: "Un nom de chantier 4",
        });

        const listeChantierId = [chantier1.id, chantier2.id];

        await prisma.chantier_territoire.createMany({
          data: [
            {
              id: chantier1.id,
              code_insee: "FR",
              maille: "NAT",
              zone_id: "FRANCE",
              territoire_code: "NAT-FR",
            },
            {
              id: chantier1.id,
              code_insee: "01",
              maille: "REG",
              zone_id: "R01",
              territoire_code: "REG-01",
            },
            {
              id: chantier2.id,
              code_insee: "01",
              maille: "REG",
              zone_id: "R01",
              territoire_code: "REG-01",
            },
            {
              id: chantier2.id,
              code_insee: "01",
              maille: "DEPT",
              zone_id: "D01",
              territoire_code: "DEPT-01",
            },
            {
              id: chantier3.id,
              code_insee: "01",
              maille: "REG",
              zone_id: "R01",
              territoire_code: "REG-01",
            },
          ],
        });

        const indicateur1 = await fixtures.indicateurIdentite({
          nom: "Un nom indicateur 1 OK baromètre",
          chantier_id: chantier1.id,
          type_id: "IMPACT",
          est_barometre: true,
        });
        const indicateur2 = await fixtures.indicateurIdentite({
          nom: "Un nom indicateur 2 OK pondération et maille",
          chantier_id: chantier1.id,
          type_id: "IMPACT",
          est_barometre: false,
        });
        const indicateur3 = await fixtures.indicateurIdentite({
          nom: "Un nom indicateur 3 OK pondération et maille",
          chantier_id: chantier2.id,
          type_id: "IMPACT",
          est_barometre: true,
        });
        const indicateur4 = await fixtures.indicateurIdentite({
          nom: "Un nom indicateur 4 KO maille",
          chantier_id: chantier2.id,
          type_id: "IMPACT",
          est_barometre: false,
        });
        const indicateur5 = await fixtures.indicateurIdentite({
          nom: "Un nom indicateur 5 KO chantier id",
          chantier_id: chantier3.id,
          type_id: "IMPACT",
          est_barometre: true,
        });
        const indicateur6 = await fixtures.indicateurIdentite({
          nom: "Un nom indicateur 6 KO pas barometre pondération null",
          chantier_id: chantier3.id,
          type_id: "IMPACT",
          est_barometre: false,
        });
        const indicateur7 = await fixtures.indicateurIdentite({
          nom: "Un nom indicateur 7 KO pas barometre pondération 0",
          chantier_id: chantier3.id,
          type_id: "IMPACT",
          est_barometre: false,
        });

        await prisma.indicateur_territoire.createMany({
          data: [
            {
              id: indicateur1.id,
              chantier_id: chantier1.id,
              code_insee: "01",
              zone_id: "R01",
              maille: "REG",
              territoire_code: "REG-01",
              ponderation_zone_reel: null,
              date_valeur_actuelle_mandat: new Date("2021-01-01"),
            },
            {
              id: indicateur2.id,
              chantier_id: chantier1.id,
              code_insee: "01",
              maille: "REG",
              zone_id: "R01",
              territoire_code: "REG-01",
              ponderation_zone_reel: 20,
              date_valeur_actuelle_mandat: new Date("2023-02-04"),
            },
            {
              id: indicateur3.id,
              chantier_id: chantier2.id,
              code_insee: "01",
              maille: "REG",
              zone_id: "R01",
              territoire_code: "REG-01",
              ponderation_zone_reel: 20,
              date_valeur_actuelle_mandat: new Date("2022-08-02"),
            },
            {
              id: indicateur4.id,
              chantier_id: chantier2.id,
              code_insee: "01",
              zone_id: "D01",
              maille: "DEPT",
              territoire_code: "DEPT-01",
              ponderation_zone_reel: 20,
              date_valeur_actuelle_mandat: new Date("2022-08-02"),
            },
            {
              id: indicateur5.id,
              chantier_id: chantier3.id,
              code_insee: "01",
              maille: "REG",
              zone_id: "R01",
              territoire_code: "REG-01",
              ponderation_zone_reel: 20,
              date_valeur_actuelle_mandat: new Date("2022-08-02"),
            },
            {
              id: indicateur6.id,
              chantier_id: chantier3.id,
              code_insee: "01",
              maille: "REG",
              zone_id: "R01",
              territoire_code: "REG-01",
              ponderation_zone_reel: null,
              date_valeur_actuelle_mandat: new Date("2022-08-02"),
            },
            {
              id: indicateur7.id,
              chantier_id: chantier3.id,
              code_insee: "01",
              maille: "REG",
              zone_id: "R01",
              territoire_code: "REG-01",
              ponderation_zone_reel: 0,
              date_valeur_actuelle_mandat: new Date("2022-08-02"),
            },
          ],
        });

        await prisma.indicateur_territoire_jalon.createMany({
          data: [
            {
              id: indicateur1.id,
              code_insee: "01",
              maille: "REG",
              zone_id: "R01",
              territoire_code: "REG-01",
              valeur_cible: 20,
              date_valeur_cible: new Date("2024-12-06"),
              taux_avancement: 13,
              date_valeur_actuelle: new Date("2021-01-01"),
              valeur_actuelle: 10.1,
              jalon: 2024,
            },
            {
              id: indicateur1.id,
              code_insee: "01",
              maille: "REG",
              zone_id: "R01",
              territoire_code: "REG-01",
              valeur_cible: 20,
              date_valeur_cible: new Date("2024-12-06"),
              taux_avancement: 13,
              date_valeur_actuelle: new Date("2025-01-01"),
              valeur_actuelle: 20.1,
              jalon: 2025,
            },
            {
              id: indicateur2.id,
              code_insee: "01",
              maille: "REG",
              zone_id: "R01",
              territoire_code: "REG-01",
              valeur_cible: 20,
              date_valeur_cible: new Date("2024-12-06"),
              taux_avancement: 13,
              date_valeur_actuelle: new Date("2023-02-04"),
              valeur_actuelle: 22.3,
              jalon: 2024,
            },
            {
              id: indicateur3.id,
              code_insee: "01",
              maille: "REG",
              zone_id: "R01",
              territoire_code: "REG-01",
              valeur_cible: 20,
              date_valeur_cible: new Date("2024-12-06"),
              taux_avancement: 13,
              date_valeur_actuelle: new Date("2022-08-02"),
              valeur_actuelle: 31.3,
              jalon: 2024,
            },
          ],
        });

        const jalon = 2024;

        // When
        const result =
          await prismaIndicateurRepository.recupererMapIndicateursParListeChantierIdEtTerritoire(
            { listeChantierId, maille, codeInsee, jalon },
          );

        // Then
        expect([...result.keys()]).toIncludeSameMembers([
          chantier1.id,
          chantier2.id,
        ]);
        expect(
          result.get(chantier1.id)?.map(({ id, dateValeurAvancement }) => ({
            id,
            dateValeurAvancement,
          })),
        ).toIncludeSameMembers([
          {
            id: indicateur1.id,
            dateValeurAvancement: "2021-01-01T00:00:00.000Z",
          },
          {
            id: indicateur2.id,
            dateValeurAvancement: "2023-02-04T00:00:00.000Z",
          },
        ]);
        expect(
          result.get(chantier2.id)?.map(({ id, dateValeurAvancement }) => ({
            id,
            dateValeurAvancement,
          })),
        ).toEqual([
          {
            id: indicateur3.id,
            dateValeurAvancement: "2022-08-02T00:00:00.000Z",
          },
        ]);
      }),
    );
  });

  describe("recupererMapIndicateursNationalParListeIndicateurId", () => {
    it(
      "doit récupérer les indicateurs nationaux associés à la liste des chantiers",
      createIntegrationTest(async () => {
        // Given
        const chantier1 = await fixtures.chantierIdentite({
          nom: "Un nom de chantier 1",
        });
        const chantier2 = await fixtures.chantierIdentite({
          nom: "Un nom de chantier 2",
        });
        const chantier3 = await fixtures.chantierIdentite({
          nom: "Un nom de chantier 3",
        });

        await prisma.chantier_territoire.createMany({
          data: [
            {
              id: chantier1.id,
              code_insee: "FR",
              maille: "NAT",
              zone_id: "FRANCE",
              territoire_code: "NAT-FR",
            },
            {
              id: chantier1.id,
              code_insee: "01",
              maille: "DEPT",
              zone_id: "D01",
              territoire_code: "DEPT-01",
            },
            {
              id: chantier2.id,
              code_insee: "FR",
              maille: "NAT",
              zone_id: "FRANCE",
              territoire_code: "NAT-FR",
            },
            {
              id: chantier3.id,
              code_insee: "FR",
              maille: "NAT",
              zone_id: "FRANCE",
              territoire_code: "NAT-FR",
            },
          ],
        });

        const indicateur1 = await fixtures.indicateurIdentite({
          nom: "Un nom indicateur 1 KO pas NAT chantier 1",
          chantier_id: chantier1.id,
          type_id: "IMPACT",
        });
        const indicateur2 = await fixtures.indicateurIdentite({
          nom: "Un nom indicateur 3 OK chantier 2",
          chantier_id: chantier2.id,
          type_id: "IMPACT",
        });
        const indicateur3 = await fixtures.indicateurIdentite({
          nom: "Un nom indicateur 4 KO indic id",
          chantier_id: chantier3.id,
          type_id: "IMPACT",
        });

        const listeIndicateurId = [indicateur1.id, indicateur2.id];

        await prisma.indicateur_territoire.createMany({
          data: [
            {
              id: indicateur1.id,
              chantier_id: chantier1.id,
              code_insee: "01",
              maille: "DEPT",
              zone_id: "D01",
              territoire_code: "DEPT-01",
              taux_avancement_mandat: 9.2,
            },
            {
              id: indicateur1.id,
              chantier_id: chantier1.id,
              code_insee: "FR",
              maille: "NAT",
              zone_id: "FRANCE",
              territoire_code: "NAT-FR",
              taux_avancement_mandat: 10.2,
            },
            {
              id: indicateur2.id,
              chantier_id: chantier2.id,
              code_insee: "FR",
              maille: "NAT",
              zone_id: "FRANCE",
              territoire_code: "NAT-FR",
              taux_avancement_mandat: 11.2,
            },
            {
              id: indicateur3.id,
              chantier_id: chantier3.id,
              code_insee: "01",
              maille: "NAT",
              zone_id: "FRANCE",
              territoire_code: "NAT-FR",
              taux_avancement_mandat: 13.2,
            },
          ],
        });

        await prisma.indicateur_territoire_jalon.createMany({
          data: [
            {
              id: indicateur1.id,
              code_insee: "01",
              maille: "DEPT",
              zone_id: "D01",
              territoire_code: "DEPT-01",
              valeur_cible: 20,
              date_valeur_cible: new Date("2024-12-06"),
              taux_avancement: 13,
              date_valeur_actuelle: new Date("2021-01-01"),
              valeur_actuelle: 10.1,
              jalon: 2024,
            },
            {
              id: indicateur1.id,
              code_insee: "01",
              maille: "DEPT",
              zone_id: "D01",
              territoire_code: "DEPT-01",
              valeur_cible: 20,
              date_valeur_cible: new Date("2024-12-06"),
              taux_avancement: 13,
              date_valeur_actuelle: new Date("2025-01-01"),
              valeur_actuelle: 20.1,
              jalon: 2025,
            },
            {
              id: indicateur1.id,
              code_insee: "FR",
              maille: "NAT",
              zone_id: "FRANCE",
              territoire_code: "NAT-FR",
              valeur_cible: 20,
              date_valeur_cible: new Date("2024-12-06"),
              taux_avancement: 10.2,
              date_valeur_actuelle: new Date("2021-01-01"),
              valeur_actuelle: 10.1,
              jalon: 2024,
            },
            {
              id: indicateur1.id,
              code_insee: "FR",
              maille: "NAT",
              zone_id: "FRANCE",
              territoire_code: "NAT-FR",
              valeur_cible: 20,
              date_valeur_cible: new Date("2024-12-06"),
              taux_avancement: 13,
              date_valeur_actuelle: new Date("2025-01-01"),
              valeur_actuelle: 20.1,
              jalon: 2025,
            },
            {
              id: indicateur2.id,
              code_insee: "FR",
              maille: "NAT",
              zone_id: "FRANCE",
              territoire_code: "NAT-FR",
              valeur_cible: 20,
              date_valeur_cible: new Date("2024-12-06"),
              taux_avancement: 11.2,
              date_valeur_actuelle: new Date("2023-02-04"),
              valeur_actuelle: 22.3,
              jalon: 2024,
            },
            {
              id: indicateur3.id,
              code_insee: "FR",
              maille: "NAT",
              zone_id: "FRANCE",
              territoire_code: "NAT-FR",
              valeur_cible: 20,
              date_valeur_cible: new Date("2024-12-06"),
              taux_avancement: 13,
              date_valeur_actuelle: new Date("2022-08-02"),
              valeur_actuelle: 31.3,
              jalon: 2024,
            },
          ],
        });

        const jalon = 2024;

        // When
        const result =
          await prismaIndicateurRepository.recupererMapIndicateursNationalParListeIndicateurId(
            { listeIndicateurId, jalon },
          );

        // Then
        expect([...result.keys()]).toIncludeSameMembers([
          indicateur1.id,
          indicateur2.id,
        ]);
        expect(result.get(indicateur1.id)?.tauxAvancement).toEqual(10.2);

        expect(result.get(indicateur2.id)?.tauxAvancement).toEqual(11.2);
      }),
    );
  });
});
