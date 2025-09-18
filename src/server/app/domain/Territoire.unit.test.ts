import {
  convertirZoneIdEnTerritoireCode,
  convertirTerritoireCodeEnZoneId,
  ConversionZoneIdError,
} from "./Territoire";

describe("convertirZoneIdEnTerritoireCode", () => {
  describe("cas valides", () => {
    it('devrait convertir "France" en "NAT-FR"', () => {
      expect(convertirZoneIdEnTerritoireCode("France")).toBe("NAT-FR");
    });

    it('devrait convertir "France" avec des espaces en "NAT-FR"', () => {
      expect(convertirZoneIdEnTerritoireCode(" France ")).toBe("NAT-FR");
    });

    it('devrait convertir "france" en minuscules en "NAT-FR"', () => {
      expect(convertirZoneIdEnTerritoireCode("france")).toBe("NAT-FR");
    });

    it('devrait convertir "FRANCE" en majuscules en "NAT-FR"', () => {
      expect(convertirZoneIdEnTerritoireCode("FRANCE")).toBe("NAT-FR");
    });

    it('devrait convertir "FrAnCe" avec un mélange de casse en "NAT-FR"', () => {
      expect(convertirZoneIdEnTerritoireCode("FrAnCe")).toBe("NAT-FR");
    });

    describe("départements", () => {
      it('devrait convertir "D01" en "DEPT-01"', () => {
        expect(convertirZoneIdEnTerritoireCode("D01")).toBe("DEPT-01");
      });

      it('devrait convertir "D85" en "DEPT-85"', () => {
        expect(convertirZoneIdEnTerritoireCode("D85")).toBe("DEPT-85");
      });

      it('devrait convertir "D001" en "DEPT-001"', () => {
        expect(convertirZoneIdEnTerritoireCode("D001")).toBe("DEPT-001");
      });

      it('devrait convertir "D75" en "DEPT-75"', () => {
        expect(convertirZoneIdEnTerritoireCode("D75")).toBe("DEPT-75");
      });

      it("devrait convertir des codes départements avec plusieurs chiffres", () => {
        expect(convertirZoneIdEnTerritoireCode("D974")).toBe("DEPT-974");
      });

      it('devrait convertir "d01" en minuscules en "DEPT-01"', () => {
        expect(convertirZoneIdEnTerritoireCode("d01")).toBe("DEPT-01");
      });

      it('devrait convertir "D85" en majuscules en "DEPT-85"', () => {
        expect(convertirZoneIdEnTerritoireCode("D85")).toBe("DEPT-85");
      });
    });

    describe("régions", () => {
      it('devrait convertir "R44" en "REG-44"', () => {
        expect(convertirZoneIdEnTerritoireCode("R44")).toBe("REG-44");
      });

      it('devrait convertir "R84" en "REG-84"', () => {
        expect(convertirZoneIdEnTerritoireCode("R84")).toBe("REG-84");
      });

      it('devrait convertir "R11" en "REG-11"', () => {
        expect(convertirZoneIdEnTerritoireCode("R11")).toBe("REG-11");
      });

      it('devrait convertir "R1" en "REG-1"', () => {
        expect(convertirZoneIdEnTerritoireCode("R1")).toBe("REG-1");
      });

      it('devrait convertir "r44" en minuscules en "REG-44"', () => {
        expect(convertirZoneIdEnTerritoireCode("r44")).toBe("REG-44");
      });

      it('devrait convertir "R84" en majuscules en "REG-84"', () => {
        expect(convertirZoneIdEnTerritoireCode("R84")).toBe("REG-84");
      });
    });
  });

  describe("cas d'erreur", () => {
    it("devrait lever une erreur pour une chaîne vide", () => {
      expect(() => convertirZoneIdEnTerritoireCode("")).toThrow(
        ConversionZoneIdError,
      );
      expect(() => convertirZoneIdEnTerritoireCode("")).toThrow(
        "Zone ID invalide: . Les formats acceptés sont: 'France', 'D<nombre>', 'R<nombre>'",
      );
    });

    it("devrait lever une erreur pour null", () => {
      // @ts-expect-error toujours utile à tester
      expect(() => convertirZoneIdEnTerritoireCode(null)).toThrow(
        ConversionZoneIdError,
      );
    });

    it("devrait lever une erreur pour undefined", () => {
      // @ts-expect-error toujours utile à tester
      expect(() => convertirZoneIdEnTerritoireCode()).toThrow(
        ConversionZoneIdError,
      );
    });

    it('devrait lever une erreur pour "D" sans code', () => {
      expect(() => convertirZoneIdEnTerritoireCode("D")).toThrow(
        ConversionZoneIdError,
      );
      expect(() => convertirZoneIdEnTerritoireCode("D")).toThrow(
        "Zone ID invalide: D. Les formats acceptés sont: 'France', 'D<nombre>', 'R<nombre>'",
      );
    });

    it('devrait lever une erreur pour "R" sans code', () => {
      expect(() => convertirZoneIdEnTerritoireCode("R")).toThrow(
        ConversionZoneIdError,
      );
    });

    it('devrait lever une erreur pour "D" avec des lettres', () => {
      expect(() => convertirZoneIdEnTerritoireCode("DABC")).toThrow(
        ConversionZoneIdError,
      );
    });

    it('devrait lever une erreur pour "R" avec des lettres', () => {
      expect(() => convertirZoneIdEnTerritoireCode("RXYZ")).toThrow(
        ConversionZoneIdError,
      );
    });

    it('devrait lever une erreur pour "D" avec des caractères spéciaux', () => {
      expect(() => convertirZoneIdEnTerritoireCode("D@#$")).toThrow(
        ConversionZoneIdError,
      );
    });

    it('devrait lever une erreur pour "R" avec des caractères spéciaux', () => {
      expect(() => convertirZoneIdEnTerritoireCode("R@#$")).toThrow(
        ConversionZoneIdError,
      );
    });

    it("devrait lever une erreur pour des formats non reconnus", () => {
      expect(() => convertirZoneIdEnTerritoireCode("X123")).toThrow(
        ConversionZoneIdError,
      );
      expect(() => convertirZoneIdEnTerritoireCode("PARIS")).toThrow(
        ConversionZoneIdError,
      );
      expect(() => convertirZoneIdEnTerritoireCode("123")).toThrow(
        ConversionZoneIdError,
      );
    });
  });

  describe("ConversionZoneIdError", () => {
    it("devrait avoir le bon nom d'erreur", () => {
      const error = new ConversionZoneIdError("TEST");
      expect(error.name).toBe("ConversionZoneIdError");
    });

    it("devrait avoir le bon message d'erreur", () => {
      const zoneId = "INVALID";
      const error = new ConversionZoneIdError(zoneId);
      expect(error.message).toBe(
        `Zone ID invalide: ${zoneId}. Les formats acceptés sont: 'France', 'D<nombre>', 'R<nombre>'`,
      );
    });

    it("devrait être une instance d'Error", () => {
      const error = new ConversionZoneIdError("TEST");
      expect(error).toBeInstanceOf(Error);
    });
  });
});

describe("convertirTerritoireCodeEnZoneId", () => {
  describe("cas valides", () => {
    it('devrait convertir "NAT-FR" en "France"', () => {
      expect(convertirTerritoireCodeEnZoneId("NAT-FR")).toBe("France");
    });

    it('devrait convertir "nat-fr" en minuscules en "France"', () => {
      expect(convertirTerritoireCodeEnZoneId("nat-fr")).toBe("France");
    });

    it('devrait convertir "NAT-FR" avec des espaces en "France"', () => {
      expect(convertirTerritoireCodeEnZoneId(" NAT-FR ")).toBe("France");
    });

    describe("départements", () => {
      it('devrait convertir "DEPT-84" en "D84"', () => {
        expect(convertirTerritoireCodeEnZoneId("DEPT-84")).toBe("D84");
      });

      it('devrait convertir "DEPT-01" en "D01"', () => {
        expect(convertirTerritoireCodeEnZoneId("DEPT-01")).toBe("D01");
      });

      it('devrait convertir "DEPT-974" en "D974"', () => {
        expect(convertirTerritoireCodeEnZoneId("DEPT-974")).toBe("D974");
      });

      it('devrait convertir "dept-75" en minuscules en "D75"', () => {
        expect(convertirTerritoireCodeEnZoneId("dept-75")).toBe("D75");
      });

      it('devrait convertir "DEPT-2A" en "D2A"', () => {
        expect(convertirTerritoireCodeEnZoneId("DEPT-2A")).toBe("D2A");
      });

      it('devrait convertir "dept-2a" en minuscules en "D2A"', () => {
        expect(convertirTerritoireCodeEnZoneId("dept-2a")).toBe("D2A");
      });
    });

    describe("régions", () => {
      it('devrait convertir "REG-44" en "R44"', () => {
        expect(convertirTerritoireCodeEnZoneId("REG-44")).toBe("R44");
      });

      it('devrait convertir "REG-84" en "R84"', () => {
        expect(convertirTerritoireCodeEnZoneId("REG-84")).toBe("R84");
      });

      it('devrait convertir "REG-1" en "R1"', () => {
        expect(convertirTerritoireCodeEnZoneId("REG-1")).toBe("R1");
      });

      it('devrait convertir "reg-44" en minuscules en "R44"', () => {
        expect(convertirTerritoireCodeEnZoneId("reg-44")).toBe("R44");
      });
    });
  });

  describe("cas d'erreur", () => {
    it("devrait lever une erreur pour une chaîne vide", () => {
      expect(() => convertirTerritoireCodeEnZoneId("")).toThrow(
        ConversionZoneIdError,
      );
    });

    it("devrait lever une erreur pour null", () => {
      // @ts-expect-error toujours utile à tester
      expect(() => convertirTerritoireCodeEnZoneId(null)).toThrow(
        ConversionZoneIdError,
      );
    });

    it("devrait lever une erreur pour undefined", () => {
      // @ts-expect-error toujours utile à tester
      expect(() => convertirTerritoireCodeEnZoneId()).toThrow(
        ConversionZoneIdError,
      );
    });

    it("devrait lever une erreur pour des formats non reconnus", () => {
      expect(() => convertirTerritoireCodeEnZoneId("INVALID-FORMAT")).toThrow(
        ConversionZoneIdError,
      );
      expect(() => convertirTerritoireCodeEnZoneId("DEPT")).toThrow(
        ConversionZoneIdError,
      );
      expect(() => convertirTerritoireCodeEnZoneId("REG")).toThrow(
        ConversionZoneIdError,
      );
      expect(() => convertirTerritoireCodeEnZoneId("DEPT-")).toThrow(
        ConversionZoneIdError,
      );
      expect(() => convertirTerritoireCodeEnZoneId("REG-")).toThrow(
        ConversionZoneIdError,
      );
      expect(() => convertirTerritoireCodeEnZoneId("DEPT-ABC")).toThrow(
        ConversionZoneIdError,
      );
      expect(() => convertirTerritoireCodeEnZoneId("REG-XYZ")).toThrow(
        ConversionZoneIdError,
      );
    });
  });
});
