import { formaterNombre } from "./nombre";

describe("formaterNombre", () => {
  describe("quand nombre est null ou undefined", () => {
    it("retourne une chaîne vide quand nombre est null", () => {
      // when
      const result = formaterNombre(null, 2);

      // then
      expect(result).toEqual("");
    });

    it("retourne une chaîne vide quand nombre est undefined", () => {
      // when
      const result = formaterNombre(undefined, 2);

      // then
      expect(result).toEqual("");
    });
  });

  describe("quand nombre est un entier", () => {
    it("retourne la représentation en chaîne sans décimales pour un entier positif", () => {
      // when
      const result = formaterNombre(42, 2);

      // then
      expect(result).toEqual("42");
    });

    it("retourne la représentation en chaîne sans décimales pour zéro", () => {
      // when
      const result = formaterNombre(0, 2);

      // then
      expect(result).toEqual("0");
    });

    it("retourne la représentation en chaîne sans décimales pour un entier négatif", () => {
      // when
      const result = formaterNombre(-15, 2);

      // then
      expect(result).toEqual("-15");
    });
  });

  describe("quand nombre est un décimal", () => {
    it("formate le décimal avec le nombre de décimales spécifié", () => {
      // when
      const result = formaterNombre(3.141_59, 2);

      // then
      expect(result).toEqual("3.14");
    });

    it("formate le décimal avec 3 décimales", () => {
      // when
      const result = formaterNombre(123.456_789, 3);

      // then
      expect(result).toEqual("123.457");
    });

    it("formate le décimal avec 0 décimales", () => {
      // when
      const result = formaterNombre(3.7, 0);

      // then
      expect(result).toEqual("4");
    });

    it("formate le décimal négatif avec le nombre de décimales spécifié", () => {
      // when
      const result = formaterNombre(-2.567, 2);

      // then
      expect(result).toEqual("-2.57");
    });

    it("formate le petit décimal avec le nombre de décimales spécifié", () => {
      // when
      const result = formaterNombre(0.123, 2);

      // then
      expect(result).toEqual("0.12");
    });
  });
});
