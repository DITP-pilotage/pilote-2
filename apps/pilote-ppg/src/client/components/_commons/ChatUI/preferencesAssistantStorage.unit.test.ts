import {
  readLargeurPanneau,
  readPreferenceVue,
  writeLargeurPanneau,
  writePreferenceVue,
} from "@/components/_commons/ChatUI/preferencesAssistantStorage";

describe("preferencesAssistantStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("vue", () => {
    test("relit la vue écrite", () => {
      // Given
      writePreferenceVue("sidePanel");

      // When
      const vue = readPreferenceVue();

      // Then
      expect(vue).toBe("sidePanel");
    });

    test("retourne null quand aucune vue n'a été choisie", () => {
      // When
      const vue = readPreferenceVue();

      // Then
      expect(vue).toBeNull();
    });

    test("retourne null quand la valeur stockée n'est pas une vue", () => {
      // Given
      localStorage.setItem("albert:vue", "fullscreen");

      // When
      const vue = readPreferenceVue();

      // Then
      expect(vue).toBeNull();
    });
  });

  describe("largeur du panneau", () => {
    test("relit la largeur écrite", () => {
      // Given
      writeLargeurPanneau(600);

      // When
      const largeur = readLargeurPanneau();

      // Then
      expect(largeur).toBe(600);
    });

    test("retourne null quand aucune largeur n'a été retenue", () => {
      // When
      const largeur = readLargeurPanneau();

      // Then
      expect(largeur).toBeNull();
    });

    test("retourne null quand la valeur stockée n'est pas une largeur", () => {
      // Given
      localStorage.setItem("albert:largeurPanneau", "large");

      // When
      const largeur = readLargeurPanneau();

      // Then
      expect(largeur).toBeNull();
    });
  });
});
