import { $Enums } from "@prisma/client";
import { PrismaIndicateurRepository } from "@/server/chantiers/infrastructure/adapters/PrismaIndicateurRepository";
import { EvenementValeurEnum } from "@/server/app/domain/EvenementValeurEnum";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("PrismaIndicateurRepository", () => {
  const dateDerniereExecutionDatajobs = new Date("2026-02-12T00:00:00.000Z");
  let prismaIndicateurRepository: PrismaIndicateurRepository;

  beforeEach(() => {
    prismaIndicateurRepository = new PrismaIndicateurRepository();
  });

  describe("#listerParIndicId", () => {
    it(
      "doit récupérer les données associés à l'indicateur",
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
          territoire_code: "REG-01",
          code_insee: "FR",
          maille: "REG",
          zone_id: "R51",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          chantier_id: chantier.id,
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          ponderation_zone_reel: 20,
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "REG-01",
          code_insee: "01",
          maille: "REG",
          zone_id: "R51",
          ponderation_zone_reel: 20,
        });

        // Jalon 2024 pour NAT-FR uniquement
        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          valeur_cible: 20,
          date_valeur_cible: new Date("2024-12-06"),
          taux_avancement: 13,
          valeur_actuelle: 20,
          date_valeur_actuelle: new Date("2024-12-06"),
          jalon: 2024,
        });
        // Jalon 2025 pour NAT-FR
        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          valeur_cible: 22,
          date_valeur_cible: new Date("2025-12-06"),
          taux_avancement: 13,
          valeur_actuelle: 25,
          date_valeur_actuelle: new Date("2025-12-06"),
          jalon: 2025,
        });
        // Jalon 2025 pour REG-01
        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "REG-01",
          code_insee: "01",
          maille: "REG",
          zone_id: "D51",
          valeur_cible: 22,
          date_valeur_cible: new Date("2025-12-06"),
          taux_avancement: 13,
          valeur_actuelle: 30,
          date_valeur_actuelle: new Date("2025-12-06"),
          jalon: 2025,
        });

        // When
        const result = await prismaIndicateurRepository.listerParIndicId({
          indicId: indicateur.id,
          jalon: 2025,
        });

        // Then
        expect(result).toEqual([
          expect.objectContaining({
            indicId: "IND-001",
            territoireCode: "NAT-FR",
            valeurCibleAnnuelle: 22,
            tauxAvancementAnnuel: 13,
            valeurAvancement: 25,
          }),
          expect.objectContaining({
            indicId: "IND-001",
            territoireCode: "REG-01",
            valeurAvancement: 30,
          }),
        ]);
        expect(result[0].dateValeurCibleAnnuelle?.toISOString()).toStartWith(
          "2025-12-06",
        );
        expect(result[0].dateValeurAvancement?.toISOString()).toStartWith(
          "2025-12-06",
        );
        expect(result[1].dateValeurAvancement?.toISOString()).toStartWith(
          "2025-12-06",
        );
      }),
    );

    it(
      "quand on donne un jalon, doit récupérer les données associés à l'indicateur",
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
          territoire_code: "REG-01",
          code_insee: "FR",
          maille: "REG",
          zone_id: "R51",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          chantier_id: chantier.id,
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          ponderation_zone_reel: 20,
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "REG-01",
          code_insee: "01",
          maille: "REG",
          zone_id: "R51",
          ponderation_zone_reel: 20,
        });

        // Jalon 2024 pour NAT-FR uniquement
        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          valeur_cible: 20,
          date_valeur_cible: new Date("2024-12-06"),
          taux_avancement: 13,
          valeur_actuelle: 20,
          date_valeur_actuelle: new Date("2024-12-06"),
          jalon: 2024,
        });
        // Jalon 2025 pour NAT-FR
        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          valeur_cible: 22,
          date_valeur_cible: new Date("2025-12-06"),
          taux_avancement: 13,
          valeur_actuelle: 25,
          date_valeur_actuelle: new Date("2025-12-06"),
          jalon: 2025,
        });
        // Jalon 2025 pour REG-01
        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "REG-01",
          code_insee: "01",
          maille: "REG",
          zone_id: "D51",
          valeur_cible: 22,
          date_valeur_cible: new Date("2025-12-06"),
          taux_avancement: 13,
          valeur_actuelle: 30,
          date_valeur_actuelle: new Date("2025-12-06"),
          jalon: 2025,
        });

        // When
        const result = await prismaIndicateurRepository.listerParIndicId({
          indicId: indicateur.id,
          jalon: 2024,
        });

        // Then
        expect(result).toEqual([
          expect.objectContaining({
            indicId: "IND-001",
            territoireCode: "NAT-FR",
            valeurCibleAnnuelle: 20,
            tauxAvancementAnnuel: 13,
            valeurAvancement: 20,
          }),
          expect.objectContaining({
            indicId: "IND-001",
            territoireCode: "REG-01",
            valeurAvancement: null,
            dateValeurAvancement: null,
          }),
        ]);
        expect(result[0].dateValeurCibleAnnuelle?.toISOString()).toStartWith(
          "2024-12-06",
        );
        expect(result[0].dateValeurAvancement?.toISOString()).toStartWith(
          "2024-12-06",
        );
      }),
    );
  });

  describe("#recupererDetailsParChantierIdEtTerritoire", () => {
    it(
      "sans PVA, retourne les détails des indicateurs pour un chantier et un territoire",
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
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          chantier_id: chantier.id,
          unite_mesure: "kg",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          evolution_avancement: [
            { date: new Date("2026-01-12"), valeur: 100 },
            { date: new Date("2026-01-14"), valeur: 110 },
          ],
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
          valeur_actuelle: 110,
          date_valeur_actuelle: new Date("2026-01-12"),
        });

        const utilisateur = await fixtures.utilisateur();

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          date_valeur: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 1,
          valeur: 100,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
          date_valeur: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 2,
          valeur: 110,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
            chantier.id,
            ["NAT-FR"],
            2025,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["IND-001"]["NAT-FR"]).toEqual(
          expect.objectContaining({
            valeurAvancement: 110,
            dateValeurAvancement: "2026-01-12T00:00:00.000Z",
            proposition: null,
            historiquesValeurs: [
              { date: "2026-01-12T00:00:00.000Z", valeur: 100 },
              { date: "2026-01-14T00:00:00.000Z", valeur: 110 },
            ],
          }),
        );
      }),
    );

    it(
      "avec une PVA [CREEE], retourne les détails des indicateurs pour un chantier, territoire et proposition",
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
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          chantier_id: chantier.id,
          unite_mesure: "kg",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
          valeur_actuelle: 110,
          date_valeur_actuelle: new Date("2026-01-12"),
        });

        const utilisateur = await fixtures.utilisateur({
          nom: "Doe",
          prenom: "Jane",
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          date_valeur: new Date("2026-01-01"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 1,
          valeur: 100,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
          date_valeur: new Date("2026-01-01"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 2,
          valeur: 110,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          date_valeur: new Date("2026-01-01"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 3,
          valeur: 120,
          donnees_complementaires: {
            motif: "Motif de la proposition",
            source_donnee_methode_calcul:
              "Source de la donnée et méthode de calcul",
          },
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
            chantier.id,
            ["NAT-FR"],
            2025,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["IND-001"]["NAT-FR"].valeurAvancement).toEqual(110);
        expect(result["IND-001"]["NAT-FR"].dateValeurAvancement).toEqual(
          "2026-01-12T00:00:00.000Z",
        );
        expect(result["IND-001"]["NAT-FR"].proposition).toEqual({
          valeurAvancement: 120,
          tauxAvancement: null,
          tauxAvancementIntermediaire: null,
          statutTauxAvancement: "CALCULE",
          auteur: "Jane Doe",
          dateProposition: "2026-01-12T00:00:00.000Z",
          dateValeurAvancement: "2026-01-01T00:00:00.000Z",
          motif: "Motif de la proposition",
          sourceDonneeEtMethodeCalcul:
            "Source de la donnée et méthode de calcul",
        });
      }),
    );

    it(
      "avec une PVA [CREEE] sur une date ultérieure, retourne les détails des indicateurs pour un chantier, territoire et proposition",
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
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          chantier_id: chantier.id,
          unite_mesure: "kg",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
          valeur_actuelle: 110,
          date_valeur_actuelle: new Date("2026-01-12"),
        });

        const utilisateur = await fixtures.utilisateur({
          nom: "Doe",
          prenom: "Jane",
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          date_valeur: new Date("2026-01-01"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 1,
          valeur: 100,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
          date_valeur: new Date("2026-01-01"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 2,
          valeur: 110,
        });
        // PVA sur une date ultérieure (2026-02-01)
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          date_valeur: new Date("2026-02-01"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 3,
          valeur: 120,
          donnees_complementaires: {
            motif: "Motif de la proposition",
            source_donnee_methode_calcul:
              "Source de la donnée et méthode de calcul",
          },
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
            chantier.id,
            ["NAT-FR"],
            2025,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["IND-001"]["NAT-FR"].valeurAvancement).toEqual(110);
        expect(result["IND-001"]["NAT-FR"].dateValeurAvancement).toEqual(
          "2026-01-12T00:00:00.000Z",
        );
        expect(result["IND-001"]["NAT-FR"].proposition).toEqual({
          valeurAvancement: 120,
          tauxAvancement: null,
          tauxAvancementIntermediaire: null,
          statutTauxAvancement: "CALCULE",
          auteur: "Jane Doe",
          dateProposition: "2026-01-12T00:00:00.000Z",
          dateValeurAvancement: "2026-02-01T00:00:00.000Z",
          motif: "Motif de la proposition",
          sourceDonneeEtMethodeCalcul:
            "Source de la donnée et méthode de calcul",
        });
      }),
    );

    it(
      "avec une PVA [CREEE, MODIFIEE], retourne les détails des indicateurs pour un chantier, territoire et dernière proposition",
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
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          chantier_id: chantier.id,
          unite_mesure: "kg",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
          valeur_actuelle: 110,
          date_valeur_actuelle: new Date("2026-01-12"),
        });

        const utilisateur = await fixtures.utilisateur({
          nom: "Doe",
          prenom: "Jane",
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          date_valeur: new Date("2026-01-01"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 1,
          valeur: 100,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
          date_valeur: new Date("2026-01-01"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 2,
          valeur: 110,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          date_valeur: new Date("2026-01-01"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 3,
          valeur: 120,
          donnees_complementaires: {
            motif: "Motif de la proposition",
            sourceDonneeEtMethodeCalcul:
              "Source de la donnée et méthode de calcul",
          },
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
          date_valeur: new Date("2026-01-01"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 4,
          valeur: 140,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
            chantier.id,
            ["NAT-FR"],
            2025,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["IND-001"]["NAT-FR"].valeurAvancement).toEqual(110);
        expect(result["IND-001"]["NAT-FR"].dateValeurAvancement).toEqual(
          "2026-01-12T00:00:00.000Z",
        );
        expect(result["IND-001"]["NAT-FR"].proposition).toEqual({
          valeurAvancement: 140,
          tauxAvancement: null,
          tauxAvancementIntermediaire: null,
          statutTauxAvancement: "CALCULE",
          auteur: "Jane Doe",
          dateProposition: "2026-01-12T00:00:00.000Z",
          dateValeurAvancement: "2026-01-01T00:00:00.000Z",
          motif: null,
          sourceDonneeEtMethodeCalcul: null,
        });
      }),
    );

    it(
      "avec une PVA [CREEE, MODIFIEE] sur une date ultérieure, retourne les détails des indicateurs pour un chantier, territoire et dernière proposition",
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
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          chantier_id: chantier.id,
          unite_mesure: "kg",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
          valeur_actuelle: 110,
          date_valeur_actuelle: new Date("2026-01-12"),
        });

        const utilisateur = await fixtures.utilisateur({
          nom: "Doe",
          prenom: "Jane",
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          date_valeur: new Date("2026-01-01"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 1,
          valeur: 100,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
          date_valeur: new Date("2026-01-01"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 2,
          valeur: 110,
        });
        // PVA sur une date ultérieure (2026-02-01)
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          date_valeur: new Date("2026-02-01"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 3,
          valeur: 120,
          donnees_complementaires: {
            motif: "Motif de la proposition",
            sourceDonneeEtMethodeCalcul:
              "Source de la donnée et méthode de calcul",
          },
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
          date_valeur: new Date("2026-02-01"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 4,
          valeur: 140,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
            chantier.id,
            ["NAT-FR"],
            2025,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["IND-001"]["NAT-FR"].valeurAvancement).toEqual(110);
        expect(result["IND-001"]["NAT-FR"].dateValeurAvancement).toEqual(
          "2026-01-12T00:00:00.000Z",
        );
        expect(result["IND-001"]["NAT-FR"].proposition).toEqual({
          valeurAvancement: 140,
          tauxAvancement: null,
          tauxAvancementIntermediaire: null,
          statutTauxAvancement: "CALCULE",
          auteur: "Jane Doe",
          dateProposition: "2026-01-12T00:00:00.000Z",
          dateValeurAvancement: "2026-02-01T00:00:00.000Z",
          motif: null,
          sourceDonneeEtMethodeCalcul: null,
        });
      }),
    );

    it.each([
      [EvenementValeurEnum.PROPOSITION_VALEUR_SUPPRIMEE],
      [EvenementValeurEnum.PROPOSITION_VALEUR_REFUSEE],
      [EvenementValeurEnum.PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE],
      [EvenementValeurEnum.PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE],
    ])(
      "avec une PVA [CREEE, MODIFIEE, %s], retourne les détails des indicateurs pour un chantier, territoire et aucune proposition",
      createIntegrationTest(async (_prisma, evenement) => {
        // Given
        const territoireCodes = ["NAT-FR"];
        const jalon = 2025;

        const chantier = await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          ministeres: ["1009"],
          ministeres_acronymes: ["MINA"],
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          zone_id: "FRANCE",
        });
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier.id,
          unite_mesure: "kg",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          zone_id: "FRANCE",
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          zone_id: "FRANCE",
          jalon: 2025,
          valeur_actuelle: 110,
          date_valeur_actuelle: new Date("2026-01-12"),
        });

        const utilisateur = await fixtures.utilisateur();
        const correlationId = "550e8400-e29b-41d4-a716-446655440002";

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 1,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 100,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 2,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 110,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 3,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 120,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 4,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-14"),
          correlation_id: correlationId,
          valeur: 140,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: evenement,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 5,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-14"),
          correlation_id: correlationId,
          valeur: 140,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
            chantier.id,
            territoireCodes,
            jalon,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["IND-001"]["NAT-FR"].valeurAvancement).toEqual(110);
        expect(result["IND-001"]["NAT-FR"].dateValeurAvancement).toEqual(
          "2026-01-12T00:00:00.000Z",
        );
        expect(result["IND-001"]["NAT-FR"].proposition).toBeNull();
      }),
    );

    it.each([
      EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE,
      EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION,
    ])(
      "avec une PVA [CREEE, MODIFIEE, %s], retourne les détails des indicateurs pour un chantier, territoire et la proposition",
      createIntegrationTest(async (_prisma, evenement) => {
        // Given
        const territoireCodes = ["NAT-FR"];
        const jalon = 2025;

        const chantier = await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          ministeres: ["1009"],
          ministeres_acronymes: ["MINA"],
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          zone_id: "FRANCE",
        });
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier.id,
          unite_mesure: "kg",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          zone_id: "FRANCE",
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          zone_id: "FRANCE",
          jalon: 2025,
          valeur_actuelle: 110,
          date_valeur_actuelle: new Date("2026-01-12"),
        });

        const utilisateur = await fixtures.utilisateur();
        const correlationId = "550e8400-e29b-41d4-a716-446655440002";

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 1,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 100,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 2,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 110,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 3,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 120,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 4,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-14"),
          correlation_id: correlationId,
          valeur: 140,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: evenement,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 5,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-14"),
          correlation_id: correlationId,
          valeur: 140,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
            chantier.id,
            territoireCodes,
            jalon,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["IND-001"]["NAT-FR"].valeurAvancement).toEqual(110);
        expect(result["IND-001"]["NAT-FR"].dateValeurAvancement).toEqual(
          "2026-01-12T00:00:00.000Z",
        );
        expect(result["IND-001"]["NAT-FR"].proposition).toBeNull();
      }),
    );

    it(
      "avec une PVA [CREEE, MODIFIEE, SUPPRIMEE, CREEE], retourne les détails des indicateurs pour un chantier, territoire et nouvelle proposition",
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
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          chantier_id: chantier.id,
          unite_mesure: "kg",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
          valeur_actuelle: 110,
          date_valeur_actuelle: new Date("2026-01-12"),
        });

        const utilisateur = await fixtures.utilisateur({
          nom: "Doe",
          prenom: "Jane",
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          date_valeur: new Date("2026-01-01"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 1,
          valeur: 100,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
          date_valeur: new Date("2026-01-01"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 2,
          valeur: 110,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          date_valeur: new Date("2026-01-01"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 3,
          valeur: 120,
          donnees_complementaires: {
            motif: "Motif de la proposition",
            source_donnee_methode_calcul:
              "Source de la donnée et méthode de calcul",
          },
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
          date_valeur: new Date("2026-01-01"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 4,
          valeur: 140,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_SUPPRIMEE,
          date_valeur: new Date("2026-01-01"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 5,
          valeur: 140,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          date_valeur: new Date("2026-01-01"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 6,
          valeur: 150,
          donnees_complementaires: {
            motif: "Motif de la proposition 2",
            source_donnee_methode_calcul:
              "Source de la donnée et méthode de calcul 2",
          },
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
            chantier.id,
            ["NAT-FR"],
            2025,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["IND-001"]["NAT-FR"].valeurAvancement).toEqual(110);
        expect(result["IND-001"]["NAT-FR"].dateValeurAvancement).toEqual(
          "2026-01-12T00:00:00.000Z",
        );
        expect(result["IND-001"]["NAT-FR"].proposition).toEqual({
          valeurAvancement: 150,
          tauxAvancement: null,
          tauxAvancementIntermediaire: null,
          statutTauxAvancement: "CALCULE",
          auteur: "Jane Doe",
          dateProposition: "2026-01-12T00:00:00.000Z",
          dateValeurAvancement: "2026-01-01T00:00:00.000Z",
          motif: "Motif de la proposition 2",
          sourceDonneeEtMethodeCalcul:
            "Source de la donnée et méthode de calcul 2",
        });
      }),
    );

    it(
      "lorsque le dernier évènement en date est de type PROPOSITION_VALEUR_REFUSEE, le propositionStatutTerritoire est null et le propositionStatutDirectionProjet est du même type avec la date de l'événement",
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

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          chantier_id: chantier.id,
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          date_valeur_actuelle_mandat: new Date("2026-01-01"),
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
          date_valeur_actuelle: new Date("2026-01-01"),
        });

        const utilisateur = await fixtures.utilisateur({
          nom: "Doe",
          prenom: "Jane",
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          date_valeur: new Date("2026-01-01"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 1,
          valeur: 100,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_REFUSEE,
          date_valeur: new Date("2026-01-01"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 2,
          valeur: 100,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
            chantier.id,
            ["NAT-FR"],
            2025,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(
          result["IND-001"]["NAT-FR"].propositionStatutTerritoire,
        ).toBeNull();
        expect(
          result["IND-001"]["NAT-FR"].propositionStatutDirectionProjet,
        ).toEqual({
          statut: EvenementValeurEnum.PROPOSITION_VALEUR_REFUSEE,
          date: "2026-01-12",
          dateTime: "2026-01-12T00:00:00.000Z",
        });
      }),
    );

    it.each([
      [EvenementValeurEnum.PROPOSITION_VALEUR_ACCUSEE_RECEPTION],
      [EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE],
      [EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION],
    ])(
      "lorsque le dernier évènement en date est de type %s suivi de PROPOSITION_VALEUR_CREEE, le propositionStatutTerritoire est PROPOSITION_VALEUR_CREEE",
      createIntegrationTest(async (_prisma, evenement) => {
        // Given
        const chantier = await fixtures.chantierIdentite({ id: "CH-001" });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          chantier_id: chantier.id,
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          date_valeur_actuelle_mandat: new Date("2026-01-12"),
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
          date_valeur_actuelle: new Date("2026-01-12"),
        });

        const utilisateur = await fixtures.utilisateur({
          nom: "Doe",
          prenom: "Jane",
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          date_valeur: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 1,
          valeur: 100,
          donnees_complementaires: {
            motif: "Un motif",
            source_donnee_methode_calcul: "Une source",
          },
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: evenement,
          date_valeur: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 2,
          valeur: 100,
          donnees_complementaires: {
            motif: "motif accusee reception",
          },
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
            chantier.id,
            ["NAT-FR"],
            2025,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["IND-001"]["NAT-FR"].propositionStatutTerritoire).toEqual(
          {
            statut: "PROPOSITION_VALEUR_CREEE",
            date: "2026-01-12",
            dateTime: "2026-01-12T00:00:00.000Z",
          },
        );
        expect(
          result["IND-001"]["NAT-FR"].propositionStatutDirectionProjet,
        ).toEqual({
          statut: evenement,
          date: "2026-01-12",
          dateTime: "2026-01-12T00:00:00.000Z",
        });
      }),
    );

    it.each([
      [EvenementValeurEnum.PROPOSITION_VALEUR_ACCUSEE_RECEPTION],
      [EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE],
      [EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION],
    ])(
      "lorsque le dernier évènement en date est de type %s suivi de PROPOSITION_VALEUR_MODIFIEE, le propositionStatutTerritoire est PROPOSITION_VALEUR_MODIFIEE",
      createIntegrationTest(async (_prisma, evenement) => {
        // Given
        const chantier = await fixtures.chantierIdentite({ id: "CH-001" });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          chantier_id: chantier.id,
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          date_valeur_actuelle_mandat: new Date("2026-01-12"),
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
          date_valeur_actuelle: new Date("2026-01-12"),
        });

        const utilisateur = await fixtures.utilisateur({
          nom: "Doe",
          prenom: "Jane",
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          date_valeur: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 1,
          valeur: 100,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
          date_valeur: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 2,
          valeur: 100,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: evenement,
          date_valeur: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 3,
          valeur: 100,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
            chantier.id,
            ["NAT-FR"],
            2025,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["IND-001"]["NAT-FR"].propositionStatutTerritoire).toEqual(
          {
            statut: "PROPOSITION_VALEUR_MODIFIEE",
            date: "2026-01-12",
            dateTime: "2026-01-12T00:00:00.000Z",
          },
        );
        expect(
          result["IND-001"]["NAT-FR"].propositionStatutDirectionProjet,
        ).toEqual({
          statut: evenement,
          date: "2026-01-12",
          dateTime: "2026-01-12T00:00:00.000Z",
        });
      }),
    );

    it(
      "lorsque le dernier évènement en date est de type PROPOSITION_VALEUR_SUPPRIMEE, le propositionStatutTerritoire est PROPOSITION_VALEUR_SUPPRIMEE et le propositionStatutDirectionProjet est null",
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

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          chantier_id: chantier.id,
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          date_valeur_actuelle_mandat: new Date("2026-01-12"),
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
          date_valeur_actuelle: new Date("2026-01-12"),
        });

        const utilisateur = await fixtures.utilisateur({
          nom: "Doe",
          prenom: "Jane",
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          date_valeur: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 1,
          valeur: 100,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_SUPPRIMEE,
          date_valeur: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 2,
          valeur: 100,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
            chantier.id,
            ["NAT-FR"],
            2025,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["IND-001"]["NAT-FR"].propositionStatutTerritoire).toEqual(
          {
            statut: "PROPOSITION_VALEUR_SUPPRIMEE",
            date: "2026-01-12",
            dateTime: "2026-01-12T00:00:00.000Z",
          },
        );
        expect(
          result["IND-001"]["NAT-FR"].propositionStatutDirectionProjet,
        ).toBeNull();
      }),
    );

    it(
      "lorsque le dernier évènement en date est de type PROPOSITION_VALEUR_CREEE, le propositionStatutTerritoire est PROPOSITION_VALEUR_CREEE et le propositionStatutDirectionProjet est null",
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

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          chantier_id: chantier.id,
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          date_valeur_actuelle_mandat: new Date("2026-01-12"),
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
          date_valeur_actuelle: new Date("2026-01-12"),
        });

        const utilisateur = await fixtures.utilisateur({
          nom: "Doe",
          prenom: "Jane",
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          date_valeur: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 1,
          valeur: 100,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
            chantier.id,
            ["NAT-FR"],
            2025,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["IND-001"]["NAT-FR"].propositionStatutTerritoire).toEqual(
          {
            statut: "PROPOSITION_VALEUR_CREEE",
            date: "2026-01-12",
            dateTime: "2026-01-12T00:00:00.000Z",
          },
        );
        expect(
          result["IND-001"]["NAT-FR"].propositionStatutDirectionProjet,
        ).toBeNull();
      }),
    );

    it(
      "lorsque le dernier évènement en date est de type PROPOSITION_VALEUR_MODIFIEE, le propositionStatutTerritoire est PROPOSITION_VALEUR_MODIFIEE et le propositionStatutDirectionProjet est null",
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

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          chantier_id: chantier.id,
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          date_valeur_actuelle_mandat: new Date("2026-01-12"),
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
          date_valeur_actuelle: new Date("2026-01-12"),
        });

        const utilisateur = await fixtures.utilisateur({
          nom: "Doe",
          prenom: "Jane",
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          date_valeur: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 1,
          valeur: 10,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
          date_valeur: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 2,
          valeur: 100,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
          date_valeur: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 3,
          valeur: 90,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
            chantier.id,
            ["NAT-FR"],
            2025,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["IND-001"]["NAT-FR"].propositionStatutTerritoire).toEqual(
          {
            statut: "PROPOSITION_VALEUR_MODIFIEE",
            date: "2026-01-12",
            dateTime: "2026-01-12T00:00:00.000Z",
          },
        );
        expect(
          result["IND-001"]["NAT-FR"].propositionStatutDirectionProjet,
        ).toBeNull();
      }),
    );

    it(
      "s'assure que les événements sur différentes dates ne s'impactent pas mutuellement",
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

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          chantier_id: chantier.id,
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          date_valeur_actuelle_mandat: new Date("2026-01-15"),
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
          date_valeur_actuelle: new Date("2026-01-15"),
        });

        const utilisateur = await fixtures.utilisateur({
          nom: "Doe",
          prenom: "Jane",
        });

        // Événement sur une date antérieure - ne devrait pas impacter
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement:
            EvenementValeurEnum.PROPOSITION_VALEUR_ACCUSEE_RECEPTION,
          date_valeur: new Date("2026-01-10"),
          date_creation: new Date("2026-01-10"),
          date_modification: new Date("2026-01-10"),
          id_auteur_modification: utilisateur.id,
          ordre: 1,
          valeur: 80,
        });
        // Événements sur la date la plus récente (date_valeur_actuelle)
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          date_valeur: new Date("2026-01-15"),
          date_creation: new Date("2026-01-15"),
          date_modification: new Date("2026-01-15"),
          id_auteur_modification: utilisateur.id,
          ordre: 1,
          valeur: 100,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
            chantier.id,
            ["NAT-FR"],
            2025,
            dateDerniereExecutionDatajobs,
          );

        // Then
        // Seuls les événements de la date la plus récente (2026-01-15) sont pris en compte
        expect(result["IND-001"]["NAT-FR"].propositionStatutTerritoire).toEqual(
          {
            statut: "PROPOSITION_VALEUR_CREEE",
            date: "2026-01-15",
            dateTime: "2026-01-15T00:00:00.000Z",
          },
        );
        expect(
          result["IND-001"]["NAT-FR"].propositionStatutDirectionProjet,
        ).toBeNull();
      }),
    );

    it(
      "calcule le statutTauxAvancement EN_COURS quand la date de création de la proposition est postérieure à la dernière exécution des datajobs",
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

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          chantier_id: chantier.id,
          unite_mesure: "kg",
          statut: "PUBLIE",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });

        const utilisateur = await fixtures.utilisateur({
          nom: "Doe",
          prenom: "Jane",
        });

        // date_creation postérieure à dateDerniereExecutionDatajobs (2026-02-12)
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          date_valeur: new Date("2026-01-12"),
          date_creation: new Date("2026-02-13"),
          date_modification: new Date("2026-02-13"),
          id_auteur_modification: utilisateur.id,
          ordre: 1,
          valeur: 100,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
            chantier.id,
            ["NAT-FR"],
            2025,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(
          result["IND-001"]["NAT-FR"].proposition?.statutTauxAvancement,
        ).toEqual("EN_COURS");
      }),
    );

    it(
      "calcule le statutTauxAvancement CALCULE quand la date de création de la proposition est antérieure à la dernière exécution des datajobs",
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

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          chantier_id: chantier.id,
          unite_mesure: "kg",
          statut: "PUBLIE",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });

        const utilisateur = await fixtures.utilisateur({
          nom: "Doe",
          prenom: "Jane",
        });

        // date_creation antérieure à dateDerniereExecutionDatajobs (2026-02-12)
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          date_valeur: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          date_modification: new Date("2026-01-12"),
          id_auteur_modification: utilisateur.id,
          ordre: 1,
          valeur: 100,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
            chantier.id,
            ["NAT-FR"],
            2025,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(
          result["IND-001"]["NAT-FR"].proposition?.statutTauxAvancement,
        ).toEqual("CALCULE");
      }),
    );

    it(
      "calcule dateImport comme la date_creation la plus récente des événements VALEUR_CREEE et VALEUR_MODIFIEE antérieurs à la date de dernière exécution des datajobs",
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
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });

        const indicateur1 = await fixtures.indicateurIdentite({
          id: "IND-001",
          chantier_id: chantier.id,
        });
        const indicateur2 = await fixtures.indicateurIdentite({
          id: "IND-002",
          chantier_id: chantier.id,
        });
        const indicateur3 = await fixtures.indicateurIdentite({
          id: "IND-003",
          chantier_id: chantier.id,
        });

        await fixtures.indicateurTerritoire({
          id: indicateur1.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });
        await fixtures.indicateurTerritoire({
          id: indicateur1.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });
        await fixtures.indicateurTerritoire({
          id: indicateur2.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });
        await fixtures.indicateurTerritoire({
          id: indicateur3.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });

        const utilisateur = await fixtures.utilisateur();

        // IND-001 NAT-FR : événements VALEUR_CREEE et VALEUR_MODIFIEE avant dateDerniereExecutionDatajobs
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur1.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          date_creation: new Date("2026-01-10T00:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur1.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
          date_creation: new Date("2026-01-15T00:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
        });

        // IND-001 DEPT-01 : date_creation différente de NAT-FR
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur1.id,
          territoire_code: "DEPT-01",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          date_creation: new Date("2026-01-20T00:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
        });

        // IND-002 NAT-FR : uniquement des événements PROPOSITION_* (pas d'import)
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur2.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          date_creation: new Date("2026-01-10T00:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
        });

        // IND-003 NAT-FR : événements après dateDerniereExecutionDatajobs (pas d'import)
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur3.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          date_creation: new Date("2026-03-01T00:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
            chantier.id,
            ["NAT-FR", "DEPT-01"],
            2025,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["IND-001"]["NAT-FR"].dateImport).toEqual(
          new Date("2026-01-15T00:00:00.000Z").toLocaleString(),
        );
        expect(result["IND-001"]["DEPT-01"].dateImport).toEqual(
          new Date("2026-01-20T00:00:00.000Z").toLocaleString(),
        );
        expect(result["IND-002"]["NAT-FR"].dateImport).toBeNull();
        expect(result["IND-003"]["NAT-FR"].dateImport).toBeNull();
      }),
    );

    it(
      "pour un indicateur agrégé NAT avec va_nat_from=DEPT, calcule dateImport à partir des événements DEPT",
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
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          chantier_id: chantier.id,
        });

        await fixtures.metadataParametrageIndicateurs({
          indic_id: indicateur.id,
          va_nat_from: "DEPT",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });

        const utilisateur = await fixtures.utilisateur();

        // Événement NAT-FR (ne doit pas être utilisé car va_nat_from=DEPT)
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          date_creation: new Date("2026-01-01T00:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
        });

        // Événements DEPT-01 (doivent être utilisés)
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-01",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          date_creation: new Date("2026-01-10T00:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-01",
          type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
          date_creation: new Date("2026-01-20T00:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
            chantier.id,
            ["NAT-FR"],
            2025,
            dateDerniereExecutionDatajobs,
          );

        // Then
        // NAT-FR utilise les événements DEPT (date la plus récente: 2026-01-20)
        expect(result["IND-001"]["NAT-FR"].dateImport).toEqual(
          new Date("2026-01-20T00:00:00.000Z").toLocaleString(),
        );
      }),
    );

    it(
      "pour un indicateur agrégé NAT avec va_nat_from=REG, calcule dateImport à partir des événements REG",
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
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "REG-84",
          code_insee: "84",
          maille: "REG",
          zone_id: "R84",
        });

        const utilisateur = await fixtures.utilisateur();

        // Événement NAT-FR (ne doit pas être utilisé car va_nat_from=REG)
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          date_creation: new Date("2026-01-01T00:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
        });

        // Événements REG-84 (doivent être utilisés)
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "REG-84",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          date_creation: new Date("2026-01-15T00:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
            chantier.id,
            ["NAT-FR"],
            2025,
            dateDerniereExecutionDatajobs,
          );

        // Then
        // NAT-FR utilise les événements REG (date: 2026-01-15)
        expect(result["IND-001"]["NAT-FR"].dateImport).toEqual(
          new Date("2026-01-15T00:00:00.000Z").toLocaleString(),
        );
      }),
    );

    it(
      "pour un indicateur agrégé REG avec va_reg_from=DEPT, calcule dateImport à partir des événements DEPT enfants",
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
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          chantier_id: chantier.id,
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
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });

        const utilisateur = await fixtures.utilisateur();

        // Événement REG-84 (ne doit pas être utilisé car va_reg_from=DEPT)
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "REG-84",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          date_creation: new Date("2026-01-01T00:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
        });

        // Événements DEPT-01 (doivent être utilisés)
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-01",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          date_creation: new Date("2026-01-25T00:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
            chantier.id,
            ["REG-84"],
            2025,
            dateDerniereExecutionDatajobs,
          );

        // Then
        // REG-84 utilise les événements DEPT (date: 2026-01-25)
        expect(result["IND-001"]["REG-84"].dateImport).toEqual(
          new Date("2026-01-25T00:00:00.000Z").toLocaleString(),
        );
      }),
    );
  });

  describe("#récupérerDétailsTerritoirePourUnIndicateur", () => {
    it(
      "sans PVA, retourne les détails d'un indicateur sur tous les territoires territoire",
      createIntegrationTest(async () => {
        // Given
        const chantiersIds = ["CH-001"];
        const indicateurId = "IND-001";
        const territoireCodes = ["DEPT-02", "DEPT-01"];
        const jalon = 2025;
        const habilitations: Habilitations = {
          gestionUtilisateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          lecture: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieCommentaire: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieIndicateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          responsabilite: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
        };

        const chantier = await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          ministeres: ["1009"],
          ministeres_acronymes: ["MINA"],
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "FRANCE",
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier.id,
          unite_mesure: "kg",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
          evolution_avancement: [
            {
              date: new Date("2026-01-12"),
              valeur: 100,
            },
            {
              date: new Date("2026-01-14"),
              valeur: 110,
            },
          ],
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
          valeur_actuelle_mandat: 10,
          date_valeur_actuelle_mandat: new Date("2025-05-06"),
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
          jalon: 2025,
          valeur_actuelle: 110,
          date_valeur_actuelle: new Date("2026-01-12"),
        });

        await fixtures.utilisateur();

        // When
        const result =
          await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
            indicateurId,
            habilitations,
            ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
            jalon,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["DEPT-02"].valeurAvancement).toEqual(110);
        expect(result["DEPT-02"].dateValeurAvancement).toEqual(
          new Date("2026-01-12").toLocaleString(),
        );
        expect(result["DEPT-02"].proposition).toBeNull();
        expect(result["DEPT-02"].historiquesValeurs).toEqual([
          {
            date: "2026-01-12T00:00:00.000Z",
            valeur: 100,
          },
          {
            date: "2026-01-14T00:00:00.000Z",
            valeur: 110,
          },
        ]);

        expect(result["DEPT-01"].valeurAvancementMandat).toEqual(10);
        expect(result["DEPT-01"].dateValeurAvancementMandat).toEqual(
          new Date("2025-05-06").toLocaleString(),
        );
        expect(result["DEPT-01"].proposition).toBeNull();
        expect(result["DEPT-01"].historiquesValeurs).toEqual([]);
      }),
    );

    it(
      "avec une PVA [CREEE], retourne les détails des indicateurs pour un chantier, territoire et proposition",
      createIntegrationTest(async () => {
        // Given
        const chantiersIds = ["CH-001"];
        const indicateurId = "IND-001";
        const territoireCodes = ["DEPT-02", "DEPT-01"];
        const jalon = 2025;
        const habilitations: Habilitations = {
          gestionUtilisateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          lecture: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieCommentaire: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieIndicateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          responsabilite: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
        };

        const chantier = await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          ministeres: ["1009"],
          ministeres_acronymes: ["MINA"],
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "FRANCE",
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier.id,
          unite_mesure: "kg",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
          evolution_avancement: [
            {
              date: new Date("2026-01-12"),
              valeur: 100,
            },
            {
              date: new Date("2026-01-14"),
              valeur: 110,
            },
          ],
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
          valeur_actuelle_mandat: 10,
          date_valeur_actuelle_mandat: new Date("2025-05-06"),
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
          jalon: 2025,
          valeur_actuelle: 110,
          date_valeur_actuelle: new Date("2026-01-12"),
        });

        // Auteur attendu dans le expect: "Jane Doe"
        const utilisateur = await fixtures.utilisateur({
          id: "550e8400-e29b-41d4-a716-446655440001",
          prenom: "Jane",
          nom: "Doe",
        });

        const correlationId = "550e8400-e29b-41d4-a716-446655440002";

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-01"),
          ordre: 1,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 100,
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-01"),
          ordre: 2,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 110,
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-01"),
          ordre: 3,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 120,
          donnees_complementaires: {
            motif: "Motif de la proposition",
            source_donnee_methode_calcul:
              "Source de la donnée et méthode de calcul",
          },
        });

        // When
        const result =
          await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
            indicateurId,
            habilitations,
            ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
            jalon,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["DEPT-02"].valeurAvancement).toEqual(110);
        expect(result["DEPT-02"].dateValeurAvancement).toEqual(
          new Date("2026-01-12").toLocaleString(),
        );
        expect(result["DEPT-02"].proposition).toEqual({
          valeurAvancement: 120,
          tauxAvancement: null,
          tauxAvancementIntermediaire: null,
          statutTauxAvancement: "CALCULE",
          auteur: "Jane Doe",
          dateProposition: "2026-01-12T00:00:00.000Z",
          dateValeurAvancement: "2026-01-01T00:00:00.000Z",
          motif: "Motif de la proposition",
          sourceDonneeEtMethodeCalcul:
            "Source de la donnée et méthode de calcul",
        });
      }),
    );

    it(
      "avec une PVA [CREEE, MODIFIEE], retourne les détails des indicateurs pour un chantier, territoire et dernière proposition",
      createIntegrationTest(async () => {
        // Given
        const chantiersIds = ["CH-001"];
        const indicateurId = "IND-001";
        const territoireCodes = ["DEPT-02", "DEPT-01"];
        const jalon = 2025;
        const habilitations: Habilitations = {
          gestionUtilisateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          lecture: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieCommentaire: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieIndicateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          responsabilite: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
        };

        const chantier = await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          ministeres: ["1009"],
          ministeres_acronymes: ["MINA"],
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "FRANCE",
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier.id,
          unite_mesure: "kg",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
          evolution_avancement: [
            {
              date: new Date("2026-01-12"),
              valeur: 100,
            },
            {
              date: new Date("2026-01-14"),
              valeur: 110,
            },
          ],
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
          valeur_actuelle_mandat: 10,
          date_valeur_actuelle_mandat: new Date("2025-05-06"),
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
          jalon: 2025,
          valeur_actuelle: 110,
          date_valeur_actuelle: new Date("2026-01-12"),
        });

        const utilisateur = await fixtures.utilisateur({
          id: "550e8400-e29b-41d4-a716-446655440001",
          prenom: "Jane",
          nom: "Doe",
        });

        const correlationId = "550e8400-e29b-41d4-a716-446655440002";

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-01"),
          ordre: 1,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 100,
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-01"),
          ordre: 2,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 110,
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-01"),
          ordre: 3,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 120,
          donnees_complementaires: {
            motif: "Motif de la proposition",
            sourceDonneeEtMethodeCalcul:
              "Source de la donnée et méthode de calcul",
          },
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-01"),
          ordre: 4,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 140,
        });

        // When
        const result =
          await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
            indicateurId,
            habilitations,
            ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
            jalon,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["DEPT-02"].valeurAvancement).toEqual(110);
        expect(result["DEPT-02"].dateValeurAvancement).toEqual(
          new Date("2026-01-12").toLocaleString(),
        );
        expect(result["DEPT-02"].proposition).toEqual({
          valeurAvancement: 140,
          tauxAvancement: null,
          tauxAvancementIntermediaire: null,
          statutTauxAvancement: "CALCULE",
          auteur: "Jane Doe",
          dateProposition: "2026-01-12T00:00:00.000Z",
          dateValeurAvancement: "2026-01-01T00:00:00.000Z",
          motif: null,
          sourceDonneeEtMethodeCalcul: null,
        });
      }),
    );

    it.each([
      [EvenementValeurEnum.PROPOSITION_VALEUR_SUPPRIMEE],
      [EvenementValeurEnum.PROPOSITION_VALEUR_REFUSEE],
      [EvenementValeurEnum.PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE],
      [EvenementValeurEnum.PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE],
    ])(
      "avec une PVA [CREEE, MODIFIEE, %s], retourne les détails des indicateurs pour un chantier, territoire et aucune proposition",
      createIntegrationTest(async (_prisma, evenement) => {
        // Given
        const chantiersIds = ["CH-001"];
        const indicateurId = "IND-001";
        const territoireCodes = ["DEPT-02", "DEPT-01"];
        const jalon = 2025;
        const habilitations: Habilitations = {
          gestionUtilisateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          lecture: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieCommentaire: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieIndicateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          responsabilite: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
        };

        const chantier = await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          ministeres: ["1009"],
          ministeres_acronymes: ["MINA"],
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "FRANCE",
        });
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier.id,
          unite_mesure: "kg",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
          evolution_avancement: [
            {
              date: new Date("2026-01-12"),
              valeur: 100,
            },
            {
              date: new Date("2026-01-14"),
              valeur: 110,
            },
          ],
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
          valeur_actuelle_mandat: 10,
          date_valeur_actuelle_mandat: new Date("2025-05-06"),
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
          jalon: 2025,
          valeur_actuelle: 110,
          date_valeur_actuelle: new Date("2026-01-12"),
        });

        const utilisateur = await fixtures.utilisateur();
        const correlationId = "550e8400-e29b-41d4-a716-446655440002";

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 1,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 100,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 2,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 110,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 3,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 120,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 4,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-14"),
          correlation_id: correlationId,
          valeur: 140,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: evenement,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 5,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-14"),
          correlation_id: correlationId,
          valeur: 140,
        });

        // When
        const result =
          await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
            indicateurId,
            habilitations,
            ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
            jalon,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["DEPT-02"].valeurAvancement).toEqual(110);
        expect(result["DEPT-02"].dateValeurAvancement).toEqual(
          new Date("2026-01-12").toLocaleString(),
        );
        expect(result["DEPT-02"].proposition).toBeNull();
      }),
    );

    it.each([
      [EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE],
      [EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION],
    ])(
      "avec une PVA [CREEE, MODIFIEE, %s], retourne les détails des indicateurs pour un chantier, territoire et la proposition",
      createIntegrationTest(async (_prisma, evenement) => {
        // Given
        const chantiersIds = ["CH-001"];
        const indicateurId = "IND-001";
        const territoireCodes = ["DEPT-02", "DEPT-01"];
        const jalon = 2025;
        const habilitations: Habilitations = {
          gestionUtilisateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          lecture: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieCommentaire: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieIndicateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          responsabilite: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
        };

        const chantier = await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          ministeres: ["1009"],
          ministeres_acronymes: ["MINA"],
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "FRANCE",
        });
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier.id,
          unite_mesure: "kg",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
          evolution_avancement: [
            {
              date: new Date("2026-01-12"),
              valeur: 100,
            },
            {
              date: new Date("2026-01-14"),
              valeur: 110,
            },
          ],
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
          valeur_actuelle_mandat: 10,
          date_valeur_actuelle_mandat: new Date("2025-05-06"),
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
          jalon: 2025,
          valeur_actuelle: 110,
          date_valeur_actuelle: new Date("2026-01-12"),
        });

        const utilisateur = await fixtures.utilisateur();
        const correlationId = "550e8400-e29b-41d4-a716-446655440002";

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 1,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 100,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 2,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 110,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 3,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 120,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 4,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-14"),
          correlation_id: correlationId,
          valeur: 140,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: evenement,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 5,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-14"),
          correlation_id: correlationId,
          valeur: 140,
        });

        // When
        const result =
          await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
            indicateurId,
            habilitations,
            ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
            jalon,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["DEPT-02"].valeurAvancement).toEqual(110);
        expect(result["DEPT-02"].dateValeurAvancement).toEqual(
          new Date("2026-01-12").toLocaleString(),
        );
        expect(result["DEPT-02"].proposition).toBeNull();
      }),
    );

    it(
      "avec une PVA [CREEE, MODIFIEE, SUPPRIMEE, CREEE], retourne les détails des indicateurs pour un chantier, territoire et nouvelle proposition",
      createIntegrationTest(async () => {
        // Given
        const chantiersIds = ["CH-001"];
        const indicateurId = "IND-001";
        const territoireCodes = ["DEPT-02", "DEPT-01"];
        const jalon = 2025;
        const habilitations: Habilitations = {
          gestionUtilisateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          lecture: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieCommentaire: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieIndicateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          responsabilite: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
        };

        const chantier = await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          ministeres: ["1009"],
          ministeres_acronymes: ["MINA"],
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "FRANCE",
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier.id,
          unite_mesure: "kg",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
          evolution_avancement: [
            {
              date: new Date("2026-01-12"),
              valeur: 100,
            },
            {
              date: new Date("2026-01-14"),
              valeur: 110,
            },
          ],
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
          valeur_actuelle_mandat: 10,
          date_valeur_actuelle_mandat: new Date("2025-05-06"),
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
          jalon: 2025,
          valeur_actuelle: 110,
          date_valeur_actuelle: new Date("2026-01-12"),
        });

        const utilisateur = await fixtures.utilisateur({
          id: "550e8400-e29b-41d4-a716-446655440001",
          prenom: "Jane",
          nom: "Doe",
        });

        const correlationId = "550e8400-e29b-41d4-a716-446655440002";

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-01"),
          ordre: 1,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 100,
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-01"),
          ordre: 2,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 110,
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-01"),
          ordre: 3,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 120,
          donnees_complementaires: {
            motif: "Motif de la proposition",
            source_donnee_methode_calcul:
              "Source de la donnée et méthode de calcul",
          },
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-01"),
          ordre: 4,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 140,
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_SUPPRIMEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-01"),
          ordre: 5,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 140,
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-01"),
          ordre: 6,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 150,
          donnees_complementaires: {
            motif: "Motif de la proposition 2",
            source_donnee_methode_calcul:
              "Source de la donnée et méthode de calcul 2",
          },
        });

        // When
        const result =
          await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
            indicateurId,
            habilitations,
            ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
            jalon,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["DEPT-02"].valeurAvancement).toEqual(110);
        expect(result["DEPT-02"].dateValeurAvancement).toEqual(
          new Date("2026-01-12").toLocaleString(),
        );
        expect(result["DEPT-02"].proposition).toEqual({
          valeurAvancement: 150,
          tauxAvancement: null,
          tauxAvancementIntermediaire: null,
          statutTauxAvancement: "CALCULE",
          auteur: "Jane Doe",
          dateProposition: "2026-01-12T00:00:00.000Z",
          dateValeurAvancement: "2026-01-01T00:00:00.000Z",
          motif: "Motif de la proposition 2",
          sourceDonneeEtMethodeCalcul:
            "Source de la donnée et méthode de calcul 2",
        });
      }),
    );

    it(
      "lorsque le dernier évènement en date est de type PROPOSITION_VALEUR_REFUSEE, le propositionStatutTerritoire est null et le propositionStatutDirectionProjet est PROPOSITION_VALEUR_REFUSEE avec la date de l'événement",
      createIntegrationTest(async () => {
        // Given
        const chantiersIds = ["CH-001"];
        const indicateurId = "IND-001";
        const territoireCodes = ["DEPT-02", "DEPT-01"];
        const jalon = 2025;
        const habilitations: Habilitations = {
          gestionUtilisateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          lecture: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieCommentaire: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieIndicateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          responsabilite: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
        };

        const chantier = await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          ministeres: ["1009"],
          ministeres_acronymes: ["MINA"],
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "FRANCE",
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier.id,
          unite_mesure: "kg",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
          date_valeur_actuelle_mandat: new Date("2026-01-12"),
          evolution_avancement: [
            {
              date: new Date("2026-01-12"),
              valeur: 100,
            },
            {
              date: new Date("2026-01-14"),
              valeur: 110,
            },
          ],
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
          valeur_actuelle_mandat: 10,
          date_valeur_actuelle_mandat: new Date("2025-05-06"),
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
          jalon: 2025,
          valeur_actuelle: 110,
          date_valeur_actuelle: new Date("2026-01-12"),
        });

        const utilisateur = await fixtures.utilisateur({
          id: "550e8400-e29b-41d4-a716-446655440001",
          prenom: "Jane",
          nom: "Doe",
        });

        const correlationId = "550e8400-e29b-41d4-a716-446655440002";

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 1,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 100,
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_REFUSEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 2,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 100,
        });

        // When
        const result =
          await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
            indicateurId,
            habilitations,
            ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
            jalon,
            dateDerniereExecutionDatajobs,
          );

        // Then

        expect(result["DEPT-02"].propositionStatutTerritoire).toBeNull();
        expect(result["DEPT-02"].propositionStatutDirectionProjet).toEqual({
          statut: "PROPOSITION_VALEUR_REFUSEE",
          date: "2026-01-12",
          dateTime: "2026-01-12T00:00:00.000Z",
        });
      }),
    );

    it(
      "lorsque le dernier évènement en date est de type PROPOSITION_VALEUR_ACCUSEE_RECEPTION suivi de PROPOSITION_VALEUR_CREEE, le propositionStatutTerritoire est PROPOSITION_VALEUR_CREEE",
      createIntegrationTest(async () => {
        // Given
        const chantiersIds = ["CH-001"];
        const indicateurId = "IND-001";
        const territoireCodes = ["DEPT-02", "DEPT-01"];
        const jalon = 2025;
        const habilitations: Habilitations = {
          gestionUtilisateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          lecture: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieCommentaire: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieIndicateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          responsabilite: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
        };

        const chantier = await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          ministeres: ["1009"],
          ministeres_acronymes: ["MINA"],
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "FRANCE",
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier.id,
          unite_mesure: "kg",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
          date_valeur_actuelle_mandat: new Date("2026-01-12"),
          evolution_avancement: [
            {
              date: new Date("2026-01-12"),
              valeur: 100,
            },
            {
              date: new Date("2026-01-14"),
              valeur: 110,
            },
          ],
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
          valeur_actuelle_mandat: 10,
          date_valeur_actuelle_mandat: new Date("2025-05-06"),
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
          jalon: 2025,
          valeur_actuelle: 110,
          date_valeur_actuelle: new Date("2026-01-12"),
        });

        const utilisateur = await fixtures.utilisateur({
          id: "550e8400-e29b-41d4-a716-446655440001",
          prenom: "Jane",
          nom: "Doe",
        });

        const correlationId = "550e8400-e29b-41d4-a716-446655440003";

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 1,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 100,
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement:
            EvenementValeurEnum.PROPOSITION_VALEUR_ACCUSEE_RECEPTION,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 2,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 100,
        });

        // When
        const result =
          await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
            indicateurId,
            habilitations,
            ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
            jalon,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["DEPT-02"].propositionStatutTerritoire).toEqual({
          statut: "PROPOSITION_VALEUR_CREEE",
          date: "2026-01-12",
          dateTime: "2026-01-12T00:00:00.000Z",
        });
        expect(result["DEPT-02"].propositionStatutDirectionProjet).toEqual({
          statut: "PROPOSITION_VALEUR_ACCUSEE_RECEPTION",
          date: "2026-01-12",
          dateTime: "2026-01-12T00:00:00.000Z",
        });
      }),
    );

    it(
      "lorsque le dernier évènement en date est de type PROPOSITION_VALEUR_ACCUSEE_RECEPTION suivi de PROPOSITION_VALEUR_MODIFIEE, le propositionStatutTerritoire est PROPOSITION_VALEUR_MODIFIEE",
      createIntegrationTest(async () => {
        // Given
        const chantiersIds = ["CH-001"];
        const indicateurId = "IND-001";
        const territoireCodes = ["DEPT-02", "DEPT-01"];
        const jalon = 2025;
        const habilitations: Habilitations = {
          gestionUtilisateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          lecture: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieCommentaire: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieIndicateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          responsabilite: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
        };

        const chantier = await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          ministeres: ["1009"],
          ministeres_acronymes: ["MINA"],
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "FRANCE",
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier.id,
          unite_mesure: "kg",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
          date_valeur_actuelle_mandat: new Date("2026-01-12"),
          evolution_avancement: [
            {
              date: new Date("2026-01-12"),
              valeur: 100,
            },
            {
              date: new Date("2026-01-14"),
              valeur: 110,
            },
          ],
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
          valeur_actuelle_mandat: 10,
          date_valeur_actuelle_mandat: new Date("2025-05-06"),
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
          jalon: 2025,
          valeur_actuelle: 110,
          date_valeur_actuelle: new Date("2026-01-12"),
        });

        const utilisateur = await fixtures.utilisateur({
          id: "550e8400-e29b-41d4-a716-446655440003",
          prenom: "Jane",
          nom: "Doe",
        });

        const correlationId = "550e8400-e29b-41d4-a716-446655440004";

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 1,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 100,
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 2,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 100,
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement:
            EvenementValeurEnum.PROPOSITION_VALEUR_ACCUSEE_RECEPTION,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 3,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 100,
        });

        // When
        const result =
          await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
            indicateurId,
            habilitations,
            ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
            jalon,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["DEPT-02"].propositionStatutTerritoire).toEqual({
          statut: "PROPOSITION_VALEUR_MODIFIEE",
          date: "2026-01-12",
          dateTime: "2026-01-12T00:00:00.000Z",
        });
        expect(result["DEPT-02"].propositionStatutDirectionProjet).toEqual({
          statut: "PROPOSITION_VALEUR_ACCUSEE_RECEPTION",
          date: "2026-01-12",
          dateTime: "2026-01-12T00:00:00.000Z",
        });
      }),
    );

    it(
      "lorsque le dernier évènement en date est de type PROPOSITION_VALEUR_SUPPRIMEE, le propositionStatutTerritoire est PROPOSITION_VALEUR_SUPPRIMEE et le propositionStatutDirectionProjet est null",
      createIntegrationTest(async () => {
        // Given
        const chantiersIds = ["CH-001"];
        const indicateurId = "IND-001";
        const territoireCodes = ["DEPT-02", "DEPT-01"];
        const jalon = 2025;
        const habilitations: Habilitations = {
          gestionUtilisateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          lecture: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieCommentaire: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieIndicateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          responsabilite: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
        };

        const chantier = await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          ministeres: ["1009"],
          ministeres_acronymes: ["MINA"],
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "FRANCE",
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier.id,
          unite_mesure: "kg",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
          date_valeur_actuelle_mandat: new Date("2026-01-12"),
          evolution_avancement: [
            {
              date: new Date("2026-01-12"),
              valeur: 100,
            },
            {
              date: new Date("2026-01-14"),
              valeur: 110,
            },
          ],
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
          valeur_actuelle_mandat: 10,
          date_valeur_actuelle_mandat: new Date("2025-05-06"),
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
          jalon: 2025,
          valeur_actuelle: 110,
          date_valeur_actuelle: new Date("2026-01-12"),
        });

        const utilisateur = await fixtures.utilisateur({
          id: "550e8400-e29b-41d4-a716-446655440004",
          prenom: "Jane",
          nom: "Doe",
        });

        const correlationId = "550e8400-e29b-41d4-a716-446655440005";

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 1,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 100,
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_SUPPRIMEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 2,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 100,
        });

        // When
        const result =
          await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
            indicateurId,
            habilitations,
            ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
            jalon,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["DEPT-02"].propositionStatutTerritoire).toEqual({
          statut: "PROPOSITION_VALEUR_SUPPRIMEE",
          date: "2026-01-12",
          dateTime: "2026-01-12T00:00:00.000Z",
        });
        expect(result["DEPT-02"].propositionStatutDirectionProjet).toBeNull();
      }),
    );

    it(
      "lorsque le dernier évènement en date est de type PROPOSITION_VALEUR_CREEE, le propositionStatutTerritoire est PROPOSITION_VALEUR_CREEE et le propositionStatutDirectionProjet est null",
      createIntegrationTest(async () => {
        // Given
        const chantiersIds = ["CH-001"];
        const indicateurId = "IND-001";
        const territoireCodes = ["DEPT-02", "DEPT-01"];
        const jalon = 2025;
        const habilitations: Habilitations = {
          gestionUtilisateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          lecture: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieCommentaire: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieIndicateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          responsabilite: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
        };

        const chantier = await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          ministeres: ["1009"],
          ministeres_acronymes: ["MINA"],
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "FRANCE",
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier.id,
          unite_mesure: "kg",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
          date_valeur_actuelle_mandat: new Date("2026-01-12"),
          evolution_avancement: [
            {
              date: new Date("2026-01-12"),
              valeur: 100,
            },
            {
              date: new Date("2026-01-14"),
              valeur: 110,
            },
          ],
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
          valeur_actuelle_mandat: 10,
          date_valeur_actuelle_mandat: new Date("2025-05-06"),
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
          jalon: 2025,
          valeur_actuelle: 110,
          date_valeur_actuelle: new Date("2026-01-12"),
        });

        const utilisateur = await fixtures.utilisateur({
          id: "550e8400-e29b-41d4-a716-446655440005",
          prenom: "Jane",
          nom: "Doe",
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 1,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: "550e8400-e29b-41d4-a716-446655440006",
          valeur: 100,
        });

        // When
        const result =
          await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
            indicateurId,
            habilitations,
            ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
            jalon,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["DEPT-02"].propositionStatutTerritoire).toEqual({
          statut: "PROPOSITION_VALEUR_CREEE",
          date: "2026-01-12",
          dateTime: "2026-01-12T00:00:00.000Z",
        });
        expect(result["DEPT-02"].propositionStatutDirectionProjet).toBeNull();
      }),
    );

    it(
      "lorsque le dernier évènement en date est de type PROPOSITION_VALEUR_MODIFIEE, le propositionStatutTerritoire est PROPOSITION_VALEUR_MODIFIEE et le propositionStatutDirectionProjet est null",
      createIntegrationTest(async () => {
        // Given
        const chantiersIds = ["CH-001"];
        const indicateurId = "IND-001";
        const territoireCodes = ["DEPT-02", "DEPT-01"];
        const jalon = 2025;
        const habilitations: Habilitations = {
          gestionUtilisateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          lecture: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieCommentaire: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieIndicateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          responsabilite: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
        };

        const chantier = await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          ministeres: ["1009"],
          ministeres_acronymes: ["MINA"],
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "FRANCE",
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier.id,
          unite_mesure: "kg",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
          date_valeur_actuelle_mandat: new Date("2026-01-12"),
          evolution_avancement: [
            {
              date: new Date("2026-01-12"),
              valeur: 100,
            },
            {
              date: new Date("2026-01-14"),
              valeur: 110,
            },
          ],
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
          valeur_actuelle_mandat: 10,
          date_valeur_actuelle_mandat: new Date("2025-05-06"),
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
          jalon: 2025,
          valeur_actuelle: 110,
          date_valeur_actuelle: new Date("2026-01-12"),
        });

        const utilisateur = await fixtures.utilisateur({
          id: "550e8400-e29b-41d4-a716-446655440006",
          prenom: "Jane",
          nom: "Doe",
        });

        const correlationId = "550e8400-e29b-41d4-a716-446655440007";

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 1,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 10,
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 2,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 100,
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 3,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 90,
        });

        // When
        const result =
          await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
            indicateurId,
            habilitations,
            ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
            jalon,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["DEPT-02"].propositionStatutTerritoire).toEqual({
          statut: "PROPOSITION_VALEUR_MODIFIEE",
          date: "2026-01-12",
          dateTime: "2026-01-12T00:00:00.000Z",
        });
        expect(result["DEPT-02"].propositionStatutDirectionProjet).toBeNull();
      }),
    );

    it(
      "s'assure que les événements sur différentes dates ne s'impactent pas mutuellement",
      createIntegrationTest(async () => {
        // Given
        const chantiersIds = ["CH-001"];
        const indicateurId = "IND-001";
        const territoireCodes = ["DEPT-02", "DEPT-01"];
        const jalon = 2025;
        const habilitations: Habilitations = {
          gestionUtilisateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          lecture: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieCommentaire: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieIndicateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          responsabilite: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
        };

        const chantier = await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          ministeres: ["1009"],
          ministeres_acronymes: ["MINA"],
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "FRANCE",
        });
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier.id,
          unite_mesure: "kg",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
          date_valeur_actuelle_mandat: new Date("2026-01-12"),
          evolution_avancement: [
            {
              date: new Date("2026-01-12"),
              valeur: 100,
            },
            {
              date: new Date("2026-01-14"),
              valeur: 110,
            },
          ],
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          maille: "DEPT",
          code_insee: "01",
          zone_id: "D01",
          valeur_actuelle_mandat: 10,
          date_valeur_actuelle_mandat: new Date("2025-05-06"),
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
          jalon: 2025,
          valeur_actuelle: 110,
          date_valeur_actuelle: new Date("2026-01-12"),
        });

        const utilisateur = await fixtures.utilisateur();
        const correlationId = "550e8400-e29b-41d4-a716-446655440008";

        // Événement sur une date antérieure - ne devrait pas impacter
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement:
            EvenementValeurEnum.PROPOSITION_VALEUR_ACCUSEE_RECEPTION,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-10"),
          ordre: 1,
          date_modification: new Date("2026-01-10"),
          date_creation: new Date("2026-01-10"),
          correlation_id: correlationId,
          valeur: 80,
        });
        // Événements sur la date la plus récente (date_valeur_actuelle)
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 1,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: correlationId,
          valeur: 100,
        });

        // When
        const result =
          await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
            indicateurId,
            habilitations,
            ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
            jalon,
            dateDerniereExecutionDatajobs,
          );

        // Then
        // Seuls les événements de la date la plus récente (2026-01-15) sont pris en compte
        expect(result["DEPT-02"].propositionStatutTerritoire).toEqual({
          statut: "PROPOSITION_VALEUR_CREEE",
          date: "2026-01-12",
          dateTime: "2026-01-12T00:00:00.000Z",
        });
        expect(result["DEPT-02"].propositionStatutDirectionProjet).toBeNull();
      }),
    );

    it(
      "calcule le statutTauxAvancement EN_COURS quand la date de création de la proposition est postérieure à la dernière exécution des datajobs",
      createIntegrationTest(async () => {
        // Given
        const chantiersIds = ["CH-001"];
        const indicateurId = "IND-001";
        const territoireCodes = ["DEPT-02"];
        const jalon = 2025;
        const habilitations: Habilitations = {
          gestionUtilisateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          lecture: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieCommentaire: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieIndicateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          responsabilite: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
        };

        const chantier = await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          ministeres: ["1009"],
          ministeres_acronymes: ["MINA"],
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "FRANCE",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier.id,
          unite_mesure: "kg",
          statut: "PUBLIE",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
        });

        const utilisateur = await fixtures.utilisateur();

        // Postérieure à la dernière exécution des datajobs
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 1,
          date_modification: new Date("2026-02-13"),
          date_creation: new Date("2026-02-13"),
          correlation_id: "550e8400-e29b-41d4-a716-446655440002",
          valeur: 100,
        });

        // When
        const result =
          await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
            indicateurId,
            habilitations,
            ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
            jalon,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["DEPT-02"].proposition?.statutTauxAvancement).toEqual(
          "EN_COURS",
        );
      }),
    );

    it(
      "calcule le statutTauxAvancement CALCULE quand la date de création de la proposition est antérieure à la dernière exécution des datajobs",
      createIntegrationTest(async () => {
        // Given
        const chantiersIds = ["CH-001"];
        const indicateurId = "IND-001";
        const territoireCodes = ["DEPT-02"];
        const jalon = 2025;
        const habilitations: Habilitations = {
          gestionUtilisateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          lecture: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieCommentaire: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieIndicateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          responsabilite: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
        };

        const chantier = await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          ministeres: ["1009"],
          ministeres_acronymes: ["MINA"],
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "FRANCE",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier.id,
          unite_mesure: "kg",
          statut: "PUBLIE",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-02",
          maille: "DEPT",
          code_insee: "02",
          zone_id: "D02",
        });

        const utilisateur = await fixtures.utilisateur();

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          id_auteur_modification: utilisateur.id,
          date_valeur: new Date("2026-01-12"),
          ordre: 1,
          date_modification: new Date("2026-01-12"),
          date_creation: new Date("2026-01-12"),
          correlation_id: "550e8400-e29b-41d4-a716-446655440002",
          valeur: 100,
        });

        // When
        const result =
          await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
            indicateurId,
            habilitations,
            ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
            jalon,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["DEPT-02"].proposition?.statutTauxAvancement).toEqual(
          "CALCULE",
        );
      }),
    );

    it(
      "calcule dateImport comme la date_creation la plus récente des événements VALEUR_CREEE et VALEUR_MODIFIEE antérieurs à la date de dernière exécution des datajobs",
      createIntegrationTest(async () => {
        // Given
        const chantiersIds = ["CH-001"];
        const indicateurId = "IND-001";
        const territoireCodes = ["DEPT-01", "DEPT-02", "DEPT-03"];
        const jalon = 2025;
        const habilitations: Habilitations = {
          gestionUtilisateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          lecture: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieCommentaire: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieIndicateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          responsabilite: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
        };

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
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-03",
          code_insee: "03",
          maille: "DEPT",
          zone_id: "D03",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: indicateurId,
          chantier_id: chantier.id,
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-02",
          code_insee: "02",
          maille: "DEPT",
          zone_id: "D02",
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-03",
          code_insee: "03",
          maille: "DEPT",
          zone_id: "D03",
        });

        const utilisateur = await fixtures.utilisateur();

        // DEPT-01 : événements VALEUR_CREEE et VALEUR_MODIFIEE avant dateDerniereExecutionDatajobs
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-01",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          date_creation: new Date("2026-01-10T00:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-01",
          type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
          date_creation: new Date("2026-01-15T00:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
        });

        // DEPT-02 : uniquement des événements PROPOSITION_* (pas d'import)
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-02",
          type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
          date_creation: new Date("2026-01-10T00:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
        });

        // DEPT-03 : événements après dateDerniereExecutionDatajobs (pas d'import)
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-03",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          date_creation: new Date("2026-03-01T00:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
        });

        // When
        const result =
          await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
            indicateurId,
            habilitations,
            ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
            jalon,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["DEPT-01"].dateImport).toEqual(
          new Date("2026-01-15T00:00:00.000Z").toLocaleString(),
        );
        expect(result["DEPT-02"].dateImport).toBeNull();
        expect(result["DEPT-03"].dateImport).toBeNull();
      }),
    );

    it(
      "pour un indicateur agrégé NAT avec va_nat_from=DEPT, calcule dateImport à partir des événements DEPT",
      createIntegrationTest(async () => {
        // Given
        const chantiersIds = ["CH-001"];
        const indicateurId = "IND-001";
        const territoireCodes = ["NAT-FR"];
        const jalon = 2025;
        const habilitations: Habilitations = {
          gestionUtilisateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          lecture: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieCommentaire: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieIndicateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          responsabilite: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
        };

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
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: indicateurId,
          chantier_id: chantier.id,
        });

        await fixtures.metadataParametrageIndicateurs({
          indic_id: indicateur.id,
          va_nat_from: "DEPT",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });

        const utilisateur = await fixtures.utilisateur();

        // Événement NAT-FR (ne doit pas être utilisé car va_nat_from=DEPT)
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          date_creation: new Date("2026-01-01T00:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
        });

        // Événements DEPT-01 (doivent être utilisés)
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-01",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          date_creation: new Date("2026-01-20T00:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
        });

        // When
        const result =
          await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
            indicateurId,
            habilitations,
            ProfilEnum.DITP_ADMIN,
            jalon,
            dateDerniereExecutionDatajobs,
          );

        // Then
        // NAT-FR utilise les événements DEPT (date: 2026-01-20)
        expect(result["NAT-FR"].dateImport).toEqual(
          new Date("2026-01-20T00:00:00.000Z").toLocaleString(),
        );
      }),
    );

    it(
      "pour un indicateur agrégé REG avec va_reg_from=DEPT, calcule dateImport à partir des événements DEPT enfants",
      createIntegrationTest(async () => {
        // Given
        const chantiersIds = ["CH-001"];
        const indicateurId = "IND-001";
        const territoireCodes = ["REG-84"];
        const jalon = 2025;
        const habilitations: Habilitations = {
          gestionUtilisateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          lecture: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieCommentaire: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieIndicateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          responsabilite: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
        };

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
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: indicateurId,
          chantier_id: chantier.id,
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
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
        });

        const utilisateur = await fixtures.utilisateur();

        // Événement REG-84 (ne doit pas être utilisé car va_reg_from=DEPT)
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "REG-84",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          date_creation: new Date("2026-01-01T00:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
        });

        // Événements DEPT-01 (doivent être utilisés)
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "DEPT-01",
          type_evenement: EvenementValeurEnum.VALEUR_CREEE,
          date_creation: new Date("2026-01-25T00:00:00.000Z"),
          id_auteur_modification: utilisateur.id,
        });

        // When
        const result =
          await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
            indicateurId,
            habilitations,
            ProfilEnum.DITP_ADMIN,
            jalon,
            dateDerniereExecutionDatajobs,
          );

        // Then
        // REG-84 utilise les événements DEPT (date: 2026-01-25)
        expect(result["REG-84"].dateImport).toEqual(
          new Date("2026-01-25T00:00:00.000Z").toLocaleString(),
        );
      }),
    );
  });

  describe("#recupererIndicateursNonAJourParChantierId", () => {
    it(
      "doit retourner les indicateurs non à jour (est_a_jour = false ou null) pour tous les chantiers publiés",
      createIntegrationTest(async () => {
        // Given
        const chantier1 = await fixtures.chantierIdentite({
          id: "CH-001",
          statut: "PUBLIE",
        });
        const chantier2 = await fixtures.chantierIdentite({
          id: "CH-002",
          statut: "PUBLIE",
        });

        await fixtures.chantierTerritoire({
          id: chantier1.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });
        await fixtures.chantierTerritoire({
          id: chantier2.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });

        const indicateur1 = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier1.id,
          statut: "PUBLIE",
        });
        const indicateur2 = await fixtures.indicateurIdentite({
          id: "IND-002",
          nom: "Indicateur 002",
          chantier_id: chantier1.id,
          statut: "PUBLIE",
        });
        const indicateur3 = await fixtures.indicateurIdentite({
          id: "IND-003",
          nom: "Indicateur 003",
          chantier_id: chantier2.id,
          statut: "PUBLIE",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur1.id,
          chantier_id: chantier1.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
          est_a_jour: false,
        });
        await fixtures.indicateurTerritoire({
          id: indicateur2.id,
          chantier_id: chantier1.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
          est_a_jour: true,
        });
        await fixtures.indicateurTerritoire({
          id: indicateur3.id,
          chantier_id: chantier2.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
          est_a_jour: null,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererIndicateursNonAJourParChantierId();

        // Then
        expect(result.size).toEqual(2);
        expect(result.get("CH-001")).toEqual(
          expect.arrayContaining([
            { id: "IND-001", nom: "Indicateur 001", mailles: ["NAT"] },
          ]),
        );
        expect(result.get("CH-002")).toEqual([
          { id: "IND-003", nom: "Indicateur 003", mailles: ["NAT"] },
        ]);
      }),
    );

    it(
      "doit exclure les indicateurs avec est_applicable = false ou null",
      createIntegrationTest(async () => {
        // Given
        const chantier = await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          statut: "PUBLIE",
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });

        // IND-001: est_applicable = false
        const indicateur1 = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier.id,
          statut: "PUBLIE",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur1.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: false,
          est_a_jour: false,
        });

        // IND-002: est_applicable = null
        const indicateur2 = await fixtures.indicateurIdentite({
          id: "IND-002",
          nom: "Indicateur 002",
          chantier_id: chantier.id,
          statut: "PUBLIE",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur2.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: null,
          est_a_jour: false,
        });

        // IND-003: est_applicable = true (seul inclus)
        const indicateur3 = await fixtures.indicateurIdentite({
          id: "IND-003",
          nom: "Indicateur 003",
          chantier_id: chantier.id,
          statut: "PUBLIE",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur3.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
          est_a_jour: false,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererIndicateursNonAJourParChantierId();

        // Then
        expect(result.size).toEqual(1);
        expect(result.get("CH-001")).toEqual([
          { id: "IND-003", nom: "Indicateur 003", mailles: ["NAT"] },
        ]);
      }),
    );

    it(
      "doit retourner une Map vide si aucun indicateur n'est non à jour",
      createIntegrationTest(async () => {
        // Given
        const chantier = await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          statut: "PUBLIE",
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier.id,
          statut: "PUBLIE",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
          est_a_jour: true,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererIndicateursNonAJourParChantierId();

        // Then
        expect(result.size).toEqual(0);
      }),
    );

    it(
      "doit retourner seulement les chantiers ayant au moins un indicateur non à jour",
      createIntegrationTest(async () => {
        // Given
        const chantier1 = await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          statut: "PUBLIE",
        });

        await fixtures.chantierTerritoire({
          id: chantier1.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });

        const chantier2 = await fixtures.chantierIdentite({
          id: "CH-002",
          nom: "Chantier 002",
          statut: "PUBLIE",
        });

        await fixtures.chantierTerritoire({
          id: chantier2.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });

        // CH-001: indicateur non à jour
        const indicateur1 = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier1.id,
          statut: "PUBLIE",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur1.id,
          chantier_id: chantier1.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
          est_a_jour: false,
        });

        // CH-002: indicateur à jour
        const indicateur2 = await fixtures.indicateurIdentite({
          id: "IND-002",
          nom: "Indicateur 002",
          chantier_id: chantier2.id,
          statut: "PUBLIE",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur2.id,
          chantier_id: chantier2.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
          est_a_jour: true,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererIndicateursNonAJourParChantierId();

        // Then
        expect(result.size).toEqual(1);
        expect(result.get("CH-001")).toEqual([
          { id: "IND-001", nom: "Indicateur 001", mailles: ["NAT"] },
        ]);
        expect(result.has("CH-002")).toEqual(false);
      }),
    );

    it(
      "ne doit pas retourner les chantiers et les indicateurs non publiés",
      // Given
      createIntegrationTest(async () => {
        const chantier1 = await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          statut: "PUBLIE",
        });

        await fixtures.chantierTerritoire({
          id: chantier1.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });

        const chantier2 = await fixtures.chantierIdentite({
          id: "CH-002",
          nom: "Chantier 002",
          statut: "BROUILLON",
        });

        await fixtures.chantierTerritoire({
          id: chantier2.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });

        const indicateur1 = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier1.id,
          statut: "PUBLIE",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur1.id,
          chantier_id: chantier1.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
          est_a_jour: false,
        });

        const indicateur2 = await fixtures.indicateurIdentite({
          id: "IND-002",
          nom: "Indicateur 002",
          chantier_id: chantier1.id,
          statut: "SUPPRIME",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur2.id,
          chantier_id: chantier1.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
          est_a_jour: false,
        });

        const indicateur3 = await fixtures.indicateurIdentite({
          id: "IND-003",
          nom: "Indicateur 003",
          chantier_id: chantier2.id,
          statut: "PUBLIE",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur3.id,
          chantier_id: chantier2.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
          est_a_jour: false,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererIndicateursNonAJourParChantierId();

        // Then
        expect(result.size).toEqual(1);
        expect(result.get("CH-001")).toEqual([
          { id: "IND-001", nom: "Indicateur 001", mailles: ["NAT"] },
        ]);
        expect(result.has("CH-002")).toEqual(false);
      }),
    );

    it(
      "doit regrouper les mailles non à jour pour un même indicateur",
      createIntegrationTest(async () => {
        // Given

        const chantier = await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          statut: "PUBLIE",
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          zone_id: "REG-11",
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-75",
          code_insee: "75",
          maille: "DEPT",
          zone_id: "DEPT-75",
        });

        const indicateur1 = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier.id,
          type_id: "IMPACT",
          statut: "PUBLIE",
        });

        fixtures.indicateurTerritoire({
          id: indicateur1.id,
          chantier_id: chantier.id,
          maille: "NAT",
          territoire_code: "NAT-FR",
          code_insee: "FR",
          zone_id: "FRANCE",
          est_applicable: true,
          est_a_jour: false,
        });

        fixtures.indicateurTerritoire({
          id: indicateur1.id,
          chantier_id: chantier.id,
          maille: "REG",
          territoire_code: "REG-11",
          code_insee: "11",
          zone_id: "REG-11",
          est_applicable: true,
          est_a_jour: null,
        });

        fixtures.indicateurTerritoire({
          id: indicateur1.id,
          chantier_id: chantier.id,
          maille: "DEPT",
          territoire_code: "DEPT-75",
          code_insee: "75",
          zone_id: "DEPT-75",
          est_applicable: true,
          est_a_jour: true,
        });

        const indicateur2 = await fixtures.indicateurIdentite({
          id: "IND-002",
          nom: "Indicateur 002",
          chantier_id: chantier.id,
          type_id: "IMPACT",
          statut: "PUBLIE",
        });

        fixtures.indicateurTerritoire({
          id: indicateur2.id,
          chantier_id: chantier.id,
          maille: "NAT",
          territoire_code: "NAT-FR",
          code_insee: "FR",
          zone_id: "FRANCE",
          est_applicable: true,
          est_a_jour: true,
        });

        fixtures.indicateurTerritoire({
          id: indicateur2.id,
          chantier_id: chantier.id,
          maille: "REG",
          territoire_code: "REG-11",
          code_insee: "11",
          zone_id: "REG-11",
          est_applicable: true,
          est_a_jour: false,
        });

        fixtures.indicateurTerritoire({
          id: indicateur2.id,
          chantier_id: chantier.id,
          maille: "DEPT",
          territoire_code: "DEPT-75",
          code_insee: "75",
          zone_id: "DEPT-75",
          est_applicable: true,
          est_a_jour: false,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererIndicateursNonAJourParChantierId();

        // Then
        expect(result.size).toEqual(1);
        expect(result.get("CH-001")).toEqual([
          {
            id: "IND-001",
            nom: "Indicateur 001",
            mailles: expect.arrayContaining(["NAT", "REG"]),
          },
          {
            id: "IND-002",
            nom: "Indicateur 002",
            mailles: expect.arrayContaining(["REG", "DEPT"]),
          },
        ]);
        expect(result.get("CH-001")![0].mailles).toHaveLength(2);
        expect(result.get("CH-001")![1].mailles).toHaveLength(2);
      }),
    );
  });

  describe("#recupererIndicateursAParametrerParChantierId", () => {
    it(
      "doit retourner les indicateurs sans valeur_initiale",
      createIntegrationTest(async () => {
        // Given
        const chantier = await fixtures.chantierIdentite({
          id: "CH-001",
          statut: "PUBLIE",
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier.id,
          statut: "PUBLIE",
        });

        // valeur_initiale null, valeur_cible renseignée
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
          est_a_jour: true,
          valeur_initiale: null,
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
          valeur_cible: 100,
          date_valeur_cible: new Date("2025-12-31"),
          valeur_actuelle: 50,
          date_valeur_actuelle: new Date("2025-06-01"),
          taux_avancement: 50,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererIndicateursAParametrerParChantierId(
            2025,
          );

        // Then
        expect(result.size).toEqual(1);
        expect(result.get("CH-001")).toEqual([
          { id: "IND-001", nom: "Indicateur 001" },
        ]);
      }),
    );

    it(
      "doit retourner les indicateurs sans valeur_cible sur le jalon donné pour au moins un territoire",
      createIntegrationTest(async () => {
        // Given
        const chantier = await fixtures.chantierIdentite({
          id: "CH-001",
          statut: "PUBLIE",
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          zone_id: "REG-11",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier.id,
          statut: "PUBLIE",
        });

        // NAT: valeur_initiale renseignée
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
          est_a_jour: true,
          valeur_initiale: 10,
        });

        // NAT: valeur_cible renseignée sur le jalon 2025
        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
          valeur_cible: 100,
          date_valeur_cible: new Date("2025-12-31"),
          valeur_actuelle: 50,
          date_valeur_actuelle: new Date("2025-06-01"),
          taux_avancement: 50,
        });

        // REG: valeur_initiale renseignée
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          zone_id: "REG-11",
          est_applicable: true,
          est_a_jour: true,
          valeur_initiale: 10,
        });

        // REG: valeur_cible null sur le jalon 2025
        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "REG-11",
          code_insee: "11",
          maille: "REG",
          zone_id: "REG-11",
          jalon: 2025,
          valeur_cible: null,
          date_valeur_cible: null,
          valeur_actuelle: 50,
          date_valeur_actuelle: new Date("2025-06-01"),
          taux_avancement: 50,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererIndicateursAParametrerParChantierId(
            2025,
          );

        // Then
        expect(result.size).toEqual(1);
        expect(result.get("CH-001")).toEqual([
          { id: "IND-001", nom: "Indicateur 001" },
        ]);
      }),
    );

    it(
      "ne doit pas retourner les indicateurs ayant valeur_initiale ET valeur_cible renseignées",
      createIntegrationTest(async () => {
        // Given
        const chantier = await fixtures.chantierIdentite({
          id: "CH-001",
          statut: "PUBLIE",
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier.id,
          statut: "PUBLIE",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
          est_a_jour: true,
          valeur_initiale: 10,
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
          valeur_cible: 100,
          date_valeur_cible: new Date("2025-12-31"),
          valeur_actuelle: 50,
          date_valeur_actuelle: new Date("2025-06-01"),
          taux_avancement: 50,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererIndicateursAParametrerParChantierId(
            2025,
          );

        // Then
        expect(result.size).toEqual(0);
      }),
    );

    it(
      "doit filtrer par statut publié des chantiers et indicateurs",
      createIntegrationTest(async () => {
        // Given
        const chantierPublie = await fixtures.chantierIdentite({
          id: "CH-001",
          statut: "PUBLIE",
        });

        await fixtures.chantierTerritoire({
          id: chantierPublie.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });

        const chantierBrouillon = await fixtures.chantierIdentite({
          id: "CH-002",
          statut: "BROUILLON",
        });

        await fixtures.chantierTerritoire({
          id: chantierBrouillon.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });

        // Indicateur publié sur chantier publié (doit apparaitre)
        const indicateur1 = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantierPublie.id,
          statut: "PUBLIE",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur1.id,
          chantier_id: chantierPublie.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
          valeur_initiale: null,
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur1.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
          valeur_cible: 100,
          date_valeur_cible: new Date("2025-12-31"),
          valeur_actuelle: 50,
          date_valeur_actuelle: new Date("2025-06-01"),
          taux_avancement: 50,
        });

        // Indicateur supprimé sur chantier publié (ne doit pas apparaitre)
        const indicateur2 = await fixtures.indicateurIdentite({
          id: "IND-002",
          nom: "Indicateur 002",
          chantier_id: chantierPublie.id,
          statut: "SUPPRIME",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur2.id,
          chantier_id: chantierPublie.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
          valeur_initiale: null,
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur2.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
          valeur_cible: 100,
          date_valeur_cible: new Date("2025-12-31"),
          valeur_actuelle: 50,
          date_valeur_actuelle: new Date("2025-06-01"),
          taux_avancement: 50,
        });

        // Indicateur publié sur chantier brouillon (ne doit pas apparaitre)
        const indicateur3 = await fixtures.indicateurIdentite({
          id: "IND-003",
          nom: "Indicateur 003",
          chantier_id: chantierBrouillon.id,
          statut: "PUBLIE",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur3.id,
          chantier_id: chantierBrouillon.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
          valeur_initiale: null,
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur3.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
          valeur_cible: 100,
          date_valeur_cible: new Date("2025-12-31"),
          valeur_actuelle: 50,
          date_valeur_actuelle: new Date("2025-06-01"),
          taux_avancement: 50,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererIndicateursAParametrerParChantierId(
            2025,
          );

        // Then
        expect(result.size).toEqual(1);
        expect(result.get("CH-001")).toEqual([
          { id: "IND-001", nom: "Indicateur 001" },
        ]);
        expect(result.has("CH-002")).toEqual(false);
      }),
    );

    it(
      "doit exclure les indicateurs avec est_applicable = false ou null",
      createIntegrationTest(async () => {
        // Given
        const chantier = await fixtures.chantierIdentite({
          id: "CH-001",
          statut: "PUBLIE",
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });

        // est_applicable = false
        const indicateur1 = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier.id,
          statut: "PUBLIE",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur1.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: false,
          valeur_initiale: null,
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur1.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
          valeur_cible: 100,
          date_valeur_cible: new Date("2025-12-31"),
          valeur_actuelle: 50,
          date_valeur_actuelle: new Date("2025-06-01"),
          taux_avancement: 50,
        });

        // est_applicable = true (seul inclus)
        const indicateur2 = await fixtures.indicateurIdentite({
          id: "IND-002",
          nom: "Indicateur 002",
          chantier_id: chantier.id,
          statut: "PUBLIE",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur2.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
          valeur_initiale: null,
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur2.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
          valeur_cible: 100,
          date_valeur_cible: new Date("2025-12-31"),
          valeur_actuelle: 50,
          date_valeur_actuelle: new Date("2025-06-01"),
          taux_avancement: 50,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererIndicateursAParametrerParChantierId(
            2025,
          );

        // Then
        expect(result.size).toEqual(1);
        expect(result.get("CH-001")).toEqual([
          { id: "IND-002", nom: "Indicateur 002" },
        ]);
      }),
    );

    it(
      "doit retourner une Map vide quand tous les indicateurs sont paramétrés",
      createIntegrationTest(async () => {
        // Given
        const chantier = await fixtures.chantierIdentite({
          id: "CH-001",
          statut: "PUBLIE",
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier.id,
          statut: "PUBLIE",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
          valeur_initiale: 10,
        });

        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
          valeur_cible: 100,
          date_valeur_cible: new Date("2025-12-31"),
          valeur_actuelle: 50,
          date_valeur_actuelle: new Date("2025-06-01"),
          taux_avancement: 50,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererIndicateursAParametrerParChantierId(
            2025,
          );

        // Then
        expect(result.size).toEqual(0);
      }),
    );

    it(
      "ne doit pas retourner un indicateur sans valeur_cible sur un jalon différent du jalon demandé",
      createIntegrationTest(async () => {
        // Given
        const chantier = await fixtures.chantierIdentite({
          id: "CH-001",
          statut: "PUBLIE",
        });

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });

        const indicateur = await fixtures.indicateurIdentite({
          id: "IND-001",
          nom: "Indicateur 001",
          chantier_id: chantier.id,
          statut: "PUBLIE",
        });

        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
          valeur_initiale: 10,
        });

        // valeur_cible null sur jalon 2024
        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2024,
          valeur_cible: null,
          date_valeur_cible: null,
          valeur_actuelle: 50,
          date_valeur_actuelle: new Date("2024-06-01"),
          taux_avancement: 50,
        });

        // valeur_cible renseignée sur jalon 2025
        await fixtures.indicateurTerritoireJalon({
          id: indicateur.id,
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
          valeur_cible: 100,
          date_valeur_cible: new Date("2025-12-31"),
          valeur_actuelle: 50,
          date_valeur_actuelle: new Date("2025-06-01"),
          taux_avancement: 50,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererIndicateursAParametrerParChantierId(
            2025,
          );

        // Then
        expect(result.size).toEqual(0);
      }),
    );
  });

  describe("#recupererPourExports", () => {
    const CHANTIER_ID = "CH-001";

    describe("filtrage", () => {
      it(
        "doit exclure les indicateurs supprimés",
        createIntegrationTest(async () => {
          // Given
          await fixtures.chantierIdentite({
            id: CHANTIER_ID,
            ministeres: ["MINEDU"],
          });
          await fixtures.chantierTerritoire({
            id: CHANTIER_ID,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            est_applicable: true,
          });
          const indicateur = await fixtures.indicateurIdentite({
            chantier_id: CHANTIER_ID,
            statut: $Enums.type_statut_indicateur.SUPPRIME,
          });
          await fixtures.indicateurTerritoire({
            id: indicateur.id,
            chantier_id: CHANTIER_ID,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
          });

          // When
          const result = await prismaIndicateurRepository.recupererPourExports(
            CHANTIER_ID,
            ["NAT-FR"],
            2025,
            2025,
          );

          // Then
          expect(result).toEqual([]);
        }),
      );

      it(
        "doit exclure les indicateurs dont le chantier n'a aucun ministère",
        createIntegrationTest(async () => {
          // Given
          await fixtures.chantierIdentite({ id: CHANTIER_ID, ministeres: [] });
          await fixtures.chantierTerritoire({
            id: CHANTIER_ID,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            est_applicable: true,
          });
          const indicateur = await fixtures.indicateurIdentite({
            chantier_id: CHANTIER_ID,
          });
          await fixtures.indicateurTerritoire({
            id: indicateur.id,
            chantier_id: CHANTIER_ID,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
          });

          // When
          const result = await prismaIndicateurRepository.recupererPourExports(
            CHANTIER_ID,
            ["NAT-FR"],
            2025,
            2025,
          );

          // Then
          expect(result).toEqual([]);
        }),
      );

      it(
        "doit exclure les indicateurs dont le chantier_territoire n'est pas applicable",
        createIntegrationTest(async () => {
          // Given
          await fixtures.chantierIdentite({
            id: CHANTIER_ID,
            ministeres: ["MINEDU"],
          });
          await fixtures.chantierTerritoire({
            id: CHANTIER_ID,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            est_applicable: false,
          });
          const indicateur = await fixtures.indicateurIdentite({
            chantier_id: CHANTIER_ID,
          });
          await fixtures.indicateurTerritoire({
            id: indicateur.id,
            chantier_id: CHANTIER_ID,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
          });

          // When
          const result = await prismaIndicateurRepository.recupererPourExports(
            CHANTIER_ID,
            ["NAT-FR"],
            2025,
            2025,
          );

          // Then
          expect(result).toEqual([]);
        }),
      );

      it(
        "doit exclure les indicateurs dont le territoire_code n'est pas dans territoireCodesLecture",
        createIntegrationTest(async () => {
          // Given
          await fixtures.chantierIdentite({
            id: CHANTIER_ID,
            ministeres: ["MINEDU"],
          });
          await fixtures.chantierTerritoire({
            id: CHANTIER_ID,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            est_applicable: true,
          });
          const indicateur = await fixtures.indicateurIdentite({
            chantier_id: CHANTIER_ID,
          });
          await fixtures.indicateurTerritoire({
            id: indicateur.id,
            chantier_id: CHANTIER_ID,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
          });

          // When : seul REG-84 est demandé, NAT-FR ne doit pas apparaître
          const result = await prismaIndicateurRepository.recupererPourExports(
            CHANTIER_ID,
            ["REG-84"],
            2025,
            2025,
          );

          // Then
          expect(result).toEqual([]);
        }),
      );
    });

    describe("données du jalon", () => {
      it(
        "doit retourner les valeurs (actuelle, cible, taux) correspondant au jalon spécifié",
        createIntegrationTest(async () => {
          // Given
          await fixtures.chantierIdentite({
            id: CHANTIER_ID,
            ministeres: ["MINEDU"],
          });
          await fixtures.chantierTerritoire({
            id: CHANTIER_ID,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            est_applicable: true,
          });
          const indicateur = await fixtures.indicateurIdentite({
            chantier_id: CHANTIER_ID,
          });
          await fixtures.indicateurTerritoire({
            id: indicateur.id,
            chantier_id: CHANTIER_ID,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
          });
          // Jalon 2024 — ne doit pas apparaître dans le résultat
          await fixtures.indicateurTerritoireJalon({
            id: indicateur.id,
            territoire_code: "NAT-FR",
            jalon: 2024,
            valeur_actuelle: 10,
            valeur_cible: 90,
            taux_avancement: 11,
          });
          // Jalon 2025 — attendu dans le résultat
          await fixtures.indicateurTerritoireJalon({
            id: indicateur.id,
            territoire_code: "NAT-FR",
            jalon: 2025,
            valeur_actuelle: 80,
            date_valeur_actuelle: new Date("2025-06-01"),
            valeur_cible: 100,
            date_valeur_cible: new Date("2025-12-31"),
            taux_avancement: 75,
          });

          // When
          const result = await prismaIndicateurRepository.recupererPourExports(
            CHANTIER_ID,
            ["NAT-FR"],
            2025,
            2025,
          );

          // Then
          expect(result).toEqual([
            expect.objectContaining({
              valeurAvancement: 80,
              dateValeurAvancement: new Date("2025-06-01").toISOString(),
              valeurCible: 100,
              dateValeurCible: new Date("2025-12-31").toISOString(),
              avancement: 75,
            }),
          ]);
        }),
      );

      it(
        "doit retourner des valeurs null quand aucun enregistrement n'existe pour le jalon demandé",
        createIntegrationTest(async () => {
          // Given : aucun indicateur_territoire_jalon créé pour le jalon 2026
          await fixtures.chantierIdentite({
            id: CHANTIER_ID,
            ministeres: ["MINEDU"],
          });
          await fixtures.chantierTerritoire({
            id: CHANTIER_ID,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            est_applicable: true,
          });
          const indicateur = await fixtures.indicateurIdentite({
            chantier_id: CHANTIER_ID,
          });
          await fixtures.indicateurTerritoire({
            id: indicateur.id,
            chantier_id: CHANTIER_ID,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
          });

          // When
          const result = await prismaIndicateurRepository.recupererPourExports(
            CHANTIER_ID,
            ["NAT-FR"],
            2026,
            2025,
          );

          // Then
          expect(result).toEqual([
            expect.objectContaining({
              valeurAvancement: null,
              dateValeurAvancement: null,
              valeurCible: null,
              dateValeurCible: null,
              avancement: null,
            }),
          ]);
        }),
      );

      it(
        "doit retourner le taux d'avancement chantier du jalon sélectionné et du jalon par défaut séparément",
        createIntegrationTest(async () => {
          // Given
          await fixtures.chantierIdentite({
            id: CHANTIER_ID,
            ministeres: ["MINEDU"],
          });
          await fixtures.chantierTerritoire({
            id: CHANTIER_ID,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            est_applicable: true,
          });
          const indicateur = await fixtures.indicateurIdentite({
            chantier_id: CHANTIER_ID,
          });
          await fixtures.indicateurTerritoire({
            id: indicateur.id,
            chantier_id: CHANTIER_ID,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
          });
          // jalon par défaut 2025 → taux 60
          await fixtures.chantierTerritoireJalon({
            id: CHANTIER_ID,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            jalon: 2025,
            taux_avancement: 60,
          });
          // jalon sélectionné 2026 → taux 80
          await fixtures.chantierTerritoireJalon({
            id: CHANTIER_ID,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            jalon: 2026,
            taux_avancement: 80,
          });

          // When
          const result = await prismaIndicateurRepository.recupererPourExports(
            CHANTIER_ID,
            ["NAT-FR"],
            2026,
            2025,
          );

          // Then
          expect(result).toEqual([
            expect.objectContaining({
              chantierAvancement: 80,
              chantierAvancementJalonParDefaut: 60,
            }),
          ]);
        }),
      );
    });

    describe("chantierAUnePropositionValeurAvancement", () => {
      it(
        "doit être true pour une maille DEPT avec des propositions de valeur d'avancement",
        createIntegrationTest(async () => {
          // Given
          await fixtures.chantierIdentite({
            id: CHANTIER_ID,
            ministeres: ["MINEDU"],
          });
          await fixtures.chantierTerritoire({
            id: CHANTIER_ID,
            territoire_code: "DEPT-01",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
            est_applicable: true,
            nombre_propositions_valeur_actuelle: 2,
          });
          const indicateur = await fixtures.indicateurIdentite({
            chantier_id: CHANTIER_ID,
          });
          await fixtures.indicateurTerritoire({
            id: indicateur.id,
            chantier_id: CHANTIER_ID,
            territoire_code: "DEPT-01",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
          });

          // When
          const result = await prismaIndicateurRepository.recupererPourExports(
            CHANTIER_ID,
            ["DEPT-01"],
            2025,
            2025,
          );

          // Then
          expect(result).toEqual([
            expect.objectContaining({
              chantierAUnePropositionValeurAvancement: true,
            }),
          ]);
        }),
      );

      it(
        "doit être false pour une maille DEPT sans proposition de valeur d'avancement",
        createIntegrationTest(async () => {
          // Given
          await fixtures.chantierIdentite({
            id: CHANTIER_ID,
            ministeres: ["MINEDU"],
          });
          await fixtures.chantierTerritoire({
            id: CHANTIER_ID,
            territoire_code: "DEPT-01",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
            est_applicable: true,
            nombre_propositions_valeur_actuelle: 0,
          });
          const indicateur = await fixtures.indicateurIdentite({
            chantier_id: CHANTIER_ID,
          });
          await fixtures.indicateurTerritoire({
            id: indicateur.id,
            chantier_id: CHANTIER_ID,
            territoire_code: "DEPT-01",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
          });

          // When
          const result = await prismaIndicateurRepository.recupererPourExports(
            CHANTIER_ID,
            ["DEPT-01"],
            2025,
            2025,
          );

          // Then
          expect(result).toEqual([
            expect.objectContaining({
              chantierAUnePropositionValeurAvancement: false,
            }),
          ]);
        }),
      );

      it(
        "doit être true pour une maille REG dont un département enfant a des propositions",
        createIntegrationTest(async () => {
          // Given : REG-84 sans propositions, DEPT-01 (enfant de REG-84) avec propositions
          await fixtures.chantierIdentite({
            id: CHANTIER_ID,
            ministeres: ["MINEDU"],
          });
          await fixtures.chantierTerritoire({
            id: CHANTIER_ID,
            territoire_code: "REG-84",
            code_insee: "84",
            maille: "REG",
            zone_id: "R84",
            est_applicable: true,
            nombre_propositions_valeur_actuelle: 0,
          });
          await fixtures.chantierTerritoire({
            id: CHANTIER_ID,
            territoire_code: "DEPT-01",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
            est_applicable: true,
            nombre_propositions_valeur_actuelle: 1,
          });
          const indicateur = await fixtures.indicateurIdentite({
            chantier_id: CHANTIER_ID,
          });
          await fixtures.indicateurTerritoire({
            id: indicateur.id,
            chantier_id: CHANTIER_ID,
            territoire_code: "REG-84",
            code_insee: "84",
            maille: "REG",
            zone_id: "R84",
          });

          // When
          const result = await prismaIndicateurRepository.recupererPourExports(
            CHANTIER_ID,
            ["REG-84"],
            2025,
            2025,
          );

          // Then
          expect(result).toEqual([
            expect.objectContaining({
              chantierAUnePropositionValeurAvancement: true,
            }),
          ]);
        }),
      );

      it(
        "doit être true pour une maille NAT quand n'importe quel territoire du chantier a des propositions",
        createIntegrationTest(async () => {
          // Given : NAT-FR sans propositions, DEPT-01 avec propositions
          await fixtures.chantierIdentite({
            id: CHANTIER_ID,
            ministeres: ["MINEDU"],
          });
          await fixtures.chantierTerritoire({
            id: CHANTIER_ID,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            est_applicable: true,
            nombre_propositions_valeur_actuelle: 0,
          });
          await fixtures.chantierTerritoire({
            id: CHANTIER_ID,
            territoire_code: "DEPT-01",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
            est_applicable: true,
            nombre_propositions_valeur_actuelle: 1,
          });
          const indicateur = await fixtures.indicateurIdentite({
            chantier_id: CHANTIER_ID,
          });
          await fixtures.indicateurTerritoire({
            id: indicateur.id,
            chantier_id: CHANTIER_ID,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
          });

          // When
          const result = await prismaIndicateurRepository.recupererPourExports(
            CHANTIER_ID,
            ["NAT-FR"],
            2025,
            2025,
          );

          // Then
          expect(result).toEqual([
            expect.objectContaining({
              chantierAUnePropositionValeurAvancement: true,
            }),
          ]);
        }),
      );
    });

    describe("chantierAUnTauxAvancementDepartemental", () => {
      it(
        "doit être true si aucun département applicable n'existe pour le chantier",
        createIntegrationTest(async () => {
          // Given : DEPT-01 non applicable
          await fixtures.chantierIdentite({
            id: CHANTIER_ID,
            ministeres: ["MINEDU"],
          });
          await fixtures.chantierTerritoire({
            id: CHANTIER_ID,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: CHANTIER_ID,
            territoire_code: "DEPT-01",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
            est_applicable: false,
            taux_avancement_mandat: null,
          });
          const indicateur = await fixtures.indicateurIdentite({
            chantier_id: CHANTIER_ID,
          });
          await fixtures.indicateurTerritoire({
            id: indicateur.id,
            chantier_id: CHANTIER_ID,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
          });

          // When
          const result = await prismaIndicateurRepository.recupererPourExports(
            CHANTIER_ID,
            ["NAT-FR"],
            2025,
            2025,
          );

          // Then
          expect(result).toEqual([
            expect.objectContaining({
              chantierAUnTauxAvancementDepartemental: true,
            }),
          ]);
        }),
      );

      it(
        "doit être true si au moins un département applicable possède un taux d'avancement non null",
        createIntegrationTest(async () => {
          // Given
          await fixtures.chantierIdentite({
            id: CHANTIER_ID,
            ministeres: ["MINEDU"],
          });
          await fixtures.chantierTerritoire({
            id: CHANTIER_ID,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: CHANTIER_ID,
            territoire_code: "DEPT-01",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
            est_applicable: true,
            taux_avancement_mandat: 50,
          });
          const indicateur = await fixtures.indicateurIdentite({
            chantier_id: CHANTIER_ID,
          });
          await fixtures.indicateurTerritoire({
            id: indicateur.id,
            chantier_id: CHANTIER_ID,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
          });

          // When
          const result = await prismaIndicateurRepository.recupererPourExports(
            CHANTIER_ID,
            ["NAT-FR"],
            2025,
            2025,
          );

          // Then
          expect(result).toEqual([
            expect.objectContaining({
              chantierAUnTauxAvancementDepartemental: true,
            }),
          ]);
        }),
      );

      it(
        "doit être false si tous les départements applicables ont un taux d'avancement null",
        createIntegrationTest(async () => {
          // Given
          await fixtures.chantierIdentite({
            id: CHANTIER_ID,
            ministeres: ["MINEDU"],
          });
          await fixtures.chantierTerritoire({
            id: CHANTIER_ID,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: CHANTIER_ID,
            territoire_code: "DEPT-01",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
            est_applicable: true,
            taux_avancement_mandat: null,
          });
          const indicateur = await fixtures.indicateurIdentite({
            chantier_id: CHANTIER_ID,
          });
          await fixtures.indicateurTerritoire({
            id: indicateur.id,
            chantier_id: CHANTIER_ID,
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
          });

          // When
          const result = await prismaIndicateurRepository.recupererPourExports(
            CHANTIER_ID,
            ["NAT-FR"],
            2025,
            2025,
          );

          // Then
          expect(result).toEqual([
            expect.objectContaining({
              chantierAUnTauxAvancementDepartemental: false,
            }),
          ]);
        }),
      );
    });
  });
});
