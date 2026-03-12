import {
  calculerTailleTuile,
  calculerModeDisposition,
} from "./TuileWidgetContext";

describe("calculerTailleTuile", () => {
  it.each([
    { largeur: 0, attendu: "XS" },
    { largeur: 511, attendu: "XS" },
    { largeur: 512, attendu: "SM" },
    { largeur: 703, attendu: "SM" },
    { largeur: 704, attendu: "MD" },
    { largeur: 991, attendu: "MD" },
    { largeur: 992, attendu: "XL" },
    { largeur: 1200, attendu: "XL" },
  ])(
    "retourne $attendu pour une largeur de $largeur",
    ({ largeur, attendu }) => {
      expect(calculerTailleTuile(largeur)).toEqual(attendu);
    },
  );
});

describe("calculerModeDisposition", () => {
  describe("1 colonne", () => {
    it("retourne G quand la largeur est >= 512", () => {
      expect(calculerModeDisposition(600, 1)).toEqual("G");
    });

    it("retourne P quand la largeur est < 512", () => {
      expect(calculerModeDisposition(400, 1)).toEqual("P");
    });
  });

  describe("2 colonnes", () => {
    // (1040 - 16) / 2 = 512 → G
    it("retourne G quand la largeur par widget est >= 512", () => {
      expect(calculerModeDisposition(1040, 2)).toEqual("G");
    });

    // (500 - 16) / 2 = 242 → P
    it("retourne P quand la largeur par widget est < 512", () => {
      expect(calculerModeDisposition(500, 2)).toEqual("P");
    });
  });
});
