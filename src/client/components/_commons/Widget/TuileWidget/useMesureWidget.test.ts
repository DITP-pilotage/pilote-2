import { calculerModeDisposition } from "./useMesureWidget";

describe("calculerModeDisposition", () => {
  it.each([
    { largeur: 0, attendu: "P" },
    { largeur: 399, attendu: "P" },
    { largeur: 400, attendu: "G" },
    { largeur: 800, attendu: "G" },
  ])(
    "retourne $attendu pour une largeur de $largeur",
    ({ largeur, attendu }) => {
      expect(calculerModeDisposition(largeur)).toEqual(attendu);
    },
  );
});
