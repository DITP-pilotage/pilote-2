import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";

describe("PiloteDateFormatter", () => {
  describe("isoDateFranceMetropolitaine", () => {
    it("formate une date UTC en format français avec timezone Paris", () => {
      // Given
      const dateISO = "2025-01-15T10:00:00Z";

      // When
      const result = PiloteDateFormatter.isoDateFranceMetropolitaine(dateISO);

      // Then
      expect(result).toBe("15/01/2025");
    });

    it("convertit correctement une date UTC de fin de journée vers Paris (heure d'hiver)", () => {
      // Given
      const dateISO = "2025-01-15T23:30:00Z";

      // When
      const result = PiloteDateFormatter.isoDateFranceMetropolitaine(dateISO);

      // Then
      expect(result).toBe("16/01/2025");
    });

    it("convertit correctement une date UTC de fin de journée vers Paris (heure d'été)", () => {
      // Given
      const dateISO = "2025-07-15T22:30:00Z";

      // When
      const result = PiloteDateFormatter.isoDateFranceMetropolitaine(dateISO);

      // Then
      expect(result).toBe("16/07/2025");
    });

    it("gère correctement les dates en début d'année", () => {
      // Given
      const dateISO = "2025-01-01T00:00:00Z";

      // When
      const result = PiloteDateFormatter.isoDateFranceMetropolitaine(dateISO);

      // Then
      expect(result).toBe("01/01/2025");
    });

    it("gère correctement les dates en fin d'année avec conversion de timezone", () => {
      // Given
      const dateISO = "2024-12-31T23:30:00Z";

      // When
      const result = PiloteDateFormatter.isoDateFranceMetropolitaine(dateISO);

      // Then
      expect(result).toBe("01/01/2025");
    });
  });

  describe("isoMonthFranceMetropolitaine", () => {
    it("formate une date UTC en format mois/année français avec timezone Paris", () => {
      // Given
      const dateISO = "2025-01-15T10:00:00Z";

      // When
      const result = PiloteDateFormatter.isoMonthFranceMetropolitaine(dateISO);

      // Then
      expect(result).toBe("01/2025");
    });

    it("convertit correctement une date UTC de fin de mois vers Paris avec changement de mois", () => {
      // Given
      const dateISO = "2025-01-31T23:30:00Z";

      // When
      const result = PiloteDateFormatter.isoMonthFranceMetropolitaine(dateISO);

      // Then
      expect(result).toBe("02/2025");
    });
  });

  describe("dateFrancaiseLongue", () => {
    it("formate le 1er jour du mois avec '1er'", () => {
      // Given
      const date = new Date("2025-01-01");

      // When
      const result = PiloteDateFormatter.dateFrancaiseLongue(date);

      // Then
      expect(result).toBe("1er janvier 2025");
    });

    it("formate un jour ordinaire sans '1er'", () => {
      // Given
      const date = new Date("2025-03-15");

      // When
      const result = PiloteDateFormatter.dateFrancaiseLongue(date);

      // Then
      expect(result).toBe("15 mars 2025");
    });
  });
});
