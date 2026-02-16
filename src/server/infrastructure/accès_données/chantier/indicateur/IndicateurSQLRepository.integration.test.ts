import { Prisma } from "@prisma/client";
import IndicateurSQLRepository from "@/server/infrastructure/accès_données/chantier/indicateur/IndicateurSQLRepository";
import { EvenementValeurEnum } from "@/server/app/domain/EvenementValeurEnum";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("IndicateurSQLRepository", () => {
  let prismaIndicateurRepository: IndicateurSQLRepository;

  beforeEach(() => {
    prismaIndicateurRepository = new IndicateurSQLRepository();
  });

  describe("#récupérerGroupésParChantier", () => {
    it(
      "doit récupérer les détails des indicateurs regroupé par chantier",
      createIntegrationTest(async () => {
        // Given
        const chantier1 = await fixtures.chantierIdentite({ id: "CH-001" });
        const chantier2 = await fixtures.chantierIdentite({ id: "CH-002" });

        await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier1.id,
          type_id: "IMPACT",
          est_barometre: true,
          description: "Indicateur 1 chantier 1",
          source: "Une source indic 1",
          mode_de_calcul: "Un mode indic 1",
          unite_mesure: "mg",
          parent_id: null,
          periodicite: "10 jours",
          delai_disponibilite: 10,
          responsables_donnees_mails: ["john.doe@pilote.fr"],
        });
        await fixtures.indicateurIdentite({
          id: "IND-002",
          nom: "Indicateur 002",
          chantier_id: chantier2.id,
          type_id: "IMPACT",
          est_barometre: false,
          description: "Indicateur 2 chantier 2",
          source: "Une source indic 2",
          mode_de_calcul: "Un mode indic 2",
          unite_mesure: "kg",
          parent_id: "IND-001",
          periodicite: null,
          delai_disponibilite: null,
          responsables_donnees_mails: ["jane.doe@pilote.fr"],
        });
        // IND-003 est exclu du résultat car type_id est null (non IMPACT)
        await fixtures.indicateurIdentite({
          id: "IND-003",
          nom: "Indicateur 003",
          chantier_id: chantier2.id,
          type_id: null,
          est_barometre: true,
          description: "Indicateur 3 chantier 2",
          source: "Une source indic 3",
          mode_de_calcul: "Un mode indic 3",
          unite_mesure: "kg",
          parent_id: null,
          periodicite: null,
          delai_disponibilite: null,
          responsables_donnees_mails: ["john.doe@pilote.fr"],
        });

        // When
        const result =
          await prismaIndicateurRepository.récupérerGroupésParChantier([
            chantier1.id,
            chantier2.id,
          ]);

        // Then
        expect(result).toMatchObject({
          "CH-001": [
            {
              id: "IND-001",
              nom: "Indicateur 001",
              type: "IMPACT",
              estIndicateurDuBaromètre: true,
              description: "Indicateur 1 chantier 1",
              source: "Une source indic 1",
              modeDeCalcul: "Un mode indic 1",
              unité: "mg",
              parentId: null,
              periodicite: "10 jours",
              delaiDisponibilite: "10",
              responsablesDonneesMails: ["john.doe@pilote.fr"],
            },
          ],
          "CH-002": [
            {
              id: "IND-002",
              nom: "Indicateur 002",
              type: "IMPACT",
              estIndicateurDuBaromètre: false,
              description: "Indicateur 2 chantier 2",
              source: "Une source indic 2",
              modeDeCalcul: "Un mode indic 2",
              unité: "kg",
              parentId: "IND-001",
              periodicite: "Non renseignée",
              delaiDisponibilite: "Non renseignée",
              responsablesDonneesMails: ["jane.doe@pilote.fr"],
            },
          ],
        });
      }),
    );
  });

  describe("#récupérerDétailsGroupésParChantierEtParIndicateur", () => {
    it(
      "doit récupérer les détails des indicateurs groupés par chantier et par indicateur",
      createIntegrationTest(async () => {
        // Given
        const chantier1 = await fixtures.chantierIdentite({ id: "CH-001" });
        const chantier2 = await fixtures.chantierIdentite({ id: "CH-002" });
        const chantier3 = await fixtures.chantierIdentite({ id: "CH-003" });

        await fixtures.chantierTerritoire({
          id: chantier1.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });
        await fixtures.chantierTerritoire({
          id: chantier1.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });
        await fixtures.chantierTerritoire({
          id: chantier2.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });
        await fixtures.chantierTerritoire({
          id: chantier2.id,
          territoire_code: "DEPT-87",
          code_insee: "87",
          maille: "DEPT",
          zone_id: "D87",
        });
        await fixtures.chantierTerritoire({
          id: chantier2.id,
          territoire_code: "REG-01",
          code_insee: "01",
          maille: "REG",
          zone_id: "R01",
        });
        await fixtures.chantierTerritoire({
          id: chantier3.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });

        const indicateur1 = await fixtures.indicateurIdentite({
          id: "IND-001",
          chantier_id: chantier1.id,
          type_id: "IMPACT",
          unite_mesure: "kg",
        });
        const indicateur2 = await fixtures.indicateurIdentite({
          id: "IND-002",
          chantier_id: chantier2.id,
          type_id: "IMPACT",
          unite_mesure: "mg",
        });
        // IND-003 sans type_id (exclu des résultats)
        await fixtures.indicateurIdentite({
          id: "IND-003",
          chantier_id: chantier3.id,
          type_id: null,
        });
        // IND-004 n'a pas de territoire DEPT-01 (exclu des résultats)
        await fixtures.indicateurIdentite({
          id: "IND-004",
          chantier_id: chantier2.id,
          type_id: "IMPACT",
        });
        const indicateur5 = await fixtures.indicateurIdentite({
          id: "IND-005",
          chantier_id: chantier1.id,
          type_id: "IMPACT",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur1.id,
          chantier_id: chantier1.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });
        await fixtures.indicateurTerritoire({
          id: indicateur1.id,
          chantier_id: chantier1.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
          ponderation_zone_reel: 22,
          date_valeur_actuelle_mandat: new Date("2025-01-13"),
          date_valeur_cible_mandat: new Date("2025-01-13"),
          date_valeur_initiale: new Date("2025-01-13"),
          est_a_jour: false,
          est_applicable: true,
          evolution_avancement: [
            { date: new Date("2024-06-12") },
          ] as unknown as Prisma.JsonArray,
          prochaine_date_maj_jours: 50,
          prochaine_date_maj: new Date("2025-08-31"),
          prochaine_date_valeur_actuelle: new Date("2025-09-31"),
          tendance: "HAUSSE",
          valeur_actuelle_mandat: 10,
          valeur_cible_mandat: 11,
          valeur_initiale: 12,
        });
        await fixtures.indicateurTerritoire({
          id: indicateur2.id,
          chantier_id: chantier2.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
          date_valeur_actuelle_mandat: new Date("2025-01-13"),
          date_valeur_cible_mandat: new Date("2025-01-13"),
          date_valeur_initiale: new Date("2025-01-13"),
          est_a_jour: false,
          est_applicable: true,
          evolution_avancement: [
            { date: new Date("2024-06-12") },
          ] as unknown as Prisma.JsonArray,
          prochaine_date_maj_jours: 50,
          prochaine_date_maj: new Date("2025-08-31"),
          prochaine_date_valeur_actuelle: new Date("2025-09-31"),
          tendance: "HAUSSE",
          valeur_actuelle_mandat: 10,
          valeur_cible_mandat: 11,
          valeur_initiale: 12,
        });
        await fixtures.indicateurTerritoire({
          id: indicateur5.id,
          chantier_id: chantier1.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
          date_valeur_actuelle_mandat: new Date("2025-01-13"),
          date_valeur_cible_mandat: new Date("2025-01-13"),
          date_valeur_initiale: new Date("2025-01-13"),
          est_a_jour: false,
          est_applicable: true,
          evolution_avancement: [
            { date: new Date("2024-06-12") },
          ] as unknown as Prisma.JsonArray,
          prochaine_date_maj_jours: 50,
          prochaine_date_maj: new Date("2025-08-31"),
          prochaine_date_valeur_actuelle: new Date("2025-09-31"),
          tendance: "HAUSSE",
          valeur_actuelle_mandat: 10,
          valeur_cible_mandat: 11,
          valeur_initiale: 12,
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur1.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          valeur_cible: 20,
          date_valeur_cible: new Date("2024-12-06"),
          taux_avancement: 13,
          jalon: 2024,
        });
        await fixtures.indicateurTerritoireJalon({
          id: indicateur1.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          valeur_cible: 22,
          date_valeur_cible: new Date("2025-12-06"),
          taux_avancement: 13,
          jalon: 2025,
        });
        await fixtures.indicateurTerritoireJalon({
          id: indicateur1.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
          valeur_cible: 24,
          date_valeur_cible: new Date("2025-12-06"),
          taux_avancement: 13,
          jalon: 2025,
          date_valeur_actuelle: new Date("2025-01-13"),
          valeur_actuelle: 10,
        });
        await fixtures.indicateurTerritoireJalon({
          id: indicateur1.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
          valeur_cible: 22,
          date_valeur_cible: new Date("2024-12-06"),
          taux_avancement: 13,
          jalon: 2024,
        });
        await fixtures.indicateurTerritoireJalon({
          id: indicateur2.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
          valeur_cible: 24,
          date_valeur_cible: new Date("2025-12-06"),
          taux_avancement: 13,
          jalon: 2025,
          date_valeur_actuelle: new Date("2025-01-13"),
          valeur_actuelle: 10,
        });
        await fixtures.indicateurTerritoireJalon({
          id: indicateur2.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
          valeur_cible: 22,
          date_valeur_cible: new Date("2024-12-06"),
          taux_avancement: 13,
          jalon: 2024,
        });
        await fixtures.indicateurTerritoireJalon({
          id: indicateur5.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
          valeur_cible: 22,
          date_valeur_cible: new Date("2025-12-06"),
          taux_avancement: 13,
          jalon: 2025,
          date_valeur_actuelle: new Date("2025-01-13"),
          valeur_actuelle: 10,
        });

        // When
        const result =
          await prismaIndicateurRepository.récupérerDétailsGroupésParChantierEtParIndicateur(
            [chantier1.id, chantier2.id],
            "departementale",
            "01",
            2025,
            new Date(),
          );

        // Then
        expect(result).toMatchObject({
          "CH-001": {
            "IND-001": {
              "DEPT-01": {
                avancement: {
                  annuel: 13,
                  global: null,
                },
                codeInsee: "01",
                dateImport: null,
                dateValeurAvancement: new Date("2025-01-13").toISOString(),
                dateValeurCible: new Date("2025-01-13").toISOString(),
                dateValeurCibleAnnuelle: new Date("2025-12-06").toISOString(),
                dateValeurInitiale: new Date("2025-01-13").toISOString(),
                estAJour: false,
                estApplicable: true,
                historiquesValeurs: [
                  {
                    date: new Date("2024-06-12").toISOString(),
                  },
                ],
                ponderation: 22,
                prochaineDateMaj: new Date("2025-08-31").toISOString(),
                prochaineDateMajJours: 50,
                prochaineDateValeurAvancement: new Date(
                  "2025-09-31",
                ).toISOString(),
                proposition: null,
                tendance: "HAUSSE",
                unite: "kg",
                valeurAvancement: 10,
                valeurCible: 11,
                valeurCibleAnnuelle: 24,
                valeurInitiale: 12,
              },
            },
            "IND-005": {
              "DEPT-01": {
                avancement: {
                  annuel: 13,
                  global: null,
                },
                codeInsee: "01",
                dateImport: null,
                dateValeurAvancement: new Date("2025-01-13").toISOString(),
                dateValeurCible: new Date("2025-01-13").toISOString(),
                dateValeurCibleAnnuelle: new Date("2025-12-06").toISOString(),
                dateValeurInitiale: new Date("2025-01-13").toISOString(),
                estAJour: false,
                estApplicable: true,
                historiquesValeurs: [
                  {
                    date: new Date("2024-06-12").toISOString(),
                  },
                ],
                ponderation: null,
                prochaineDateMaj: new Date("2025-08-31").toISOString(),
                prochaineDateMajJours: 50,
                prochaineDateValeurAvancement: new Date(
                  "2025-09-31",
                ).toISOString(),
                proposition: null,
                tendance: "HAUSSE",
                unite: null,
                valeurAvancement: 10,
                valeurCible: 11,
                valeurCibleAnnuelle: 22,
                valeurInitiale: 12,
              },
            },
          },
          "CH-002": {
            "IND-002": {
              "DEPT-01": {
                avancement: {
                  annuel: 13,
                  global: null,
                },
                codeInsee: "01",
                dateImport: null,
                dateValeurAvancement: new Date("2025-01-13").toISOString(),
                dateValeurCible: new Date("2025-01-13").toISOString(),
                dateValeurCibleAnnuelle: new Date("2025-12-06").toISOString(),
                dateValeurInitiale: new Date("2025-01-13").toISOString(),
                estAJour: false,
                estApplicable: true,
                historiquesValeurs: [
                  {
                    date: new Date("2024-06-12").toISOString(),
                  },
                ],
                ponderation: null,
                prochaineDateMaj: new Date("2025-08-31").toISOString(),
                prochaineDateMajJours: 50,
                prochaineDateValeurAvancement: new Date(
                  "2025-09-31",
                ).toISOString(),
                proposition: null,
                tendance: "HAUSSE",
                unite: "mg",
                valeurAvancement: 10,
                valeurCible: 11,
                valeurCibleAnnuelle: 24,
                valeurInitiale: 12,
              },
            },
          },
        });
      }),
    );

    it(
      "doit calculer la dateImport à partir des événements VALEUR_CREEE et VALEUR_MODIFIEE",
      createIntegrationTest(async () => {
        // Given
        const chantier = await fixtures.chantierIdentite({ id: "CH-001" });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-02",
          code_insee: "02",
          maille: "DEPT",
          zone_id: "D02",
        });

        const indicateur1 = await fixtures.indicateurIdentite({
          id: "IND-001",
          chantier_id: chantier.id,
          type_id: "IMPACT",
        });
        const indicateur2 = await fixtures.indicateurIdentite({
          id: "IND-002",
          chantier_id: chantier.id,
          type_id: "IMPACT",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur1.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
          evolution_avancement: [] as unknown as Prisma.JsonArray,
        });
        await fixtures.indicateurTerritoire({
          id: indicateur2.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-02",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
          evolution_avancement: [] as unknown as Prisma.JsonArray,
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur1.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
          jalon: 2025,
        });
        await fixtures.indicateurTerritoireJalon({
          id: indicateur2.id,
          territoire_code: "DEPT-02",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
          jalon: 2025,
        });

        const utilisateur = await fixtures.utilisateur();

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur1.id,
          territoire_code: "DEPT-01",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          date_creation: new Date("2026-01-05T10:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
          valeur: 10,
          date_valeur: new Date("2026-01-05"),
          ordre: 1,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur1.id,
          territoire_code: "DEPT-01",
          type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
          date_creation: new Date("2026-01-15T10:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
          valeur: 15,
          date_valeur: new Date("2026-01-15"),
          ordre: 2,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur2.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          date_creation: new Date("2026-01-20T10:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
          valeur: 20,
          date_valeur: new Date("2026-01-20"),
          ordre: 1,
        });
        // Cet événement est après dateDerniereExecutionDatajobs, donc ignoré
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur1.id,
          territoire_code: "DEPT-01",
          type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
          date_creation: new Date("2026-02-10T10:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
          valeur: 25,
          date_valeur: new Date("2026-02-10"),
          ordre: 3,
        });

        const dateDerniereExecutionDatajobs = new Date(
          "2026-02-01T00:00:00.000Z",
        );

        // When
        const result =
          await prismaIndicateurRepository.récupérerDétailsGroupésParChantierEtParIndicateur(
            [chantier.id],
            "departementale",
            "01",
            2025,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["CH-001"]["IND-001"]["DEPT-01"].dateImport).toEqual(
          new Date("2026-01-15T10:00:00.000Z").toISOString(),
        );
        expect(result["CH-001"]["IND-002"]["DEPT-02"].dateImport).toEqual(
          new Date("2026-01-20T10:00:00.000Z").toISOString(),
        );
      }),
    );

    it(
      "pour maille NAT avec va_nat_from=REG, calcule dateImport à partir des événements REG",
      createIntegrationTest(async () => {
        // Given
        const chantier = await fixtures.chantierIdentite({ id: "CH-001" });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "REG-84",
          code_insee: "84",
          maille: "REG",
          zone_id: "R84",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          chantier_id: chantier.id,
          type_id: "IMPACT",
        });

        await fixtures.metadataParametrageIndicateurs({
          indic_id: indicateur.id,
          va_nat_from: "REG",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          evolution_avancement: [] as unknown as Prisma.JsonArray,
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "REG-84",
          code_insee: "84",
          maille: "REG",
          zone_id: "R84",
          evolution_avancement: [] as unknown as Prisma.JsonArray,
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
        });

        const utilisateur = await fixtures.utilisateur();

        // Événement NAT-FR (ne doit pas être utilisé car va_nat_from=REG)
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          date_creation: new Date("2026-01-01T10:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
          valeur: 10,
          date_valeur: new Date("2026-01-01"),
          ordre: 1,
        });

        // Événement REG-84 (doit être utilisé)
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "REG-84",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          date_creation: new Date("2026-01-20T10:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
          valeur: 15,
          date_valeur: new Date("2026-01-20"),
          ordre: 1,
        });

        const dateDerniereExecutionDatajobs = new Date(
          "2026-02-01T00:00:00.000Z",
        );

        // When
        const result =
          await prismaIndicateurRepository.récupérerDétailsGroupésParChantierEtParIndicateur(
            [chantier.id],
            "nationale",
            "FR",
            2025,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["CH-001"]["IND-001"]["NAT-FR"].dateImport).toEqual(
          new Date("2026-01-20T10:00:00.000Z").toISOString(),
        );
      }),
    );

    it(
      "pour maille REG avec va_reg_from=DEPT, calcule dateImport à partir des événements des départements enfants",
      createIntegrationTest(async () => {
        // Given
        const chantier = await fixtures.chantierIdentite({ id: "CH-001" });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "REG-84",
          code_insee: "84",
          maille: "REG",
          zone_id: "R84",
        });
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-69",
          code_insee: "69",
          maille: "DEPT",
          zone_id: "D69",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          chantier_id: chantier.id,
          type_id: "IMPACT",
        });

        await fixtures.metadataParametrageIndicateurs({
          indic_id: indicateur.id,
          va_reg_from: "DEPT",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "REG-84",
          code_insee: "84",
          maille: "REG",
          zone_id: "R84",
          evolution_avancement: [] as unknown as Prisma.JsonArray,
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-69",
          code_insee: "69",
          maille: "DEPT",
          zone_id: "D69",
          evolution_avancement: [] as unknown as Prisma.JsonArray,
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "REG-84",
          code_insee: "84",
          maille: "REG",
          zone_id: "R84",
          jalon: 2025,
        });

        const utilisateur = await fixtures.utilisateur();

        // Événement REG-84 (ne doit pas être utilisé car va_reg_from=DEPT)
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "REG-84",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          date_creation: new Date("2026-01-01T10:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
          valeur: 10,
          date_valeur: new Date("2026-01-01"),
          ordre: 1,
        });

        // Événement DEPT-13 (doit être utilisé)
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-69",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          date_creation: new Date("2026-01-25T10:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
          valeur: 15,
          date_valeur: new Date("2026-01-25"),
          ordre: 1,
        });

        const dateDerniereExecutionDatajobs = new Date(
          "2026-02-01T00:00:00.000Z",
        );

        // When
        const result =
          await prismaIndicateurRepository.récupérerDétailsGroupésParChantierEtParIndicateur(
            [chantier.id],
            "regionale",
            "84",
            2025,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["CH-001"]["IND-001"]["REG-84"].dateImport).toEqual(
          new Date("2026-01-25T10:00:00.000Z").toISOString(),
        );
      }),
    );
  });

  describe("#récupérerParChantierId", () => {
    it(
      "doit récupérer les détails des indicateurs regroupé par chantier",
      createIntegrationTest(async () => {
        // Given
        const chantier1 = await fixtures.chantierIdentite({ id: "CH-001" });
        const chantier2 = await fixtures.chantierIdentite({ id: "CH-002" });

        await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier1.id,
          type_id: "IMPACT",
          est_barometre: true,
          description: "Indicateur 1 chantier 1",
          source: "Une source indic 1",
          mode_de_calcul: "Un mode indic 1",
          unite_mesure: "mg",
          parent_id: null,
          periodicite: "10 jours",
          delai_disponibilite: 10,
          responsables_donnees_mails: ["john.doe@pilote.fr"],
        });
        // IND-002 appartient à CH-002, donc exclu du résultat
        await fixtures.indicateurIdentite({
          id: "IND-002",
          nom: "Indicateur 002",
          chantier_id: chantier2.id,
          type_id: "IMPACT",
          est_barometre: false,
          description: "Indicateur 2 chantier 2",
          source: "Une source indic 2",
          mode_de_calcul: "Un mode indic 2",
          unite_mesure: "kg",
          parent_id: "IND-001",
          periodicite: null,
          delai_disponibilite: null,
          responsables_donnees_mails: ["jane.doe@pilote.fr"],
        });
        // IND-003 sans type_id (exclu du résultat)
        await fixtures.indicateurIdentite({
          id: "IND-003",
          nom: "Indicateur 003",
          chantier_id: chantier2.id,
          type_id: null,
          est_barometre: true,
          description: "Indicateur 3 chantier 2",
          source: "Une source indic 3",
          mode_de_calcul: "Un mode indic 3",
          unite_mesure: "kg",
          parent_id: null,
          periodicite: null,
          delai_disponibilite: null,
          responsables_donnees_mails: ["john.doe@pilote.fr"],
        });
        await fixtures.indicateurIdentite({
          id: "IND-004",
          nom: "Indicateur 004",
          chantier_id: chantier1.id,
          type_id: "IMPACT",
          est_barometre: true,
          description: "Indicateur 4 chantier 1",
          source: "Une source indic 4",
          mode_de_calcul: "Un mode indic 4",
          unite_mesure: "mg",
          parent_id: null,
          periodicite: "10 jours",
          delai_disponibilite: 10,
          responsables_donnees_mails: ["john.doe@pilote.fr"],
        });

        // When
        const result = await prismaIndicateurRepository.récupérerParChantierId(
          chantier1.id,
        );

        // Then
        expect(result).toMatchObject([
          {
            id: "IND-001",
            nom: "Indicateur 001",
            type: "IMPACT",
            estIndicateurDuBaromètre: true,
            description: "Indicateur 1 chantier 1",
            source: "Une source indic 1",
            modeDeCalcul: "Un mode indic 1",
            unité: "mg",
            parentId: null,
            periodicite: "10 jours",
            delaiDisponibilite: "10",
            responsablesDonneesMails: ["john.doe@pilote.fr"],
          },
          {
            id: "IND-004",
            nom: "Indicateur 004",
            type: "IMPACT",
            estIndicateurDuBaromètre: true,
            description: "Indicateur 4 chantier 1",
            source: "Une source indic 4",
            modeDeCalcul: "Un mode indic 4",
            unité: "mg",
            parentId: null,
            periodicite: "10 jours",
            delaiDisponibilite: "10",
            responsablesDonneesMails: ["john.doe@pilote.fr"],
          },
        ]);
      }),
    );
  });

  describe("#recupererListeIndicateursPrisEnCompteDansCalculAvancementSurAuMoinsUnTerritoire", () => {
    it(
      "doit récupérer l'id des indicateurs qui font partis de la liste des chantiers et qui ont une pondération supérieur à 0 sur au moins un territoire",
      createIntegrationTest(async () => {
        // Given
        const chantier1 = await fixtures.chantierIdentite({ id: "CH-001" });
        const chantier2 = await fixtures.chantierIdentite({ id: "CH-002" });

        await fixtures.chantierTerritoire({
          id: chantier1.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });
        await fixtures.chantierTerritoire({
          id: chantier1.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });
        await fixtures.chantierTerritoire({
          id: chantier2.id,
          territoire_code: "NAT-FR",
          code_insee: "87",
          maille: "NAT",
          zone_id: "FRANCE",
        });

        // IND-001 a ponderation=0 sur tous les territoires, donc exclu
        const indicateur1 = await fixtures.indicateurIdentite({
          id: "IND-001",
          chantier_id: chantier1.id,
        });
        // IND-002 appartient à CH-002 (non dans la liste des chantiers demandés)
        const indicateur2 = await fixtures.indicateurIdentite({
          id: "IND-002",
          chantier_id: chantier2.id,
        });
        // IND-003 a ponderation>0 sur DEPT-01, donc inclus
        const indicateur3 = await fixtures.indicateurIdentite({
          id: "IND-003",
          chantier_id: chantier1.id,
        });

        await fixtures.indicateurTerritoire({
          id: indicateur1.id,
          chantier_id: chantier1.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          ponderation_zone_reel: 0,
        });
        await fixtures.indicateurTerritoire({
          id: indicateur2.id,
          chantier_id: chantier2.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          ponderation_zone_reel: 10,
        });
        await fixtures.indicateurTerritoire({
          id: indicateur3.id,
          chantier_id: chantier1.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          ponderation_zone_reel: 0,
        });
        await fixtures.indicateurTerritoire({
          id: indicateur3.id,
          chantier_id: chantier1.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
          ponderation_zone_reel: 10,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererListeIndicateursPrisEnCompteDansCalculAvancementSurAuMoinsUnTerritoire(
            [chantier1.id],
          );

        // Then
        expect(result).toEqual(["IND-003"]);
      }),
    );
  });
});
