import { PrismaTerritoireRepository } from "@/server/gestion-utilisateur/infrastructure/adapters/PrismaTerritoireRepository";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { createIntegrationTest } from "@/test/createIntegrationTest";

describe("PrismaTerritoireRepository", () => {
  let territoireRepository: PrismaTerritoireRepository;

  beforeEach(() => {
    territoireRepository = new PrismaTerritoireRepository({
      prisma: new PrismaPilote(),
    });
  });

  it(
    "liste uniquement les territoires demandés",
    createIntegrationTest(async () => {
      // When
      const territoires = await territoireRepository.list([
        "REG-44",
        "DEPT-08",
      ]);

      // Then
      expect(territoires.map((territoire) => territoire.code).sort()).toEqual([
        "DEPT-08",
        "REG-44",
      ]);
    }),
  );

  it(
    "ne liste aucun territoire pour une liste de codes vide",
    createIntegrationTest(async () => {
      // When
      const territoires = await territoireRepository.list([]);

      // Then
      expect(territoires).toEqual([]);
    }),
  );

  it(
    "liste tous les territoires et tous leurs codes",
    createIntegrationTest(async () => {
      // When
      const territoires = await territoireRepository.listAll();
      const codes = await territoireRepository.listAllCodes();

      // Then
      expect(codes).toContain("NAT-FR");
      expect(codes).toContain("REG-44");
      expect(territoires.map((territoire) => territoire.code).sort()).toEqual(
        [...codes].sort(),
      );
    }),
  );
});
