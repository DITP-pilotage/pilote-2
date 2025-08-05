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
        evenementsSurDate.creerEvenementPropositionValeurCreee(85, AUTEUR_ID);

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
      expect(nouveauEvenement.donneesComplementaires).toEqual({});

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
        evenementsSurDate.creerEvenementPropositionValeurCreee(85, AUTEUR_ID);

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
        evenementsSurDate.creerEvenementPropositionValeurCreee(85, AUTEUR_ID);
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
        evenementsSurDate.creerEvenementPropositionValeurCreee(85, AUTEUR_ID);
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
        evenementsSurDate.creerEvenementPropositionValeurCreee(85, AUTEUR_ID);

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
        evenementsSurDate.creerEvenementPropositionValeurCreee(85, AUTEUR_ID);
      }).toThrow("La proposition de valeur a déjà été accusée réception");
    });
  });
});
