import {
  grouperEvenements,
  EvenementVA,
} from "@/server/rapports-hebdomadaires/domain/SectionActiviteChantiersVA";

describe("grouperEvenements", () => {
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

  describe("quand il n'y a aucun événement", () => {
    it("retourne un tableau vide", () => {
      // Given
      const evenements: EvenementVA[] = [];

      // When
      const result = grouperEvenements(evenements);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe("quand il y a un seul événement", () => {
    it("retourne l'événement avec valeurAvancement", () => {
      // Given
      const evenement = createEvenement({
        indicateurId: "IND-001",
        indicateurNom: "Indicateur A",
        territoireCode: "DEPT-75",
        territoireNom: "Paris",
        valeur: 50,
        dateValeur: new Date("2025-01-15"),
        dateCreation: new Date("2025-01-15T10:00:00Z"),
      });

      // When
      const result = grouperEvenements([evenement]);

      // Then
      expect(result).toEqual([
        {
          indicateurId: "IND-001",
          indicateurNom: "Indicateur A",
          territoireCode: "DEPT-75",
          territoireNom: "Paris",
          valeurAvancement: 50,
          dateValeur: new Date("2025-01-15"),
        },
      ]);
    });
  });

  describe("quand il y a plusieurs événements pour le même indicateur/territoire/date", () => {
    it("garde la dernière valeur par dateCreation", () => {
      // Given
      const evenements = [
        createEvenement({
          id: "evt-1",
          indicateurId: "IND-001",
          territoireCode: "DEPT-75",
          dateValeur: new Date("2025-01-15"),
          valeur: 40,
          dateCreation: new Date("2025-01-15T10:00:00Z"),
          ordre: 1,
        }),
        createEvenement({
          id: "evt-2",
          indicateurId: "IND-001",
          territoireCode: "DEPT-75",
          dateValeur: new Date("2025-01-15"),
          valeur: 50,
          dateCreation: new Date("2025-01-15T12:00:00Z"),
          ordre: 1,
        }),
      ];

      // When
      const result = grouperEvenements(evenements);

      // Then
      expect(result).toEqual([
        {
          indicateurId: "IND-001",
          indicateurNom: "Indicateur Test",
          territoireCode: "DEPT-75",
          territoireNom: "Paris",
          valeurAvancement: 50,
          dateValeur: new Date("2025-01-15"),
        },
      ]);
    });

    it("garde la dernière valeur par ordre quand dateCreation identique", () => {
      // Given
      const evenements = [
        createEvenement({
          id: "evt-1",
          indicateurId: "IND-001",
          territoireCode: "DEPT-75",
          dateValeur: new Date("2025-01-15"),
          valeur: 40,
          dateCreation: new Date("2025-01-15T10:00:00Z"),
          ordre: 1,
        }),
        createEvenement({
          id: "evt-2",
          indicateurId: "IND-001",
          territoireCode: "DEPT-75",
          dateValeur: new Date("2025-01-15"),
          valeur: 55,
          dateCreation: new Date("2025-01-15T10:00:00Z"),
          ordre: 2,
        }),
      ];

      // When
      const result = grouperEvenements(evenements);

      // Then
      expect(result).toEqual([
        {
          indicateurId: "IND-001",
          indicateurNom: "Indicateur Test",
          territoireCode: "DEPT-75",
          territoireNom: "Paris",
          valeurAvancement: 55,
          dateValeur: new Date("2025-01-15"),
        },
      ]);
    });
  });

  describe("quand il y a plusieurs événements avec des dates différentes", () => {
    it("retourne une entrée par date", () => {
      // Given
      const evenements = [
        createEvenement({
          indicateurId: "IND-001",
          territoireCode: "DEPT-75",
          dateValeur: new Date("2025-01-15"),
          valeur: 50,
          dateCreation: new Date("2025-01-15T10:00:00Z"),
        }),
        createEvenement({
          indicateurId: "IND-001",
          territoireCode: "DEPT-75",
          dateValeur: new Date("2025-01-16"),
          valeur: 60,
          dateCreation: new Date("2025-01-16T10:00:00Z"),
        }),
        createEvenement({
          indicateurId: "IND-001",
          territoireCode: "DEPT-75",
          dateValeur: new Date("2025-01-17"),
          valeur: 70,
          dateCreation: new Date("2025-01-17T10:00:00Z"),
        }),
      ];

      // When
      const result = grouperEvenements(evenements);

      // Then
      expect(result).toHaveLength(3);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            indicateurId: "IND-001",
            territoireCode: "DEPT-75",
            dateValeur: new Date("2025-01-15"),
            valeurAvancement: 50,
          }),
          expect.objectContaining({
            indicateurId: "IND-001",
            territoireCode: "DEPT-75",
            dateValeur: new Date("2025-01-16"),
            valeurAvancement: 60,
          }),
          expect.objectContaining({
            indicateurId: "IND-001",
            territoireCode: "DEPT-75",
            dateValeur: new Date("2025-01-17"),
            valeurAvancement: 70,
          }),
        ]),
      );
    });
  });

  describe("quand il y a des événements pour différents indicateurs/territoires", () => {
    it("retourne une entrée séparée pour chaque combinaison", () => {
      // Given
      const evenements = [
        createEvenement({
          indicateurId: "IND-001",
          indicateurNom: "Indicateur A",
          territoireCode: "DEPT-75",
          territoireNom: "Paris",
          dateValeur: new Date("2025-01-15"),
          valeur: 50,
        }),
        createEvenement({
          indicateurId: "IND-001",
          indicateurNom: "Indicateur A",
          territoireCode: "DEPT-92",
          territoireNom: "Hauts-de-Seine",
          dateValeur: new Date("2025-01-15"),
          valeur: 60,
        }),
        createEvenement({
          indicateurId: "IND-002",
          indicateurNom: "Indicateur B",
          territoireCode: "DEPT-75",
          territoireNom: "Paris",
          dateValeur: new Date("2025-01-15"),
          valeur: 70,
        }),
      ];

      // When
      const result = grouperEvenements(evenements);

      // Then
      expect(result).toHaveLength(3);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            indicateurId: "IND-001",
            territoireCode: "DEPT-75",
            valeurAvancement: 50,
          }),
          expect.objectContaining({
            indicateurId: "IND-001",
            territoireCode: "DEPT-92",
            valeurAvancement: 60,
          }),
          expect.objectContaining({
            indicateurId: "IND-002",
            territoireCode: "DEPT-75",
            valeurAvancement: 70,
          }),
        ]),
      );
    });
  });

  describe("quand la valeur est null", () => {
    it("gère valeurAvancement null", () => {
      // Given
      const evenement = createEvenement({
        indicateurId: "IND-001",
        territoireCode: "DEPT-75",
        dateValeur: new Date("2025-01-15"),
        valeur: null,
      });

      // When
      const result = grouperEvenements([evenement]);

      // Then
      expect(result[0].valeurAvancement).toBeNull();
    });
  });
});
