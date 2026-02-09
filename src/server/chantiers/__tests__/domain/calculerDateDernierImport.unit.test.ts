import { indicateur_territoire_valeur_evenement as PrismaIndicateurTerritoireValeurEvenement } from "@prisma/client";
import { calculerDateDernierImport } from "@/server/chantiers/domain/calculerDateDernierImport";

function creerEvenement(
  overrides: Partial<PrismaIndicateurTerritoireValeurEvenement> = {},
): PrismaIndicateurTerritoireValeurEvenement {
  return {
    id: "evt-1",
    indic_id: "IND-001",
    type_valeur: "VALEUR_AVANCEMENT",
    date_valeur: new Date("2025-01-01"),
    valeur: 10,
    territoire_code: "DEPT-75",
    type_evenement: "VALEUR_CREEE",
    date_creation: new Date("2026-01-15"),
    donnees_complementaires: {},
    ordre: 1,
    date_modification: new Date("2026-01-15"),
    id_auteur_modification: "id-auteur",
    correlation_id: "",
    ...overrides,
  };
}

describe("calculerDateDernierImport", () => {
  const dateDerniereExecutionDatajobs = new Date("2026-02-01");

  describe("cas généraux", () => {
    it("retourne null si aucun événement d'import", () => {
      // Given
      const evenementsTerritoire = [
        creerEvenement({ type_evenement: "PROPOSITION_VALEUR_CREEE" }),
      ];

      // When
      const result = calculerDateDernierImport(
        "DEPT",
        dateDerniereExecutionDatajobs,
        evenementsTerritoire,
        [],
        null,
        null,
      );

      // Then
      expect(result).toBeNull();
    });

    it("retourne la date la plus récente parmi les événements VALEUR_CREEE", () => {
      // Given
      const evenementsTerritoire = [
        creerEvenement({
          type_evenement: "VALEUR_CREEE",
          date_creation: new Date("2026-01-10"),
        }),
        creerEvenement({
          type_evenement: "VALEUR_CREEE",
          date_creation: new Date("2026-01-20"),
        }),
        creerEvenement({
          type_evenement: "VALEUR_CREEE",
          date_creation: new Date("2026-01-15"),
        }),
      ];

      // When
      const result = calculerDateDernierImport(
        "DEPT",
        dateDerniereExecutionDatajobs,
        evenementsTerritoire,
        [],
        null,
        null,
      );

      // Then
      expect(result).toEqual(new Date("2026-01-20"));
    });

    it("retourne la date la plus récente parmi les événements VALEUR_MODIFIEE", () => {
      // Given
      const evenementsTerritoire = [
        creerEvenement({
          type_evenement: "VALEUR_MODIFIEE",
          date_creation: new Date("2026-01-12"),
        }),
        creerEvenement({
          type_evenement: "VALEUR_MODIFIEE",
          date_creation: new Date("2026-01-25"),
        }),
      ];

      // When
      const result = calculerDateDernierImport(
        "DEPT",
        dateDerniereExecutionDatajobs,
        evenementsTerritoire,
        [],
        null,
        null,
      );

      // Then
      expect(result).toEqual(new Date("2026-01-25"));
    });

    it("ignore les événements postérieurs à dateDerniereExecutionDatajobs", () => {
      // Given
      const evenementsTerritoire = [
        creerEvenement({
          type_evenement: "VALEUR_CREEE",
          date_creation: new Date("2026-01-15"),
        }),
        creerEvenement({
          type_evenement: "VALEUR_CREEE",
          date_creation: new Date("2026-02-15"), // après dateDerniereExecutionDatajobs
        }),
      ];

      // When
      const result = calculerDateDernierImport(
        "DEPT",
        dateDerniereExecutionDatajobs,
        evenementsTerritoire,
        [],
        null,
        null,
      );

      // Then
      expect(result).toEqual(new Date("2026-01-15"));
    });

    it("retourne null si tous les événements sont postérieurs à dateDerniereExecutionDatajobs", () => {
      // Given
      const evenementsTerritoire = [
        creerEvenement({
          type_evenement: "VALEUR_CREEE",
          date_creation: new Date("2026-02-15"),
        }),
      ];

      // When
      const result = calculerDateDernierImport(
        "DEPT",
        dateDerniereExecutionDatajobs,
        evenementsTerritoire,
        [],
        null,
        null,
      );

      // Then
      expect(result).toBeNull();
    });
  });

  describe("maille NAT avec origineVaNat", () => {
    it("utilise les événements DEPT quand origineVaNat est DEPT", () => {
      // Given
      const evenementsTerritoire = [
        creerEvenement({
          territoire_code: "NAT-FR",
          type_evenement: "VALEUR_CREEE",
          date_creation: new Date("2026-01-10"),
        }),
      ];
      const evenementsMailles = [
        creerEvenement({
          territoire_code: "DEPT-75",
          type_evenement: "VALEUR_CREEE",
          date_creation: new Date("2026-01-20"),
        }),
        creerEvenement({
          territoire_code: "REG-11",
          type_evenement: "VALEUR_CREEE",
          date_creation: new Date("2026-01-25"),
        }),
      ];

      // When
      const result = calculerDateDernierImport(
        "NAT",
        dateDerniereExecutionDatajobs,
        evenementsTerritoire,
        evenementsMailles,
        "DEPT",
        null,
      );

      // Then
      expect(result).toEqual(new Date("2026-01-20"));
    });

    it("utilise les événements REG quand origineVaNat est REG", () => {
      // Given
      const evenementsTerritoire = [
        creerEvenement({
          territoire_code: "NAT-FR",
          type_evenement: "VALEUR_CREEE",
          date_creation: new Date("2026-01-10"),
        }),
      ];
      const evenementsMailles = [
        creerEvenement({
          territoire_code: "DEPT-75",
          type_evenement: "VALEUR_CREEE",
          date_creation: new Date("2026-01-20"),
        }),
        creerEvenement({
          territoire_code: "REG-11",
          type_evenement: "VALEUR_CREEE",
          date_creation: new Date("2026-01-25"),
        }),
      ];

      // When
      const result = calculerDateDernierImport(
        "NAT",
        dateDerniereExecutionDatajobs,
        evenementsTerritoire,
        evenementsMailles,
        "REG",
        null,
      );

      // Then
      expect(result).toEqual(new Date("2026-01-25"));
    });

    it("utilise les événements du territoire quand origineVaNat n'est pas défini", () => {
      // Given
      const evenementsTerritoire = [
        creerEvenement({
          territoire_code: "NAT-FR",
          type_evenement: "VALEUR_CREEE",
          date_creation: new Date("2026-01-10"),
        }),
      ];
      const evenementsMailles = [
        creerEvenement({
          territoire_code: "DEPT-75",
          type_evenement: "VALEUR_CREEE",
          date_creation: new Date("2026-01-20"),
        }),
      ];

      // When
      const result = calculerDateDernierImport(
        "NAT",
        dateDerniereExecutionDatajobs,
        evenementsTerritoire,
        evenementsMailles,
        null,
        null,
      );

      // Then
      expect(result).toEqual(new Date("2026-01-10"));
    });
  });

  describe("maille REG avec origineVaReg", () => {
    it("utilise les événements DEPT quand origineVaReg est DEPT", () => {
      // Given
      const evenementsTerritoire = [
        creerEvenement({
          territoire_code: "REG-11",
          type_evenement: "VALEUR_CREEE",
          date_creation: new Date("2026-01-10"),
        }),
      ];
      const evenementsMailles = [
        creerEvenement({
          territoire_code: "DEPT-75",
          type_evenement: "VALEUR_CREEE",
          date_creation: new Date("2026-01-20"),
        }),
        creerEvenement({
          territoire_code: "DEPT-92",
          type_evenement: "VALEUR_CREEE",
          date_creation: new Date("2026-01-22"),
        }),
      ];

      // When
      const result = calculerDateDernierImport(
        "REG",
        dateDerniereExecutionDatajobs,
        evenementsTerritoire,
        evenementsMailles,
        null,
        "DEPT",
      );

      // Then
      expect(result).toEqual(new Date("2026-01-22"));
    });

    it("utilise les événements du territoire quand origineVaReg n'est pas DEPT", () => {
      // Given
      const evenementsTerritoire = [
        creerEvenement({
          territoire_code: "REG-11",
          type_evenement: "VALEUR_CREEE",
          date_creation: new Date("2026-01-10"),
        }),
      ];
      const evenementsMailles = [
        creerEvenement({
          territoire_code: "DEPT-75",
          type_evenement: "VALEUR_CREEE",
          date_creation: new Date("2026-01-20"),
        }),
      ];

      // When
      const result = calculerDateDernierImport(
        "REG",
        dateDerniereExecutionDatajobs,
        evenementsTerritoire,
        evenementsMailles,
        null,
        null,
      );

      // Then
      expect(result).toEqual(new Date("2026-01-10"));
    });
  });

  describe("maille DEPT", () => {
    it("utilise toujours les événements du territoire pour DEPT", () => {
      // Given
      const evenementsTerritoire = [
        creerEvenement({
          territoire_code: "DEPT-75",
          type_evenement: "VALEUR_CREEE",
          date_creation: new Date("2026-01-15"),
        }),
      ];
      const evenementsMailles = [
        creerEvenement({
          territoire_code: "DEPT-92",
          type_evenement: "VALEUR_CREEE",
          date_creation: new Date("2026-01-25"),
        }),
      ];

      // When
      const result = calculerDateDernierImport(
        "DEPT",
        dateDerniereExecutionDatajobs,
        evenementsTerritoire,
        evenementsMailles,
        null,
        null,
      );

      // Then
      expect(result).toEqual(new Date("2026-01-15"));
    });
  });
});
