import { Prisma } from "@prisma/client";
import IndicateurSQLRepository from "@/server/infrastructure/accès_données/chantier/indicateur/IndicateurSQLRepository";
import { prisma } from "@/server/db/prisma";

describe("IndicateurSQLRepository", () => {
  let prismaIndicateurRepository: IndicateurSQLRepository;

  beforeEach(() => {
    prismaIndicateurRepository = new IndicateurSQLRepository();
  });

  describe("#récupérerGroupésParChantier", () => {
    it("doit récupérer les détails des indicateurs regroupé par chantier", async () => {
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
        ],
      });
      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: "CH-001",
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
          },
          {
            id: "IND-002",
            nom: "Indicateur 002",
            chantier_id: "CH-002",
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
          },
          {
            id: "IND-003",
            nom: "Indicateur 003",
            chantier_id: "CH-002",
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
          },
        ],
      });
      // When
      const result =
        await prismaIndicateurRepository.récupérerGroupésParChantier([
          "CH-001",
          "CH-002",
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
    });
  });

  describe("#récupérerDétailsGroupésParChantierEtParIndicateur", () => {
    it("doit récupérer les détails des indicateurs groupés par chantier et par indicateur", async () => {
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
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            territoire_code: "NAT-FR",
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
            maille: "DEPT",
            zone_id: "D01",
            territoire_code: "DEPT-01",
          },
          {
            id: "CH-002",
            code_insee: "87",
            maille: "DEPT",
            zone_id: "D87",
            territoire_code: "DEPT-87",
          },
          {
            id: "CH-002",
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

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: "CH-001",
            dernier_import_date_indic: new Date("2026-01-12"),
            type_id: "IMPACT",
            unite_mesure: "kg",
          },
          {
            id: "IND-002",
            nom: "Indicateur 002",
            chantier_id: "CH-002",
            dernier_import_date_indic: new Date("2026-01-13"),
            unite_mesure: "mg",
            type_id: "IMPACT",
          },
          {
            id: "IND-003",
            nom: "Indicateur 003",
            chantier_id: "CH-003",
          },
          {
            id: "IND-004",
            nom: "Indicateur 004",
            chantier_id: "CH-002",
            type_id: "IMPACT",
          },
          {
            id: "IND-005",
            nom: "Indicateur 005",
            chantier_id: "CH-001",
            type_id: "IMPACT",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: "CH-001",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            territoire_code: "NAT-FR",
          },
          {
            id: "IND-001",
            chantier_id: "CH-001",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
            territoire_code: "DEPT-01",
            ponderation_zone_reel: 22,
            date_valeur_actuelle_mandat: new Date("2025-01-13"),
            date_valeur_cible_mandat: new Date("2025-01-13"),
            date_valeur_initiale: new Date("2025-01-13"),
            est_a_jour: false,
            est_applicable: true,
            evolution_valeur_actuelle: [
              { date: new Date("2024-06-12") },
            ] as unknown as Prisma.JsonArray,
            prochaine_date_maj_jours: 50,
            prochaine_date_maj: new Date("2025-08-31"),
            prochaine_date_valeur_actuelle: new Date("2025-09-31"),
            tendance: "HAUSSE",
            valeur_actuelle_mandat: 10,
            valeur_cible_mandat: 11,
            valeur_initiale: 12,
          },
          {
            id: "IND-002",
            chantier_id: "CH-002",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
            territoire_code: "DEPT-01",
            date_valeur_actuelle_mandat: new Date("2025-01-13"),
            date_valeur_cible_mandat: new Date("2025-01-13"),
            date_valeur_initiale: new Date("2025-01-13"),
            est_a_jour: false,
            est_applicable: true,
            evolution_valeur_actuelle: [
              { date: new Date("2024-06-12") },
            ] as unknown as Prisma.JsonArray,
            prochaine_date_maj_jours: 50,
            prochaine_date_maj: new Date("2025-08-31"),
            prochaine_date_valeur_actuelle: new Date("2025-09-31"),
            tendance: "HAUSSE",
            valeur_actuelle_mandat: 10,
            valeur_cible_mandat: 11,
            valeur_initiale: 12,
          },
          {
            id: "IND-003",
            chantier_id: "CH-003",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
            territoire_code: "DEPT-01",
          },
          {
            id: "IND-005",
            chantier_id: "CH-001",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
            territoire_code: "DEPT-01",
            date_valeur_actuelle_mandat: new Date("2025-01-13"),
            date_valeur_cible_mandat: new Date("2025-01-13"),
            date_valeur_initiale: new Date("2025-01-13"),
            est_a_jour: false,
            est_applicable: true,
            evolution_valeur_actuelle: [
              { date: new Date("2024-06-12") },
            ] as unknown as Prisma.JsonArray,
            prochaine_date_maj_jours: 50,
            prochaine_date_maj: new Date("2025-08-31"),
            prochaine_date_valeur_actuelle: new Date("2025-09-31"),
            tendance: "HAUSSE",
            valeur_actuelle_mandat: 10,
            valeur_cible_mandat: 11,
            valeur_initiale: 12,
          },
        ],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [
          {
            id: "IND-001",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            territoire_code: "NAT-FR",
            valeur_cible: 20,
            date_valeur_cible: new Date("2024-12-06"),
            taux_avancement: 13,
            jalon: 2024,
          },
          {
            id: "IND-001",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            territoire_code: "NAT-FR",
            valeur_cible: 22,
            date_valeur_cible: new Date("2025-12-06"),
            taux_avancement: 13,
            jalon: 2025,
          },
          {
            id: "IND-001",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
            territoire_code: "DEPT-01",
            valeur_cible: 24,
            date_valeur_cible: new Date("2025-12-06"),
            taux_avancement: 13,
            jalon: 2025,
            date_valeur_actuelle: new Date("2025-01-13"),
            valeur_actuelle: 10,
          },
          {
            id: "IND-001",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
            territoire_code: "DEPT-01",
            valeur_cible: 22,
            date_valeur_cible: new Date("2024-12-06"),
            taux_avancement: 13,
            jalon: 2024,
          },
          {
            id: "IND-002",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
            territoire_code: "DEPT-01",
            valeur_cible: 24,
            date_valeur_cible: new Date("2025-12-06"),
            taux_avancement: 13,
            jalon: 2025,
            date_valeur_actuelle: new Date("2025-01-13"),
            valeur_actuelle: 10,
          },
          {
            id: "IND-002",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
            territoire_code: "DEPT-01",
            valeur_cible: 22,
            date_valeur_cible: new Date("2024-12-06"),
            taux_avancement: 13,
            jalon: 2024,
          },
          {
            id: "IND-003",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
            territoire_code: "DEPT-01",
            valeur_cible: 24,
            date_valeur_cible: new Date("2025-12-06"),
            taux_avancement: 13,
            jalon: 2025,
          },
          {
            id: "IND-003",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
            territoire_code: "DEPT-01",
            valeur_cible: 22,
            date_valeur_cible: new Date("2024-12-06"),
            taux_avancement: 13,
            jalon: 2024,
          },
          {
            id: "IND-005",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
            territoire_code: "DEPT-01",
            valeur_cible: 22,
            date_valeur_cible: new Date("2025-12-06"),
            taux_avancement: 13,
            jalon: 2025,
            date_valeur_actuelle: new Date("2025-01-13"),
            valeur_actuelle: 10,
          },
        ],
      });

      const jalon = 2025;

      // When
      const result =
        await prismaIndicateurRepository.récupérerDétailsGroupésParChantierEtParIndicateur(
          ["CH-001", "CH-002"],
          "departementale",
          "01",
          jalon,
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
              dateImport: new Date("2026-01-12").toISOString(),
              dateValeurAvancement: new Date("2025-01-13").toISOString(),
              dateValeurCible: new Date("2025-01-13").toISOString(),
              dateValeurCibleAnnuelle: new Date("2025-12-06").toISOString(),
              dateValeurInitiale: new Date("2025-01-13").toISOString(),
              estAJour: false,
              est_applicable: true,
              historiquesValeurs: [
                {
                  date: new Date("2024-06-12").toISOString(),
                },
              ],
              pondération: 22,
              prochaineDateMaj: new Date("2025-08-31").toISOString(),
              prochaineDateMajJours: 50,
              prochaineDateValeurAvancement: new Date(
                "2025-09-31",
              ).toISOString(),
              proposition: null,
              tendance: "HAUSSE",
              unité: "kg",
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
              est_applicable: true,
              historiquesValeurs: [
                {
                  date: new Date("2024-06-12").toISOString(),
                },
              ],
              pondération: null,
              prochaineDateMaj: new Date("2025-08-31").toISOString(),
              prochaineDateMajJours: 50,
              prochaineDateValeurAvancement: new Date(
                "2025-09-31",
              ).toISOString(),
              proposition: null,
              tendance: "HAUSSE",
              unité: null,
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
              dateImport: new Date("2026-01-13").toISOString(),
              dateValeurAvancement: new Date("2025-01-13").toISOString(),
              dateValeurCible: new Date("2025-01-13").toISOString(),
              dateValeurCibleAnnuelle: new Date("2025-12-06").toISOString(),
              dateValeurInitiale: new Date("2025-01-13").toISOString(),
              estAJour: false,
              est_applicable: true,
              historiquesValeurs: [
                {
                  date: new Date("2024-06-12").toISOString(),
                },
              ],
              pondération: null,
              prochaineDateMaj: new Date("2025-08-31").toISOString(),
              prochaineDateMajJours: 50,
              prochaineDateValeurAvancement: new Date(
                "2025-09-31",
              ).toISOString(),
              proposition: null,
              tendance: "HAUSSE",
              unité: "mg",
              valeurAvancement: 10,
              valeurCible: 11,
              valeurCibleAnnuelle: 24,
              valeurInitiale: 12,
            },
          },
        },
      });
    });
  });

  describe("#récupérerParChantierId", () => {
    it("doit récupérer les détails des indicateurs regroupé par chantier", async () => {
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
        ],
      });
      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: "CH-001",
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
          },
          {
            id: "IND-002",
            nom: "Indicateur 002",
            chantier_id: "CH-002",
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
          },
          {
            id: "IND-003",
            nom: "Indicateur 003",
            chantier_id: "CH-002",
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
          },
          {
            id: "IND-004",
            nom: "Indicateur 004",
            chantier_id: "CH-001",
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
          },
        ],
      });
      // When
      const result =
        await prismaIndicateurRepository.récupérerParChantierId("CH-001");

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
    });
  });

  describe("#recupererListeIndicateursPrisEnCompteDansCalculAvancementSurAuMoinsUnTerritoire", () => {
    it("doit récupérer l'id des indicateurs qui font partis de la liste des chantiers et qui ont une pondération supérieur à 0 sur au moins un territoire", async () => {
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
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            territoire_code: "NAT-FR",
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
            code_insee: "87",
            maille: "NAT",
            zone_id: "FRANCE",
            territoire_code: "NAT-FR",
          },
        ],
      });
      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: "CH-001",
          },
          {
            id: "IND-002",
            nom: "Indicateur 002",
            chantier_id: "CH-002",
          },
          {
            id: "IND-003",
            nom: "Indicateur 003",
            chantier_id: "CH-001",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: "CH-001",
            territoire_code: "NAT-FR",
            maille: "NAT",
            code_insee: "FR",
            zone_id: "FRANCE",
            ponderation_zone_reel: 0,
          },
          {
            id: "IND-002",
            chantier_id: "CH-002",
            territoire_code: "NAT-FR",
            maille: "NAT",
            code_insee: "FR",
            zone_id: "FRANCE",
            ponderation_zone_reel: 10,
          },
          {
            id: "IND-003",
            chantier_id: "CH-001",
            territoire_code: "NAT-FR",
            maille: "NAT",
            code_insee: "FR",
            zone_id: "FRANCE",
            ponderation_zone_reel: 0,
          },
          {
            id: "IND-003",
            chantier_id: "CH-001",
            territoire_code: "DEPT-01",
            maille: "DEPT",
            code_insee: "01",
            zone_id: "D01",
            ponderation_zone_reel: 10,
          },
        ],
      });

      // When
      const result =
        await prismaIndicateurRepository.recupererListeIndicateursPrisEnCompteDansCalculAvancementSurAuMoinsUnTerritoire(
          ["CH-001"],
        );
      // Then
      expect(result).toEqual(["IND-003"]);
    });
  });
});
