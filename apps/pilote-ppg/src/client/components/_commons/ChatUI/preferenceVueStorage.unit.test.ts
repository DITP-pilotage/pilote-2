import {
  readPreferenceVue,
  writePreferenceVue,
} from "@/components/_commons/ChatUI/preferenceVueStorage";

describe("preferenceVueStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

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
