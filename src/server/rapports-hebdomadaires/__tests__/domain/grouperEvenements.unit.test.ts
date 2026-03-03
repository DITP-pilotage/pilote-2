import {
  grouperEvenements,
  EvenementIndicateur,
  TypeValeurIndicateur,
} from "@/server/rapports-hebdomadaires/domain/SectionActiviteChantiers";

describe("grouperEvenements", () => {
  const createEvenement = (
    overrides: Partial<EvenementIndicateur> & {
      indicateurId: string;
      territoireCode: string;
      indicateurNom?: string;
      territoireNom?: string;
      typeValeur?: TypeValeurIndicateur;
    },
  ): EvenementIndicateur => {
    const {
      indicateurId,
      indicateurNom = "Indicateur Test",
      territoireCode,
      territoireNom = "Paris",
      typeValeur = "VALEUR_AVANCEMENT",
      ...rest
    } = overrides;

    return {
      id: "evt-1",
      indicateur: {
        id: indicateurId,
        nom: indicateurNom,
      },
      territoire: {
        code: territoireCode,
        nom: territoireNom,
      },
      typeValeur,
      dateValeur: new Date("2025-01-15"),
      valeur: 42,
      dateCreation: new Date("2025-01-15T10:00:00Z"),
      ordre: 1,
      ...rest,
    };
  };

  describe("quand il n'y a aucun événement", () => {
    it("retourne un tableau vide", () => {
      // Given
      const evenements: EvenementIndicateur[] = [];

      // When
      const result = grouperEvenements(evenements);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe("quand il y a un seul événement", () => {
    it("retourne l'événement avec valeur", () => {
      // Given
      const evenement = createEvenement({
        indicateurId: "IND-001",
        indicateurNom: "Indicateur A",
        territoireCode: "DEPT-75",
        territoireNom: "Paris",
        typeValeur: "VALEUR_AVANCEMENT",
        valeur: 50,
        dateValeur: new Date("2025-01-15"),
        dateCreation: new Date("2025-01-15T10:00:00Z"),
      });

      // When
      const result = grouperEvenements([evenement]);

      // Then
      expect(result).toEqual([
        {
          indicateur: {
            id: "IND-001",
            nom: "Indicateur A",
          },
          territoire: {
            code: "DEPT-75",
            nom: "Paris",
          },
          typeValeur: "VALEUR_AVANCEMENT",
          valeur: 50,
          dateValeur: new Date("2025-01-15"),
          dateEvenement: new Date("2025-01-15T10:00:00Z"),
        },
      ]);
    });
  });

  describe("quand il y a plusieurs événements pour le même indicateur/territoire/typeValeur/date", () => {
    it("garde la dernière valeur par dateCreation", () => {
      // Given
      const evenements = [
        createEvenement({
          id: "evt-1",
          indicateurId: "IND-001",
          territoireCode: "DEPT-75",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: new Date("2025-01-15"),
          valeur: 40,
          dateCreation: new Date("2025-01-15T10:00:00Z"),
          ordre: 1,
        }),
        createEvenement({
          id: "evt-2",
          indicateurId: "IND-001",
          territoireCode: "DEPT-75",
          typeValeur: "VALEUR_AVANCEMENT",
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
          indicateur: {
            id: "IND-001",
            nom: "Indicateur Test",
          },
          territoire: {
            code: "DEPT-75",
            nom: "Paris",
          },
          typeValeur: "VALEUR_AVANCEMENT",
          valeur: 50,
          dateValeur: new Date("2025-01-15"),
          dateEvenement: new Date("2025-01-15T12:00:00Z"),
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
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: new Date("2025-01-15"),
          valeur: 40,
          dateCreation: new Date("2025-01-15T10:00:00Z"),
          ordre: 1,
        }),
        createEvenement({
          id: "evt-2",
          indicateurId: "IND-001",
          territoireCode: "DEPT-75",
          typeValeur: "VALEUR_AVANCEMENT",
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
          indicateur: {
            id: "IND-001",
            nom: "Indicateur Test",
          },
          territoire: {
            code: "DEPT-75",
            nom: "Paris",
          },
          typeValeur: "VALEUR_AVANCEMENT",
          valeur: 55,
          dateValeur: new Date("2025-01-15"),
          dateEvenement: new Date("2025-01-15T10:00:00Z"),
        },
      ]);
    });
  });

  describe("quand il y a plusieurs événements avec des typeValeur différents", () => {
    it("retourne une entrée séparée pour chaque typeValeur", () => {
      // Given
      const evenements = [
        createEvenement({
          indicateurId: "IND-001",
          territoireCode: "DEPT-75",
          typeValeur: "VALEUR_INITIALE",
          dateValeur: new Date("2025-01-15"),
          valeur: 100,
        }),
        createEvenement({
          indicateurId: "IND-001",
          territoireCode: "DEPT-75",
          typeValeur: "VALEUR_CIBLE",
          dateValeur: new Date("2025-01-15"),
          valeur: 200,
        }),
        createEvenement({
          indicateurId: "IND-001",
          territoireCode: "DEPT-75",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: new Date("2025-01-15"),
          valeur: 150,
        }),
      ];

      // When
      const result = grouperEvenements(evenements);

      // Then
      expect(result).toEqual([
        expect.objectContaining({
          indicateur: expect.objectContaining({ id: "IND-001" }),
          territoire: expect.objectContaining({ code: "DEPT-75" }),
          typeValeur: "VALEUR_AVANCEMENT",
          valeur: 150,
        }),
        expect.objectContaining({
          indicateur: expect.objectContaining({ id: "IND-001" }),
          territoire: expect.objectContaining({ code: "DEPT-75" }),
          typeValeur: "VALEUR_CIBLE",
          valeur: 200,
        }),
        expect.objectContaining({
          indicateur: expect.objectContaining({ id: "IND-001" }),
          territoire: expect.objectContaining({ code: "DEPT-75" }),
          typeValeur: "VALEUR_INITIALE",
          valeur: 100,
        }),
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
      expect(result).toEqual([
        expect.objectContaining({
          indicateur: expect.objectContaining({ id: "IND-001" }),
          territoire: expect.objectContaining({ code: "DEPT-75" }),
          dateValeur: new Date("2025-01-17"),
          dateEvenement: new Date("2025-01-17T10:00:00Z"),
          valeur: 70,
        }),
        expect.objectContaining({
          indicateur: expect.objectContaining({ id: "IND-001" }),
          territoire: expect.objectContaining({ code: "DEPT-75" }),
          dateValeur: new Date("2025-01-16"),
          dateEvenement: new Date("2025-01-16T10:00:00Z"),
          valeur: 60,
        }),
        expect.objectContaining({
          indicateur: expect.objectContaining({ id: "IND-001" }),
          territoire: expect.objectContaining({ code: "DEPT-75" }),
          dateValeur: new Date("2025-01-15"),
          dateEvenement: new Date("2025-01-15T10:00:00Z"),
          valeur: 50,
        }),
      ]);
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
            indicateur: expect.objectContaining({ id: "IND-001" }),
            territoire: expect.objectContaining({ code: "DEPT-75" }),
            dateEvenement: expect.any(Date),
            valeur: 50,
          }),
          expect.objectContaining({
            indicateur: expect.objectContaining({ id: "IND-001" }),
            territoire: expect.objectContaining({ code: "DEPT-92" }),
            dateEvenement: expect.any(Date),
            valeur: 60,
          }),
          expect.objectContaining({
            indicateur: expect.objectContaining({ id: "IND-002" }),
            territoire: expect.objectContaining({ code: "DEPT-75" }),
            dateEvenement: expect.any(Date),
            valeur: 70,
          }),
        ]),
      );
    });

    it("trie par territoire code puis typeValeur puis dateValeur desc puis dateEvenement desc", () => {
      // Given
      const evenements = [
        createEvenement({
          indicateurId: "IND-001",
          territoireCode: "DEPT-92",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: new Date("2025-01-16"),
          valeur: 60,
        }),
        createEvenement({
          indicateurId: "IND-001",
          territoireCode: "DEPT-75",
          typeValeur: "VALEUR_CIBLE",
          dateValeur: new Date("2025-01-17"),
          valeur: 70,
        }),
        createEvenement({
          indicateurId: "IND-001",
          territoireCode: "DEPT-75",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: new Date("2025-01-17"),
          valeur: 75,
        }),
        createEvenement({
          indicateurId: "IND-001",
          territoireCode: "DEPT-75",
          typeValeur: "VALEUR_INITIALE",
          dateValeur: new Date("2025-01-17"),
          valeur: 80,
        }),
        createEvenement({
          indicateurId: "IND-001",
          territoireCode: "DEPT-75",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: new Date("2025-01-15"),
          valeur: 50,
        }),
      ];

      // When
      const result = grouperEvenements(evenements);

      // Then
      expect(result).toEqual([
        expect.objectContaining({
          territoire: expect.objectContaining({ code: "DEPT-75" }),
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: new Date("2025-01-17"),
        }),
        expect.objectContaining({
          territoire: expect.objectContaining({ code: "DEPT-75" }),
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: new Date("2025-01-15"),
        }),
        expect.objectContaining({
          territoire: expect.objectContaining({ code: "DEPT-75" }),
          typeValeur: "VALEUR_CIBLE",
          dateValeur: new Date("2025-01-17"),
        }),
        expect.objectContaining({
          territoire: expect.objectContaining({ code: "DEPT-75" }),
          typeValeur: "VALEUR_INITIALE",
          dateValeur: new Date("2025-01-17"),
        }),
        expect.objectContaining({
          territoire: expect.objectContaining({ code: "DEPT-92" }),
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: new Date("2025-01-16"),
        }),
      ]);
    });
  });

  describe("quand la valeur est null", () => {
    it("gère valeur null", () => {
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
      expect(result[0].valeur).toBeNull();
    });
  });
});
