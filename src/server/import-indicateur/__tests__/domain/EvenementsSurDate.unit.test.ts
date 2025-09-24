import { EvenementsSurDate } from "@/server/import-indicateur/domain/EvenementsSurDate";
import { ValeurIndicateurTerritoireEvenementBuilder } from "@/server/import-indicateur/app/builder/ValeurIndicateurTerritoireEvenement.builder";
import { IndicateurDataBuilder } from "@/server/import-indicateur/app/builder/IndicateurData.builder";

describe("EvenementsSurDate", () => {
  const INDIC_ID = "IND-001";
  const TERRITOIRE_CODE = "DEPT-01";
  const DATE = "2023-01-01";
  const AUTEUR_ID = "author-123";

  const createIdentifiantFlux = (date = DATE) => ({
    indicId: INDIC_ID,
    territoireCode: TERRITOIRE_CODE,
    date,
  });

  describe("#creerEvenementPropositionValeurCreee", () => {
    it("doit créer un événement PROPOSITION_VALEUR_CREEE avec succès quand aucune proposition n'existe", () => {
      // Given
      const evenementExistant = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecTypeValeur("VALEUR_AVANCEMENT")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      let tousLesEvenements = [evenementExistant];
      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        tousLesEvenements,
      );

      // When
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurCreee({
          valeur: 85,
          auteurId: AUTEUR_ID,
          donneesComplementaires: {
            motif: "Motif de la proposition",
            sourceDonneeEtMethodeCalcul:
              "Source de la donnée et méthode de calcul",
          },
        });

      // Then
      expect(nouveauEvenement.typeEvenement).toEqual(
        "PROPOSITION_VALEUR_CREEE",
      );
      expect(nouveauEvenement.indicId).toEqual(INDIC_ID);
      expect(nouveauEvenement.territoireCode).toEqual(TERRITOIRE_CODE);
      expect(nouveauEvenement.typeValeur).toEqual("VALEUR_AVANCEMENT");
      expect(nouveauEvenement.dateValeur).toEqual(new Date("2023-01-01"));
      expect(nouveauEvenement.valeur).toEqual(85);
      expect(nouveauEvenement.idAuteurModification).toEqual(AUTEUR_ID);
      expect(nouveauEvenement.ordre).toEqual(2);
      expect(nouveauEvenement.donneesComplementaires).toEqual({
        motif: "Motif de la proposition",
        sourceDonneeEtMethodeCalcul: "Source de la donnée et méthode de calcul",
      });

      expect(tousLesEvenements).toHaveLength(2);
      expect(evenementsSurDate.evenementsPropositionValeur()).toHaveLength(1);
    });

    it("doit calculer l'ordre correct quand plusieurs événements existent à la même date", () => {
      // Given
      const evenement1 = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecDateValeur(new Date("2023-01-01"))
        .avecOrdre(1)
        .build();

      const evenement2 = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_MODIFIEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecOrdre(2)
        .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [evenement1, evenement2],
      );

      // When
      const nouvelEvenement =
        evenementsSurDate.creerEvenementPropositionValeurCreee({
          valeur: 85,
          auteurId: AUTEUR_ID,
          donneesComplementaires: {
            motif: "Motif de la proposition",
            sourceDonneeEtMethodeCalcul:
              "Source de la donnée et méthode de calcul",
          },
        });

      // Then
      expect(nouvelEvenement.ordre).toEqual(3);
    });

    it("doit échouer quand une PROPOSITION_VALEUR_CREEE est déjà en cours", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementProposition =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [evenementValeur, evenementProposition],
      );

      // When & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurCreee({
          valeur: 85,
          auteurId: AUTEUR_ID,
          donneesComplementaires: {
            motif: "Motif de la proposition",
            sourceDonneeEtMethodeCalcul:
              "Source de la donnée et méthode de calcul",
          },
        });
      }).toThrow("Une proposition de valeur est déjà en cours");
    });

    it("doit échouer quand une PROPOSITION_VALEUR_MODIFIEE est déjà en cours", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementProposition =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_MODIFIEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [evenementValeur, evenementProposition],
      );

      // When & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurCreee({
          valeur: 85,
          auteurId: AUTEUR_ID,
          donneesComplementaires: {
            motif: "Motif de la proposition",
            sourceDonneeEtMethodeCalcul:
              "Source de la donnée et méthode de calcul",
          },
        });
      }).toThrow("Une proposition de valeur est déjà en cours");
    });

    it("doit réussir quand une autre proposition a été traitée (PROPOSITION_VALEUR_ACCEPTEE)", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementPropositionAcceptee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_ACCEPTEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(3)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [
          evenementValeur,
          evenementPropositionCreee,
          evenementPropositionAcceptee,
        ],
      );

      // When
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurCreee({
          valeur: 85,
          auteurId: AUTEUR_ID,
          donneesComplementaires: {
            motif: "Motif de la proposition",
            sourceDonneeEtMethodeCalcul:
              "Source de la donnée et méthode de calcul",
          },
        });

      // Then
      expect(nouveauEvenement.typeEvenement).toEqual(
        "PROPOSITION_VALEUR_CREEE",
      );
      expect(nouveauEvenement.valeur).toEqual(85);
      expect(nouveauEvenement.ordre).toEqual(4);
    });

    it("doit échouer quand une PROPOSITION_VALEUR_ACCUSEE_RECEPTION est dans le flux", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementPropositionAccuseeReception =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_ACCUSEE_RECEPTION")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(3)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [
          evenementValeur,
          evenementPropositionCreee,
          evenementPropositionAccuseeReception,
        ],
      );

      // When & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurCreee({
          valeur: 85,
          auteurId: AUTEUR_ID,
          donneesComplementaires: {
            motif: "Motif de la proposition",
            sourceDonneeEtMethodeCalcul:
              "Source de la donnée et méthode de calcul",
          },
        });
      }).toThrow("La proposition de valeur a déjà été accusée réception");
    });
  });

  describe("#creerEvenementPropositionValeurModifiee", () => {
    it("doit créer un événement PROPOSITION_VALEUR_MODIFIEE avec succès quand une PROPOSITION_VALEUR_CREEE existe", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [evenementValeur, evenementPropositionCreee],
      );

      // When
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurModifiee({
          valeur: 85,
          auteurId: AUTEUR_ID,
          donneesComplementaires: {
            motif: "Motif de la modification",
            sourceDonneeEtMethodeCalcul:
              "Source de la donnée et méthode de calcul",
          },
        });

      // Then
      expect(nouveauEvenement.typeEvenement).toEqual(
        "PROPOSITION_VALEUR_MODIFIEE",
      );
      expect(nouveauEvenement.indicId).toEqual(INDIC_ID);
      expect(nouveauEvenement.territoireCode).toEqual(TERRITOIRE_CODE);
      expect(nouveauEvenement.typeValeur).toEqual("VALEUR_AVANCEMENT");
      expect(nouveauEvenement.dateValeur).toEqual(new Date("2023-01-01"));
      expect(nouveauEvenement.valeur).toEqual(85);
      expect(nouveauEvenement.idAuteurModification).toEqual(AUTEUR_ID);
      expect(nouveauEvenement.ordre).toEqual(3);
      expect(nouveauEvenement.donneesComplementaires).toEqual({
        motif: "Motif de la modification",
        sourceDonneeEtMethodeCalcul: "Source de la donnée et méthode de calcul",
      });
    });

    it("doit créer un événement PROPOSITION_VALEUR_MODIFIEE avec succès quand une PROPOSITION_VALEUR_MODIFIEE existe déjà", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementPropositionModifiee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_MODIFIEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(82)
          .avecOrdre(3)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [
          evenementValeur,
          evenementPropositionCreee,
          evenementPropositionModifiee,
        ],
      );

      // When
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurModifiee({
          valeur: 85,
          auteurId: AUTEUR_ID,
          donneesComplementaires: {
            motif: "Motif de la modification",
            sourceDonneeEtMethodeCalcul:
              "Source de la donnée et méthode de calcul",
          },
        });

      // Then
      expect(nouveauEvenement.typeEvenement).toEqual(
        "PROPOSITION_VALEUR_MODIFIEE",
      );
      expect(nouveauEvenement.valeur).toEqual(85);
      expect(nouveauEvenement.ordre).toEqual(4);
      expect(nouveauEvenement.donneesComplementaires).toEqual({
        motif: "Motif de la modification",
        sourceDonneeEtMethodeCalcul: "Source de la donnée et méthode de calcul",
      });
    });

    it("doit échouer quand aucune PROPOSITION_CREEE n'existe", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [evenementValeur],
      );

      // When & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurModifiee({
          valeur: 85,
          auteurId: AUTEUR_ID,
          donneesComplementaires: {
            motif: "Motif de la modification",
            sourceDonneeEtMethodeCalcul:
              "Source de la donnée et méthode de calcul",
          },
        });
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });

    it("doit échouer quand un évènement PROPOSITION_VALEUR_ACCEPTEE existe", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementPropositionAcceptee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_ACCEPTEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(3)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [
          evenementValeur,
          evenementPropositionCreee,
          evenementPropositionAcceptee,
        ],
      );

      // When & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurModifiee({
          valeur: 85,
          auteurId: AUTEUR_ID,
          donneesComplementaires: {
            motif: "Motif de la modification",
            sourceDonneeEtMethodeCalcul:
              "Source de la donnée et méthode de calcul",
          },
        });
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });

    it("doit échouer quand un évènement PROPOSITION_VALEUR_REFUSEE existe", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementPropositionAcceptee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_REFUSEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(3)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [
          evenementValeur,
          evenementPropositionCreee,
          evenementPropositionAcceptee,
        ],
      );

      // When & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurModifiee({
          valeur: 85,
          auteurId: AUTEUR_ID,
          donneesComplementaires: {
            motif: "Motif de la modification",
            sourceDonneeEtMethodeCalcul:
              "Source de la donnée et méthode de calcul",
          },
        });
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });

    it("doit échouer quand un évènement PROPOSITION_VALEUR_ACCUSEE_RECEPTION existe", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementPropositionAccuseeReception =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_ACCUSEE_RECEPTION")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(3)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [
          evenementValeur,
          evenementPropositionCreee,
          evenementPropositionAccuseeReception,
        ],
      );

      // When & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurModifiee({
          valeur: 85,
          auteurId: AUTEUR_ID,
          donneesComplementaires: {
            motif: "Motif de la modification",
            sourceDonneeEtMethodeCalcul:
              "Source de la donnée et méthode de calcul",
          },
        });
      }).toThrow("La proposition de valeur a déjà été accusée réception");
    });
  });

  describe("#creerEvenementPropositionValeurSupprimee", () => {
    it("doit créer un événement PROPOSITION_VALEUR_SUPPRIMEE avec succès quand une PROPOSITION_VALEUR_CREEE est en cours", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [evenementValeur, evenementPropositionCreee],
      );

      // When
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurSupprimee({
          auteurId: AUTEUR_ID,
          donneesComplementaires: { motif: "motif de la suppression" },
        });

      // Then
      expect(nouveauEvenement.typeEvenement).toEqual(
        "PROPOSITION_VALEUR_SUPPRIMEE",
      );
      expect(nouveauEvenement.indicId).toEqual(INDIC_ID);
      expect(nouveauEvenement.territoireCode).toEqual(TERRITOIRE_CODE);
      expect(nouveauEvenement.typeValeur).toEqual("VALEUR_AVANCEMENT");
      expect(nouveauEvenement.dateValeur).toEqual(new Date("2023-01-01"));
      expect(nouveauEvenement.valeur).toEqual(80); // Valeur de la proposition supprimée
      expect(nouveauEvenement.idAuteurModification).toEqual(AUTEUR_ID);
      expect(nouveauEvenement.ordre).toEqual(3);
      expect(nouveauEvenement.donneesComplementaires).toEqual({
        motif: "motif de la suppression",
      });
    });

    it("doit créer un événement PROPOSITION_VALEUR_SUPPRIMEE avec succès quand une PROPOSITION_VALEUR_MODIFIEE est en cours", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementPropositionModifiee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_MODIFIEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(85)
          .avecOrdre(3)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [
          evenementValeur,
          evenementPropositionCreee,
          evenementPropositionModifiee,
        ],
      );

      // When
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurSupprimee({
          auteurId: AUTEUR_ID,
          donneesComplementaires: { motif: "motif de la suppression" },
        });

      // Then
      expect(nouveauEvenement.typeEvenement).toEqual(
        "PROPOSITION_VALEUR_SUPPRIMEE",
      );
      expect(nouveauEvenement.valeur).toEqual(85); // Valeur de la dernière modification
      expect(nouveauEvenement.ordre).toEqual(4);
    });

    it("doit échouer quand aucune proposition n'est en cours (PROPOSITION_VALEUR_CREEE ou PROPOSITION_VALEUR_MODIFIEE)", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [evenementValeur],
      );

      // When & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurSupprimee({
          auteurId: AUTEUR_ID,
          donneesComplementaires: { motif: "motif de la suppression" },
        });
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });

    it("doit échouer quand un évènement PROPOSITION_VALEUR_ACCEPTEE existe", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementPropositionAcceptee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_ACCEPTEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(3)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [
          evenementValeur,
          evenementPropositionCreee,
          evenementPropositionAcceptee,
        ],
      );

      // When & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurSupprimee({
          auteurId: AUTEUR_ID,
          donneesComplementaires: { motif: "motif de la suppression" },
        });
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });

    it("doit échouer quand un évènement PROPOSITION_VALEUR_REFUSEE existe", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementPropositionRefusee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_REFUSEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(3)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [
          evenementValeur,
          evenementPropositionCreee,
          evenementPropositionRefusee,
        ],
      );

      // When & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurSupprimee({
          auteurId: AUTEUR_ID,
          donneesComplementaires: { motif: "motif de la suppression" },
        });
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });

    it("doit échouer quand un évènement PROPOSITION_VALEUR_ACCUSEE_RECEPTION existe", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementPropositionAccuseeReception =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_ACCUSEE_RECEPTION")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(3)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [
          evenementValeur,
          evenementPropositionCreee,
          evenementPropositionAccuseeReception,
        ],
      );

      // When & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurSupprimee({
          auteurId: AUTEUR_ID,
          donneesComplementaires: { motif: "motif de la suppression" },
        });
      }).toThrow("La proposition de valeur a déjà été accusée réception");
    });
  });

  describe("#creerEvenementPropositionValeurAccuseeReception", () => {
    it("doit créer un événement PROPOSITION_VALEUR_ACCUSEE_RECEPTION avec succès quand une PROPOSITION_VALEUR_CREEE est en cours", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [evenementValeur, evenementPropositionCreee],
      );

      // When
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurAccuseeReception({
          auteurId: AUTEUR_ID,
          motif: "Motif de l'accusé de réception",
        });

      // Then
      expect(nouveauEvenement.typeEvenement).toEqual(
        "PROPOSITION_VALEUR_ACCUSEE_RECEPTION",
      );
      expect(nouveauEvenement.indicId).toEqual(INDIC_ID);
      expect(nouveauEvenement.territoireCode).toEqual(TERRITOIRE_CODE);
      expect(nouveauEvenement.typeValeur).toEqual("VALEUR_AVANCEMENT");
      expect(nouveauEvenement.dateValeur).toEqual(new Date("2023-01-01"));
      expect(nouveauEvenement.valeur).toEqual(80); // Valeur de la proposition accusée réception
      expect(nouveauEvenement.idAuteurModification).toEqual(AUTEUR_ID);
      expect(nouveauEvenement.ordre).toEqual(3);
      expect(nouveauEvenement.donneesComplementaires).toEqual({
        motif: "Motif de l'accusé de réception",
      });
    });

    it("doit créer un événement PROPOSITION_VALEUR_ACCUSEE_RECEPTION avec succès quand une PROPOSITION_VALEUR_MODIFIEE est en cours", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementPropositionModifiee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_MODIFIEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(85)
          .avecOrdre(3)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [
          evenementValeur,
          evenementPropositionCreee,
          evenementPropositionModifiee,
        ],
      );

      // When
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurAccuseeReception({
          auteurId: AUTEUR_ID,
          motif: "Motif de l'accusé de réception",
        });

      // Then
      expect(nouveauEvenement.typeEvenement).toEqual(
        "PROPOSITION_VALEUR_ACCUSEE_RECEPTION",
      );
      expect(nouveauEvenement.valeur).toEqual(85); // Valeur de la dernière modification
      expect(nouveauEvenement.ordre).toEqual(4);
    });

    it("doit échouer quand aucune proposition n'est en cours (PROPOSITION_VALEUR_CREEE ou PROPOSITION_VALEUR_MODIFIEE)", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [evenementValeur],
      );

      // When & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurAccuseeReception({
          auteurId: AUTEUR_ID,
          motif: "Motif de l'accusé de réception",
        });
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });

    it("doit échouer quand un évènement PROPOSITION_VALEUR_ACCEPTEE existe", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementPropositionAcceptee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_ACCEPTEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(3)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [
          evenementValeur,
          evenementPropositionCreee,
          evenementPropositionAcceptee,
        ],
      );

      // When & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurAccuseeReception({
          auteurId: AUTEUR_ID,
          motif: "Motif de l'accusé de réception",
        });
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });

    it("doit échouer quand un évènement PROPOSITION_VALEUR_REFUSEE existe", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementPropositionRefusee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_REFUSEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(3)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [
          evenementValeur,
          evenementPropositionCreee,
          evenementPropositionRefusee,
        ],
      );

      // When & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurAccuseeReception({
          auteurId: AUTEUR_ID,
          motif: "Motif de l'accusé de réception",
        });
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });

    it("doit échouer quand un évènement PROPOSITION_VALEUR_ACCUSEE_RECEPTION existe", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementPropositionAccuseeReception =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_ACCUSEE_RECEPTION")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(3)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [
          evenementValeur,
          evenementPropositionCreee,
          evenementPropositionAccuseeReception,
        ],
      );

      // When & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurAccuseeReception({
          auteurId: AUTEUR_ID,
          motif: "Motif de l'accusé de réception",
        });
      }).toThrow("La proposition de valeur a déjà été accusée réception");
    });
  });

  describe("#creerEvenementPropositionValeurRefusee", () => {
    it("doit créer un événement PROPOSITION_VALEUR_REFUSEE avec succès quand une PROPOSITION_VALEUR_CREEE est en cours", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [evenementValeur, evenementPropositionCreee],
      );

      // When
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurRefusee({
          auteurId: AUTEUR_ID,
          motif: "Motif du refus",
        });

      // Then
      expect(nouveauEvenement.typeEvenement).toEqual(
        "PROPOSITION_VALEUR_REFUSEE",
      );
      expect(nouveauEvenement.indicId).toEqual(INDIC_ID);
      expect(nouveauEvenement.territoireCode).toEqual(TERRITOIRE_CODE);
      expect(nouveauEvenement.typeValeur).toEqual("VALEUR_AVANCEMENT");
      expect(nouveauEvenement.dateValeur).toEqual(new Date("2023-01-01"));
      expect(nouveauEvenement.valeur).toEqual(80);
      expect(nouveauEvenement.idAuteurModification).toEqual(AUTEUR_ID);
      expect(nouveauEvenement.ordre).toEqual(3);
      expect(nouveauEvenement.donneesComplementaires).toEqual({
        motif: "Motif du refus",
      });
    });

    it("doit créer un événement PROPOSITION_VALEUR_REFUSEE avec succès quand une PROPOSITION_VALEUR_MODIFIEE est en cours", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementPropositionModifiee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_MODIFIEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(3)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [
          evenementValeur,
          evenementPropositionCreee,
          evenementPropositionModifiee,
        ],
      );

      // When
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurRefusee({
          auteurId: AUTEUR_ID,
          motif: "Motif du refus",
        });

      // Then
      expect(nouveauEvenement.typeEvenement).toEqual(
        "PROPOSITION_VALEUR_REFUSEE",
      );
      expect(nouveauEvenement.indicId).toEqual(INDIC_ID);
      expect(nouveauEvenement.territoireCode).toEqual(TERRITOIRE_CODE);
      expect(nouveauEvenement.typeValeur).toEqual("VALEUR_AVANCEMENT");
      expect(nouveauEvenement.dateValeur).toEqual(new Date("2023-01-01"));
      expect(nouveauEvenement.valeur).toEqual(80);
      expect(nouveauEvenement.idAuteurModification).toEqual(AUTEUR_ID);
      expect(nouveauEvenement.ordre).toEqual(4);
      expect(nouveauEvenement.donneesComplementaires).toEqual({
        motif: "Motif du refus",
      });
    });

    it("doit créer un événement PROPOSITION_VALEUR_REFUSEE avec succès quand une PROPOSITION_VALEUR_ACCUSEE_RECEPTION existe", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementPropositionAccuseeReception =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_ACCUSEE_RECEPTION")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(3)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [
          evenementValeur,
          evenementPropositionCreee,
          evenementPropositionAccuseeReception,
        ],
      );

      // When
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurRefusee({
          auteurId: AUTEUR_ID,
          motif: "Motif du refus",
        });

      // Then
      expect(nouveauEvenement.typeEvenement).toEqual(
        "PROPOSITION_VALEUR_REFUSEE",
      );
      expect(nouveauEvenement.valeur).toEqual(80);
      expect(nouveauEvenement.ordre).toEqual(4);
    });

    it("doit échouer quand aucune proposition n'est en cours et aucun évènement PROPOSITION_VALEUR_ACCUSEE_RECEPTION", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [evenementValeur],
      );

      // When & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurRefusee({
          auteurId: AUTEUR_ID,
          motif: "Motif du refus",
        });
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });

    it("doit échouer quand un évènement PROPOSITION_VALEUR_ACCEPTEE existe", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementPropositionAcceptee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_ACCEPTEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(3)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [
          evenementValeur,
          evenementPropositionCreee,
          evenementPropositionAcceptee,
        ],
      );

      // When & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurRefusee({
          auteurId: AUTEUR_ID,
          motif: "Motif du refus",
        });
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });
  });

  describe("#creerEvenementPropositionValeurAcceptee", () => {
    it("doit créer un événement PROPOSITION_VALEUR_ACCEPTEE avec succès quand une PROPOSITION_VALEUR_CREEE est en cours", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [evenementValeur, evenementPropositionCreee],
      );

      // When
      const nouveauxEvenements =
        evenementsSurDate.creerEvenementPropositionValeurAcceptee({
          auteurId: AUTEUR_ID,
          motif: "Motif d'acceptation",
        });

      // Then
      expect(nouveauxEvenements[0].typeEvenement).toEqual(
        "PROPOSITION_VALEUR_ACCEPTEE",
      );
      expect(nouveauxEvenements[0].indicId).toEqual(INDIC_ID);
      expect(nouveauxEvenements[0].territoireCode).toEqual(TERRITOIRE_CODE);
      expect(nouveauxEvenements[0].typeValeur).toEqual("VALEUR_AVANCEMENT");
      expect(nouveauxEvenements[0].dateValeur).toEqual(new Date("2023-01-01"));
      expect(nouveauxEvenements[0].valeur).toEqual(80);
      expect(nouveauxEvenements[0].idAuteurModification).toEqual(AUTEUR_ID);
      expect(nouveauxEvenements[0].ordre).toEqual(3);
      expect(nouveauxEvenements[0].donneesComplementaires).toEqual({
        motif: "Motif d'acceptation",
      });
    });

    it("doit créer un événement PROPOSITION_VALEUR_ACCEPTEE avec succès quand une PROPOSITION_VALEUR_MODIFIEE est en cours", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementPropositionModifiee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_MODIFIEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(3)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [
          evenementValeur,
          evenementPropositionCreee,
          evenementPropositionModifiee,
        ],
      );

      // When
      const nouveauxEvenements =
        evenementsSurDate.creerEvenementPropositionValeurAcceptee({
          auteurId: AUTEUR_ID,
          motif: "Motif d'acceptation",
        });

      // Then
      expect(nouveauxEvenements[0].typeEvenement).toEqual(
        "PROPOSITION_VALEUR_ACCEPTEE",
      );
      expect(nouveauxEvenements[0].indicId).toEqual(INDIC_ID);
      expect(nouveauxEvenements[0].territoireCode).toEqual(TERRITOIRE_CODE);
      expect(nouveauxEvenements[0].typeValeur).toEqual("VALEUR_AVANCEMENT");
      expect(nouveauxEvenements[0].dateValeur).toEqual(new Date("2023-01-01"));
      expect(nouveauxEvenements[0].valeur).toEqual(80);
      expect(nouveauxEvenements[0].idAuteurModification).toEqual(AUTEUR_ID);
      expect(nouveauxEvenements[0].ordre).toEqual(4);
      expect(nouveauxEvenements[0].donneesComplementaires).toEqual({
        motif: "Motif d'acceptation",
      });

      expect(nouveauxEvenements[1].typeEvenement).toEqual("VALEUR_MODIFIEE");
      expect(nouveauxEvenements[1].indicId).toEqual(INDIC_ID);
      expect(nouveauxEvenements[1].territoireCode).toEqual(TERRITOIRE_CODE);
      expect(nouveauxEvenements[1].typeValeur).toEqual("VALEUR_AVANCEMENT");
      expect(nouveauxEvenements[1].dateValeur).toEqual(new Date("2023-01-01"));
      expect(nouveauxEvenements[1].valeur).toEqual(80);
      expect(nouveauxEvenements[1].idAuteurModification).toEqual(AUTEUR_ID);
      expect(nouveauxEvenements[1].ordre).toEqual(5);
      expect(nouveauxEvenements[1].donneesComplementaires).toEqual(undefined);
    });

    it("doit créer un événement PROPOSITION_VALEUR_ACCEPTEE avec succès quand une PROPOSITION_VALEUR_ACCUSEE_RECEPTION existe", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementPropositionAccuseeReception =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_ACCUSEE_RECEPTION")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(3)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [
          evenementValeur,
          evenementPropositionCreee,
          evenementPropositionAccuseeReception,
        ],
      );

      // When
      const nouveauxEvenements =
        evenementsSurDate.creerEvenementPropositionValeurAcceptee({
          auteurId: AUTEUR_ID,
          motif: "Motif d'acceptation",
        });

      // Then
      expect(nouveauxEvenements[0].typeEvenement).toEqual(
        "PROPOSITION_VALEUR_ACCEPTEE",
      );
      expect(nouveauxEvenements[0].valeur).toEqual(80);
      expect(nouveauxEvenements[0].ordre).toEqual(4);
    });

    it("doit échouer quand aucune proposition n'est en cours et aucun évènement PROPOSITION_VALEUR_ACCUSEE_RECEPTION", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [evenementValeur],
      );

      // When & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurAcceptee({
          auteurId: AUTEUR_ID,
          motif: "Motif d'acceptation",
        });
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });

    it("doit échouer quand un évènement PROPOSITION_VALEUR_REFUSEE existe", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementPropositionRefusee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_REFUSEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(3)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [
          evenementValeur,
          evenementPropositionCreee,
          evenementPropositionRefusee,
        ],
      );

      // When & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurAcceptee({
          auteurId: AUTEUR_ID,
          motif: "Motif de l'acceptation",
        });
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });
  });

  describe("#creerEvenementPropositionValeurAccepteeAvecModification", () => {
    it("doit créer un événement PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION avec succès quand une PROPOSITION_VALEUR_CREEE est en cours", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [evenementValeur, evenementPropositionCreee],
      );

      // When
      const nouveauxEvenements =
        evenementsSurDate.creerEvenementPropositionValeurAccepteeAvecModification(
          { auteurId: AUTEUR_ID, valeur: 90, motif: "Motif de test" },
        );

      // Then
      const [evenementAcceptation, evenementModification] = nouveauxEvenements;

      expect(evenementAcceptation.typeEvenement).toEqual(
        "PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION",
      );
      expect(evenementAcceptation.indicId).toEqual(INDIC_ID);
      expect(evenementAcceptation.territoireCode).toEqual(TERRITOIRE_CODE);
      expect(evenementAcceptation.typeValeur).toEqual("VALEUR_AVANCEMENT");
      expect(evenementAcceptation.dateValeur).toEqual(new Date("2023-01-01"));
      expect(evenementAcceptation.valeur).toEqual(90); // Valeur modifiée
      expect(evenementAcceptation.idAuteurModification).toEqual(AUTEUR_ID);
      expect(evenementAcceptation.ordre).toEqual(3);
      expect(evenementAcceptation.donneesComplementaires).toEqual({
        motif: "Motif de test",
      });

      expect(evenementModification.typeEvenement).toEqual("VALEUR_MODIFIEE");
      expect(evenementModification.valeur).toEqual(90);
      expect(evenementModification.ordre).toEqual(4);
    });

    it("doit créer un événement PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION avec succès quand une PROPOSITION_VALEUR_ACCUSEE_RECEPTION existe", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementPropositionAccuseeReception =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_ACCUSEE_RECEPTION")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(3)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [
          evenementValeur,
          evenementPropositionCreee,
          evenementPropositionAccuseeReception,
        ],
      );

      // When
      const nouveauxEvenements =
        evenementsSurDate.creerEvenementPropositionValeurAccepteeAvecModification(
          { auteurId: AUTEUR_ID, valeur: 95, motif: "Autre motif de test" },
        );

      // Then
      const [evenementAcceptation, evenementModification] = nouveauxEvenements;

      expect(evenementAcceptation.typeEvenement).toEqual(
        "PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION",
      );
      expect(evenementAcceptation.valeur).toEqual(95); // Valeur modifiée
      expect(evenementAcceptation.ordre).toEqual(4);

      expect(evenementModification.typeEvenement).toEqual("VALEUR_MODIFIEE");
      expect(evenementModification.valeur).toEqual(95);
      expect(evenementModification.ordre).toEqual(5);
    });

    it("doit échouer quand aucune proposition n'est en cours et aucun évènement PROPOSITION_VALEUR_ACCUSEE_RECEPTION", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [evenementValeur],
      );

      // When & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurAccepteeAvecModification(
          { auteurId: AUTEUR_ID, valeur: 90, motif: "motif" },
        );
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });

    it("doit échouer quand un évènement PROPOSITION_VALEUR_REFUSEE existe", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementPropositionRefusee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_REFUSEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(3)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [
          evenementValeur,
          evenementPropositionCreee,
          evenementPropositionRefusee,
        ],
      );

      // When & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurAccepteeAvecModification(
          { auteurId: AUTEUR_ID, valeur: 90, motif: "motif" },
        );
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });
  });

  describe("#creerEvenementPropositionValeurIgnoreeValeurHistorisee", () => {
    it("doit créer un événement PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE avec succès quand une proposition est en cours", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [evenementValeur, evenementPropositionCreee],
      );

      // When
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurIgnoreeValeurHistorisee(
          {
            auteurId: AUTEUR_ID,
          },
        );

      // Then
      expect(nouveauEvenement.typeEvenement).toEqual(
        "PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE",
      );
      expect(nouveauEvenement.indicId).toEqual(INDIC_ID);
      expect(nouveauEvenement.territoireCode).toEqual(TERRITOIRE_CODE);
      expect(nouveauEvenement.typeValeur).toEqual("VALEUR_AVANCEMENT");
      expect(nouveauEvenement.dateValeur).toEqual(new Date("2023-01-01"));
      expect(nouveauEvenement.valeur).toEqual(80);
      expect(nouveauEvenement.idAuteurModification).toEqual(AUTEUR_ID);
      expect(nouveauEvenement.ordre).toEqual(3);
      expect(nouveauEvenement.donneesComplementaires).toEqual(undefined);
    });

    it("doit échouer quand aucune proposition n'est en cours", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [evenementValeur],
      );

      // When & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurIgnoreeValeurHistorisee(
          {
            auteurId: AUTEUR_ID,
          },
        );
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });
  });

  describe("#creerEvenementPropositionValeurIgnoreeValeurModifiee", () => {
    it("doit créer un événement PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE avec succès quand une proposition est en cours", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementPropositionCreee =
        new ValeurIndicateurTerritoireEvenementBuilder()
          .avecIndicId(INDIC_ID)
          .avecTerritoireCode(TERRITOIRE_CODE)
          .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
          .avecDateValeur(new Date("2023-01-01"))
          .avecValeur(80)
          .avecOrdre(2)
          .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [evenementValeur, evenementPropositionCreee],
      );

      // When
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurIgnoreeValeurModifiee({
          auteurId: AUTEUR_ID,
          valeur: 90,
        });

      // Then
      expect(nouveauEvenement.typeEvenement).toEqual(
        "PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE",
      );
      expect(nouveauEvenement.indicId).toEqual(INDIC_ID);
      expect(nouveauEvenement.territoireCode).toEqual(TERRITOIRE_CODE);
      expect(nouveauEvenement.typeValeur).toEqual("VALEUR_AVANCEMENT");
      expect(nouveauEvenement.dateValeur).toEqual(new Date("2023-01-01"));
      expect(nouveauEvenement.valeur).toEqual(90);
      expect(nouveauEvenement.idAuteurModification).toEqual(AUTEUR_ID);
      expect(nouveauEvenement.ordre).toEqual(3);
      expect(nouveauEvenement.donneesComplementaires).toEqual(undefined);
    });

    it("doit échouer quand aucune proposition n'est en cours", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [evenementValeur],
      );

      // When & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurIgnoreeValeurModifiee({
          auteurId: AUTEUR_ID,
          valeur: 85,
        });
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });
  });

  describe("#creerEvenementValeurCreeeOuModifiee", () => {
    it("doit créer un événement VALEUR_CREEE avec succès quand estValeurModifiee est false", () => {
      // Given
      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [],
      );

      const indicateurData = new IndicateurDataBuilder()
        .avecIndicId(INDIC_ID)
        .avecZoneId(TERRITOIRE_CODE)
        .avecMetricDate("2023-01-01")
        .avecMetricValue("85")
        .build();

      // When
      const nouveauEvenement =
        evenementsSurDate.creerEvenementValeurCreeeOuModifiee({
          indicateurData,
          auteurId: AUTEUR_ID,
          estValeurModifiee: false,
        });

      // Then
      expect(nouveauEvenement.typeEvenement).toEqual("VALEUR_CREEE");
      expect(nouveauEvenement.indicId).toEqual(INDIC_ID);
      expect(nouveauEvenement.territoireCode).toEqual(TERRITOIRE_CODE);
      expect(nouveauEvenement.typeValeur).toEqual("VALEUR_AVANCEMENT");
      expect(nouveauEvenement.dateValeur).toEqual(new Date("2023-01-01"));
      expect(nouveauEvenement.valeur).toEqual(85);
      expect(nouveauEvenement.idAuteurModification).toEqual(AUTEUR_ID);
      expect(nouveauEvenement.ordre).toEqual(1);
      expect(nouveauEvenement.donneesComplementaires).toEqual(undefined);
    });

    it("doit créer un événement VALEUR_MODIFIEE avec succès quand estValeurModifiee est true", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [evenementValeur],
      );

      const indicateurData = new IndicateurDataBuilder()
        .avecIndicId(INDIC_ID)
        .avecZoneId(TERRITOIRE_CODE)
        .avecMetricDate("2023-01-01")
        .avecMetricValue("90")
        .build();

      // When
      const nouveauEvenement =
        evenementsSurDate.creerEvenementValeurCreeeOuModifiee({
          indicateurData,
          auteurId: AUTEUR_ID,
          estValeurModifiee: true,
        });

      // Then
      expect(nouveauEvenement.typeEvenement).toEqual("VALEUR_MODIFIEE");
      expect(nouveauEvenement.indicId).toEqual(INDIC_ID);
      expect(nouveauEvenement.territoireCode).toEqual(TERRITOIRE_CODE);
      expect(nouveauEvenement.typeValeur).toEqual("VALEUR_AVANCEMENT");
      expect(nouveauEvenement.dateValeur).toEqual(new Date("2023-01-01"));
      expect(nouveauEvenement.valeur).toEqual(90);
      expect(nouveauEvenement.idAuteurModification).toEqual(AUTEUR_ID);
      expect(nouveauEvenement.ordre).toEqual(2);
      expect(nouveauEvenement.donneesComplementaires).toEqual(undefined);
    });
  });

  describe("#creerEvenementValeurHistorisee", () => {
    it("doit créer un événement VALEUR_HISTORISEE avec succès quand une valeur en cours existe", () => {
      // Given
      const evenementValeur = new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId(INDIC_ID)
        .avecTerritoireCode(TERRITOIRE_CODE)
        .avecTypeEvenement("VALEUR_CREEE")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [evenementValeur],
      );

      // When
      const nouveauEvenement = evenementsSurDate.creerEvenementValeurHistorisee(
        {
          auteurId: AUTEUR_ID,
        },
      );

      // Then
      expect(nouveauEvenement.typeEvenement).toEqual("VALEUR_HISTORISEE");
      expect(nouveauEvenement.indicId).toEqual(INDIC_ID);
      expect(nouveauEvenement.territoireCode).toEqual(TERRITOIRE_CODE);
      expect(nouveauEvenement.typeValeur).toEqual("VALEUR_AVANCEMENT");
      expect(nouveauEvenement.dateValeur).toEqual(new Date("2023-01-01"));
      expect(nouveauEvenement.valeur).toEqual(75);
      expect(nouveauEvenement.idAuteurModification).toEqual(AUTEUR_ID);
      expect(nouveauEvenement.ordre).toEqual(2);
      expect(nouveauEvenement.donneesComplementaires).toEqual(undefined);
    });

    it("doit échouer quand aucune valeur en cours n'existe", () => {
      // Given
      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [],
      );

      // When & THEN
      expect(() => {
        evenementsSurDate.creerEvenementValeurHistorisee({
          auteurId: AUTEUR_ID,
        });
      }).toThrow("Pas de valeur en cours pour l'historisation");
    });
  });

  describe("#creerEvenementValeurHistoriseeACreation", () => {
    it("doit créer un événement VALEUR_HISTORISEE avec succès avec les données de l'indicateur", () => {
      // Given
      const evenementsSurDate = EvenementsSurDate.pourDate(
        createIdentifiantFlux(),
        [],
      );

      const indicateurData = new IndicateurDataBuilder()
        .avecIndicId(INDIC_ID)
        .avecZoneId(TERRITOIRE_CODE)
        .avecMetricDate("2023-01-01")
        .avecMetricValue("85.5")
        .build();

      // When
      const nouveauEvenement =
        evenementsSurDate.creerEvenementValeurHistoriseeACreation({
          indicateurData,
          auteurId: AUTEUR_ID,
        });

      // Then
      expect(nouveauEvenement.typeEvenement).toEqual("VALEUR_HISTORISEE");
      expect(nouveauEvenement.indicId).toEqual(INDIC_ID);
      expect(nouveauEvenement.territoireCode).toEqual(TERRITOIRE_CODE);
      expect(nouveauEvenement.typeValeur).toEqual("VALEUR_AVANCEMENT");
      expect(nouveauEvenement.dateValeur).toEqual(new Date("2023-01-01"));
      expect(nouveauEvenement.valeur).toEqual(85.5);
      expect(nouveauEvenement.idAuteurModification).toEqual(AUTEUR_ID);
      expect(nouveauEvenement.ordre).toEqual(1);
      expect(nouveauEvenement.donneesComplementaires).toEqual(undefined);
    });
  });
});
