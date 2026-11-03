import { createIntegrationTest } from "@/test/createIntegrationTest";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { PrismaTerritoireResolver } from "@/server/albert/infrastructure/PrismaTerritoireResolver";

const REGIONS = [
  "REG-01",
  "REG-02",
  "REG-03",
  "REG-04",
  "REG-06",
  "REG-11",
  "REG-24",
  "REG-27",
  "REG-28",
  "REG-32",
  "REG-44",
  "REG-52",
  "REG-53",
  "REG-75",
  "REG-76",
  "REG-84",
  "REG-93",
  "REG-94",
];

describe("PrismaTerritoireResolver", () => {
  const resolver = new PrismaTerritoireResolver({ prisma: new PrismaPilote() });

  it(
    "SELECTION renvoie les codes demandés, sans doublon et dans l'ordre",
    createIntegrationTest(async () => {
      // When
      const codes = await resolver.resoudre({
        type: "SELECTION",
        territoire_codes: ["DEPT-59", "REG-53", "DEPT-59", "NAT-FR"],
      });

      // Then
      expect(codes).toEqual(["DEPT-59", "REG-53", "NAT-FR"]);
    }),
  );

  it(
    "REGION_ET_SES_DEPARTEMENTS renvoie la région puis ses départements",
    createIntegrationTest(async () => {
      // When
      const codes = await resolver.resoudre({
        type: "REGION_ET_SES_DEPARTEMENTS",
        region_code: "REG-53",
      });

      // Then
      expect(codes).toEqual([
        "REG-53",
        "DEPT-22",
        "DEPT-29",
        "DEPT-35",
        "DEPT-56",
      ]);
    }),
  );

  it(
    "FRANCE_ET_SES_REGIONS renvoie NAT-FR puis toutes les régions",
    createIntegrationTest(async () => {
      // When
      const codes = await resolver.resoudre({ type: "FRANCE_ET_SES_REGIONS" });

      // Then
      expect(codes).toEqual(["NAT-FR", ...REGIONS]);
    }),
  );

  it(
    "TOUTES_REGIONS renvoie toutes les régions, sans NAT-FR",
    createIntegrationTest(async () => {
      // When
      const codes = await resolver.resoudre({ type: "TOUTES_REGIONS" });

      // Then
      expect(codes).toEqual(REGIONS);
    }),
  );

  it(
    "TOUS_DEPARTEMENTS renvoie tous les départements",
    createIntegrationTest(async () => {
      // When
      const codes = await resolver.resoudre({ type: "TOUS_DEPARTEMENTS" });

      // Then
      expect(codes).toEqual(
        expect.arrayContaining(["DEPT-01", "DEPT-2A", "DEPT-2B", "DEPT-976"]),
      );
      expect(codes.every((code) => code.startsWith("DEPT-"))).toBe(true);
    }),
  );

  it(
    "TOUS_TERRITOIRES renvoie la France, les régions et les départements",
    createIntegrationTest(async () => {
      // When
      const codes = await resolver.resoudre({ type: "TOUS_TERRITOIRES" });

      // Then
      expect(codes).toEqual(
        expect.arrayContaining(["NAT-FR", ...REGIONS, "DEPT-01", "DEPT-976"]),
      );
    }),
  );
});
