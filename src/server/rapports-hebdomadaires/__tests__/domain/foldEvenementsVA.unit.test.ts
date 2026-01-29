import {
  foldEvenementsVA,
  EvenementVA,
} from "@/server/rapports-hebdomadaires/domain/SectionActiviteChantiersVA";

describe("foldEvenementsVA", () => {
  const createEvenement = (
    overrides: Partial<EvenementVA> & {
      indicateurId: string;
      territoireCode: string;
    },
  ): EvenementVA => ({
    id: "evt-1",
    indicateurNom: "Indicateur Test",
    territoireNom: "Paris",
    typeEvenement: "VALEUR_MODIFIEE",
    dateValeur: new Date("2025-01-15"),
    valeur: 42,
    dateCreation: new Date("2025-01-15T10:00:00Z"),
    ordre: 1,
    ...overrides,
  });

  describe("when there are no events in period", () => {
    it("returns empty array", () => {
      const result = foldEvenementsVA({
        evenementsDansPeriode: [],
        evenementsAvantPeriode: [],
      });

      expect(result).toEqual([]);
    });
  });

  describe("when there is a single event in period", () => {
    it("returns the event with valeurAvant as null when no prior events", () => {
      const evenement = createEvenement({
        indicateurId: "IND-001",
        indicateurNom: "Indicateur A",
        territoireCode: "DEPT-75",
        territoireNom: "Paris",
        valeur: 50,
        dateCreation: new Date("2025-01-15T10:00:00Z"),
      });

      const result = foldEvenementsVA({
        evenementsDansPeriode: [evenement],
        evenementsAvantPeriode: [],
      });

      expect(result).toEqual([
        {
          indicateurId: "IND-001",
          indicateurNom: "Indicateur A",
          territoireCode: "DEPT-75",
          territoireNom: "Paris",
          valeurAvant: null,
          valeurApres: 50,
          dateChangement: new Date("2025-01-15T10:00:00Z"),
        },
      ]);
    });

    it("returns the event with valeurAvant from prior event", () => {
      const evenementDansPeriode = createEvenement({
        indicateurId: "IND-001",
        indicateurNom: "Indicateur A",
        territoireCode: "DEPT-75",
        territoireNom: "Paris",
        valeur: 50,
        dateCreation: new Date("2025-01-15T10:00:00Z"),
      });

      const evenementAvantPeriode = createEvenement({
        indicateurId: "IND-001",
        indicateurNom: "Indicateur A",
        territoireCode: "DEPT-75",
        territoireNom: "Paris",
        valeur: 30,
        dateCreation: new Date("2025-01-10T10:00:00Z"),
      });

      const result = foldEvenementsVA({
        evenementsDansPeriode: [evenementDansPeriode],
        evenementsAvantPeriode: [evenementAvantPeriode],
      });

      expect(result).toEqual([
        {
          indicateurId: "IND-001",
          indicateurNom: "Indicateur A",
          territoireCode: "DEPT-75",
          territoireNom: "Paris",
          valeurAvant: 30,
          valeurApres: 50,
          dateChangement: new Date("2025-01-15T10:00:00Z"),
        },
      ]);
    });
  });

  describe("when there are multiple events for same indicateur/territoire", () => {
    it("uses the last event value (by dateCreation then ordre)", () => {
      const evenements = [
        createEvenement({
          id: "evt-1",
          indicateurId: "IND-001",
          indicateurNom: "Indicateur A",
          territoireCode: "DEPT-75",
          territoireNom: "Paris",
          valeur: 40,
          dateCreation: new Date("2025-01-15T10:00:00Z"),
          ordre: 1,
        }),
        createEvenement({
          id: "evt-2",
          indicateurId: "IND-001",
          indicateurNom: "Indicateur A",
          territoireCode: "DEPT-75",
          territoireNom: "Paris",
          valeur: 50,
          dateCreation: new Date("2025-01-16T10:00:00Z"),
          ordre: 1,
        }),
        createEvenement({
          id: "evt-3",
          indicateurId: "IND-001",
          indicateurNom: "Indicateur A",
          territoireCode: "DEPT-75",
          territoireNom: "Paris",
          valeur: 55,
          dateCreation: new Date("2025-01-16T10:00:00Z"),
          ordre: 2,
        }),
      ];

      const result = foldEvenementsVA({
        evenementsDansPeriode: evenements,
        evenementsAvantPeriode: [],
      });

      expect(result).toEqual([
        {
          indicateurId: "IND-001",
          indicateurNom: "Indicateur A",
          territoireCode: "DEPT-75",
          territoireNom: "Paris",
          valeurAvant: null,
          valeurApres: 55,
          dateChangement: new Date("2025-01-16T10:00:00Z"),
        },
      ]);
    });

    it("uses the last event before period as valeurAvant when multiple prior events", () => {
      const evenementDansPeriode = createEvenement({
        indicateurId: "IND-001",
        territoireCode: "DEPT-75",
        valeur: 100,
        dateCreation: new Date("2025-01-15T10:00:00Z"),
        ordre: 1,
      });

      const evenementsAvantPeriode = [
        createEvenement({
          indicateurId: "IND-001",
          territoireCode: "DEPT-75",
          valeur: 30,
          dateCreation: new Date("2025-01-10T10:00:00Z"),
          ordre: 1,
        }),
        createEvenement({
          indicateurId: "IND-001",
          territoireCode: "DEPT-75",
          valeur: 40,
          dateCreation: new Date("2025-01-12T10:00:00Z"),
          ordre: 1,
        }),
        createEvenement({
          indicateurId: "IND-001",
          territoireCode: "DEPT-75",
          valeur: 45,
          dateCreation: new Date("2025-01-12T10:00:00Z"),
          ordre: 2,
        }),
      ];

      const result = foldEvenementsVA({
        evenementsDansPeriode: [evenementDansPeriode],
        evenementsAvantPeriode,
      });

      expect(result).toEqual([
        {
          indicateurId: "IND-001",
          indicateurNom: "Indicateur Test",
          territoireCode: "DEPT-75",
          territoireNom: "Paris",
          valeurAvant: 45,
          valeurApres: 100,
          dateChangement: new Date("2025-01-15T10:00:00Z"),
        },
      ]);
    });
  });

  describe("when there are events for different indicateurs/territoires", () => {
    it("returns separate entries for each combination", () => {
      const evenements = [
        createEvenement({
          indicateurId: "IND-001",
          indicateurNom: "Indicateur A",
          territoireCode: "DEPT-75",
          territoireNom: "Paris",
          valeur: 50,
          dateCreation: new Date("2025-01-15T10:00:00Z"),
        }),
        createEvenement({
          indicateurId: "IND-001",
          indicateurNom: "Indicateur A",
          territoireCode: "DEPT-92",
          territoireNom: "Hauts-de-Seine",
          valeur: 60,
          dateCreation: new Date("2025-01-15T11:00:00Z"),
        }),
        createEvenement({
          indicateurId: "IND-002",
          indicateurNom: "Indicateur B",
          territoireCode: "DEPT-75",
          territoireNom: "Paris",
          valeur: 70,
          dateCreation: new Date("2025-01-15T12:00:00Z"),
        }),
      ];

      const result = foldEvenementsVA({
        evenementsDansPeriode: evenements,
        evenementsAvantPeriode: [],
      });

      expect(result).toHaveLength(3);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            indicateurId: "IND-001",
            territoireCode: "DEPT-75",
          }),
          expect.objectContaining({
            indicateurId: "IND-001",
            territoireCode: "DEPT-92",
          }),
          expect.objectContaining({
            indicateurId: "IND-002",
            territoireCode: "DEPT-75",
          }),
        ]),
      );
    });
  });

  describe("when valeur is null", () => {
    it("handles null valeurAvant", () => {
      const evenement = createEvenement({
        indicateurId: "IND-001",
        territoireCode: "DEPT-75",
        valeur: 50,
        dateCreation: new Date("2025-01-15T10:00:00Z"),
      });

      const result = foldEvenementsVA({
        evenementsDansPeriode: [evenement],
        evenementsAvantPeriode: [],
      });

      expect(result[0].valeurAvant).toBeNull();
    });

    it("handles null valeurApres", () => {
      const evenement = createEvenement({
        indicateurId: "IND-001",
        territoireCode: "DEPT-75",
        valeur: null,
        dateCreation: new Date("2025-01-15T10:00:00Z"),
      });

      const result = foldEvenementsVA({
        evenementsDansPeriode: [evenement],
        evenementsAvantPeriode: [],
      });

      expect(result[0].valeurApres).toBeNull();
    });
  });
});
