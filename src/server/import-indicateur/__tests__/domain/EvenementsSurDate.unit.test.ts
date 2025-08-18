import { EvenementsSurDate } from "@/server/import-indicateur/domain/EvenementsSurDate";
import { ValeurIndicateurTerritoireEvenementBuilder } from "@/server/import-indicateur/app/builder/ValeurIndicateurTerritoireEvenement.builder";

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

  describe("creerEvenementPropositionValeurCreee", () => {
    it("doit créer un événement PROPOSITION_VALEUR_CREEE avec succès quand aucune proposition n'existe", () => {
      // GIVEN
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

      // WHEN
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurCreee({ valeur: 85, auteurId: AUTEUR_ID });

      // THEN
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
        motif: "motif de la proposition",
        sourceDonneeEtMethodeCalcul: "source de la donnée et méthode de calcul",
      });

      expect(tousLesEvenements).toHaveLength(2);
      expect(evenementsSurDate.evenementsPropositionValeur()).toHaveLength(1);
    });

    it("doit calculer l'ordre correct quand plusieurs événements existent à la même date", () => {
      // GIVEN
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

      // WHEN
      const nouvelEvenement =
        evenementsSurDate.creerEvenementPropositionValeurCreee({ valeur: 85, auteurId: AUTEUR_ID });

      // THEN
      expect(nouvelEvenement.ordre).toEqual(3);
    });

    it("doit échouer quand une PROPOSITION_VALEUR_CREEE est déjà en cours", () => {
      // GIVEN
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

      // WHEN & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurCreee({ valeur: 85, auteurId: AUTEUR_ID });
      }).toThrow("Une proposition de valeur est déjà en cours");
    });

    it("doit échouer quand une PROPOSITION_VALEUR_MODIFIEE est déjà en cours", () => {
      // GIVEN
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

      // WHEN & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurCreee({ valeur: 85, auteurId: AUTEUR_ID });
      }).toThrow("Une proposition de valeur est déjà en cours");
    });

    it("doit réussir quand une autre proposition a été traitée (PROPOSITION_VALEUR_ACCEPTEE)", () => {
      // GIVEN
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

      // WHEN
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurCreee({ valeur: 85, auteurId: AUTEUR_ID });

      // THEN
      expect(nouveauEvenement.typeEvenement).toEqual(
        "PROPOSITION_VALEUR_CREEE",
      );
      expect(nouveauEvenement.valeur).toEqual(85);
      expect(nouveauEvenement.ordre).toEqual(4);
    });

    it("doit échouer quand une PROPOSITION_VALEUR_ACCUSEE_RECEPTION est dans le flux", () => {
      // GIVEN
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

      // WHEN & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurCreee({ valeur: 85, auteurId: AUTEUR_ID });
      }).toThrow("La proposition de valeur a déjà été accusée réception");
    });
  });

  describe("creerEvenementPropositionValeurModifiee", () => {
    it("doit créer un événement PROPOSITION_VALEUR_MODIFIEE avec succès quand une PROPOSITION_VALEUR_CREEE existe", () => {
      // GIVEN
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

      // WHEN
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurModifiee(
          { valeur: 85, auteurId: AUTEUR_ID },
        );

      // THEN
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
      expect(nouveauEvenement.donneesComplementaires).toEqual(undefined);
    });

    it("doit créer un événement PROPOSITION_VALEUR_MODIFIEE avec succès quand une PROPOSITION_VALEUR_MODIFIEE existe déjà", () => {
      // GIVEN
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

      // WHEN
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurModifiee(
          { valeur: 85, auteurId: AUTEUR_ID },
        );

      // THEN
      expect(nouveauEvenement.typeEvenement).toEqual(
        "PROPOSITION_VALEUR_MODIFIEE",
      );
      expect(nouveauEvenement.valeur).toEqual(85);
      expect(nouveauEvenement.ordre).toEqual(4);
    });

    it("doit échouer quand aucune PROPOSITION_CREEE n'existe", () => {
      // GIVEN
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

      // WHEN & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurModifiee(
          { valeur: 85, auteurId: AUTEUR_ID },
        );
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });

    it("doit échouer quand un évènement PROPOSITION_VALEUR_ACCEPTEE existe", () => {
      // GIVEN
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

      // WHEN & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurModifiee(
          { valeur: 85, auteurId: AUTEUR_ID },
        );
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });

    it("doit échouer quand un évènement PROPOSITION_VALEUR_REFUSEE existe", () => {
      // GIVEN
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

      // WHEN & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurModifiee(
          { valeur: 85, auteurId: AUTEUR_ID },
        );
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });

    it("doit échouer quand un évènement PROPOSITION_VALEUR_ACCUSEE_RECEPTION existe", () => {
      // GIVEN
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

      // WHEN & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurModifiee(
          { valeur: 85, auteurId: AUTEUR_ID },
        );
      }).toThrow("La proposition de valeur a déjà été accusée réception");
    });
  });

  describe("creerEvenementPropositionValeurSupprimee", () => {
    it("doit créer un événement PROPOSITION_VALEUR_SUPPRIMEE avec succès quand une PROPOSITION_VALEUR_CREEE est en cours", () => {
      // GIVEN
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

      // WHEN
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurSupprimee({ auteurId: AUTEUR_ID });

      // THEN
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
      expect(nouveauEvenement.donneesComplementaires).toEqual(undefined);
    });

    it("doit créer un événement PROPOSITION_VALEUR_SUPPRIMEE avec succès quand une PROPOSITION_VALEUR_MODIFIEE est en cours", () => {
      // GIVEN
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

      // WHEN
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurSupprimee({ auteurId: AUTEUR_ID });

      // THEN
      expect(nouveauEvenement.typeEvenement).toEqual(
        "PROPOSITION_VALEUR_SUPPRIMEE",
      );
      expect(nouveauEvenement.valeur).toEqual(85); // Valeur de la dernière modification
      expect(nouveauEvenement.ordre).toEqual(4);
    });

    it("doit échouer quand aucune proposition n'est en cours (PROPOSITION_VALEUR_CREEE ou PROPOSITION_VALEUR_MODIFIEE)", () => {
      // GIVEN
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

      // WHEN & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurSupprimee({ auteurId: AUTEUR_ID });
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });

    it("doit échouer quand un évènement PROPOSITION_VALEUR_ACCEPTEE existe", () => {
      // GIVEN
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

      // WHEN & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurSupprimee({ auteurId: AUTEUR_ID });
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });

    it("doit échouer quand un évènement PROPOSITION_VALEUR_REFUSEE existe", () => {
      // GIVEN
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

      // WHEN & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurSupprimee({ auteurId: AUTEUR_ID });
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });

    it("doit échouer quand un évènement PROPOSITION_VALEUR_ACCUSEE_RECEPTION existe", () => {
      // GIVEN
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

      // WHEN & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurSupprimee({ auteurId: AUTEUR_ID });
      }).toThrow("La proposition de valeur a déjà été accusée réception");
    });
  });

  describe("creerEvenementPropositionValeurAccuseeReception", () => {
    it("doit créer un événement PROPOSITION_VALEUR_ACCUSEE_RECEPTION avec succès quand une PROPOSITION_VALEUR_CREEE est en cours", () => {
      // GIVEN
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

      // WHEN
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurAccuseeReception(
          { auteurId: AUTEUR_ID },
        );

      // THEN
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
      expect(nouveauEvenement.donneesComplementaires).toEqual(undefined);
    });

    it("doit créer un événement PROPOSITION_VALEUR_ACCUSEE_RECEPTION avec succès quand une PROPOSITION_VALEUR_MODIFIEE est en cours", () => {
      // GIVEN
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

      // WHEN
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurAccuseeReception(
          { auteurId: AUTEUR_ID },
        );

      // THEN
      expect(nouveauEvenement.typeEvenement).toEqual(
        "PROPOSITION_VALEUR_ACCUSEE_RECEPTION",
      );
      expect(nouveauEvenement.valeur).toEqual(85); // Valeur de la dernière modification
      expect(nouveauEvenement.ordre).toEqual(4);
    });

    it("doit échouer quand aucune proposition n'est en cours (PROPOSITION_VALEUR_CREEE ou PROPOSITION_VALEUR_MODIFIEE)", () => {
      // GIVEN
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

      // WHEN & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurAccuseeReception(
          { auteurId: AUTEUR_ID },
        );
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });

    it("doit échouer quand un évènement PROPOSITION_VALEUR_ACCEPTEE existe", () => {
      // GIVEN
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

      // WHEN & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurAccuseeReception(
          { auteurId: AUTEUR_ID },
        );
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });

    it("doit échouer quand un évènement PROPOSITION_VALEUR_REFUSEE existe", () => {
      // GIVEN
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

      // WHEN & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurAccuseeReception(
          { auteurId: AUTEUR_ID },
        );
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });

    it("doit échouer quand un évènement PROPOSITION_VALEUR_ACCUSEE_RECEPTION existe", () => {
      // GIVEN
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

      // WHEN & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurAccuseeReception(
          { auteurId: AUTEUR_ID },
        );
      }).toThrow("La proposition de valeur a déjà été accusée réception");
    });
  });

  describe("creerEvenementPropositionValeurRefusee", () => {
    it("doit créer un événement PROPOSITION_VALEUR_REFUSEE avec succès quand une PROPOSITION_VALEUR_CREEE est en cours", () => {
      // GIVEN
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

      // WHEN
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurRefusee({ auteurId: AUTEUR_ID });

      // THEN
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
      expect(nouveauEvenement.donneesComplementaires).toEqual(undefined);
    });

    it("doit créer un événement PROPOSITION_VALEUR_REFUSEE avec succès quand une PROPOSITION_VALEUR_MODIFIEE est en cours", () => {
      // GIVEN
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

      // WHEN
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurRefusee({ auteurId: AUTEUR_ID });

      // THEN
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
      expect(nouveauEvenement.donneesComplementaires).toEqual(undefined);
    });

    it("doit créer un événement PROPOSITION_VALEUR_REFUSEE avec succès quand une PROPOSITION_VALEUR_ACCUSEE_RECEPTION existe", () => {
      // GIVEN
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

      // WHEN
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurRefusee({ auteurId: AUTEUR_ID });

      // THEN
      expect(nouveauEvenement.typeEvenement).toEqual(
        "PROPOSITION_VALEUR_REFUSEE",
      );
      expect(nouveauEvenement.valeur).toEqual(80);
      expect(nouveauEvenement.ordre).toEqual(4);
    });

    it("doit échouer quand aucune proposition n'est en cours et aucun évènement PROPOSITION_VALEUR_ACCUSEE_RECEPTION", () => {
      // GIVEN
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

      // WHEN & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurRefusee({ auteurId: AUTEUR_ID });
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });

    it("doit échouer quand un évènement PROPOSITION_VALEUR_ACCEPTEE existe", () => {
      // GIVEN
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

      // WHEN & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurRefusee({ auteurId: AUTEUR_ID });
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });
  });

  describe("creerEvenementPropositionValeurAcceptee", () => {
    it("doit créer un événement PROPOSITION_VALEUR_ACCEPTEE avec succès quand une PROPOSITION_VALEUR_CREEE est en cours", () => {
      // GIVEN
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

      // WHEN
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurAcceptee({ auteurId: AUTEUR_ID });

      // THEN
      expect(nouveauEvenement.typeEvenement).toEqual(
        "PROPOSITION_VALEUR_ACCEPTEE",
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

    it("doit créer un événement PROPOSITION_VALEUR_ACCEPTEE avec succès quand une PROPOSITION_VALEUR_MODIFIEE est en cours", () => {
      // GIVEN
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

      // WHEN
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurAcceptee({ auteurId: AUTEUR_ID });

      // THEN
      expect(nouveauEvenement.typeEvenement).toEqual(
        "PROPOSITION_VALEUR_ACCEPTEE",
      );
      expect(nouveauEvenement.indicId).toEqual(INDIC_ID);
      expect(nouveauEvenement.territoireCode).toEqual(TERRITOIRE_CODE);
      expect(nouveauEvenement.typeValeur).toEqual("VALEUR_AVANCEMENT");
      expect(nouveauEvenement.dateValeur).toEqual(new Date("2023-01-01"));
      expect(nouveauEvenement.valeur).toEqual(80);
      expect(nouveauEvenement.idAuteurModification).toEqual(AUTEUR_ID);
      expect(nouveauEvenement.ordre).toEqual(4);
      expect(nouveauEvenement.donneesComplementaires).toEqual(undefined);
    });

    it("doit créer un événement PROPOSITION_VALEUR_ACCEPTEE avec succès quand une PROPOSITION_VALEUR_ACCUSEE_RECEPTION existe", () => {
      // GIVEN
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

      // WHEN
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurAcceptee({ auteurId: AUTEUR_ID });

      // THEN
      expect(nouveauEvenement.typeEvenement).toEqual(
        "PROPOSITION_VALEUR_ACCEPTEE",
      );
      expect(nouveauEvenement.valeur).toEqual(80);
      expect(nouveauEvenement.ordre).toEqual(4);
    });

    it("doit échouer quand aucune proposition n'est en cours et aucun évènement PROPOSITION_VALEUR_ACCUSEE_RECEPTION", () => {
      // GIVEN
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

      // WHEN & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurAcceptee({ auteurId: AUTEUR_ID });
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });

    it("doit échouer quand un évènement PROPOSITION_VALEUR_REFUSEE existe", () => {
      // GIVEN
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

      // WHEN & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurAcceptee({ auteurId: AUTEUR_ID });
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });
  });

  describe("creerEvenementPropositionValeurAccepteeAvecModification", () => {
    it("doit créer un événement PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION avec succès quand une PROPOSITION_VALEUR_CREEE est en cours", () => {
      // GIVEN
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

      // WHEN
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurAccepteeAvecModification(
          { auteurId: AUTEUR_ID, valeur: 90 },
        );

      // THEN
      expect(nouveauEvenement.typeEvenement).toEqual(
        "PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION",
      );
      expect(nouveauEvenement.indicId).toEqual(INDIC_ID);
      expect(nouveauEvenement.territoireCode).toEqual(TERRITOIRE_CODE);
      expect(nouveauEvenement.typeValeur).toEqual("VALEUR_AVANCEMENT");
      expect(nouveauEvenement.dateValeur).toEqual(new Date("2023-01-01"));
      expect(nouveauEvenement.valeur).toEqual(90); // Valeur modifiée
      expect(nouveauEvenement.idAuteurModification).toEqual(AUTEUR_ID);
      expect(nouveauEvenement.ordre).toEqual(3);
      expect(nouveauEvenement.donneesComplementaires).toEqual(undefined);
    });

    it("doit créer un événement PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION avec succès quand une PROPOSITION_VALEUR_ACCUSEE_RECEPTION existe", () => {
      // GIVEN
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

      // WHEN
      const nouveauEvenement =
        evenementsSurDate.creerEvenementPropositionValeurAccepteeAvecModification(
          { auteurId: AUTEUR_ID, valeur: 95 },
        );

      // THEN
      expect(nouveauEvenement.typeEvenement).toEqual(
        "PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION",
      );
      expect(nouveauEvenement.valeur).toEqual(95); // Valeur modifiée
      expect(nouveauEvenement.ordre).toEqual(4);
    });

    it("doit échouer quand aucune proposition n'est en cours et aucun évènement PROPOSITION_VALEUR_ACCUSEE_RECEPTION", () => {
      // GIVEN
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

      // WHEN & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurAccepteeAvecModification(
          { auteurId: AUTEUR_ID, valeur: 90 },
        );
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });

    it("doit échouer quand un évènement PROPOSITION_VALEUR_REFUSEE existe", () => {
      // GIVEN
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

      // WHEN & THEN
      expect(() => {
        evenementsSurDate.creerEvenementPropositionValeurAccepteeAvecModification(
          { auteurId: AUTEUR_ID, valeur: 90 },
        );
      }).toThrow("Aucune proposition de valeur n'est en cours");
    });
  });
});
