import { PrismaTerritoireRepository } from "@/server/chantiers/infrastructure/adapters/PrismaTerritoireRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";

describe("PrismaTerritoireRepository", () => {
  let prismaTerritoireRepository: PrismaTerritoireRepository;

  beforeEach(() => {
    const prismaPilote = new PrismaPilote();
    prismaTerritoireRepository = new PrismaTerritoireRepository({
      prisma: prismaPilote,
    });
  });

  describe("#recupererTerritoireCodesEtTerritoiresCodesEnfantsParTerritoireCode", () => {
    it(
      "doit récupérer la liste des codes de territoire et les codes de leurs territoires enfants",
      createIntegrationTest(async () => {
        // When
        const territoireCodes =
          await prismaTerritoireRepository.recupererTerritoireCodesEtTerritoiresCodesEnfantsParTerritoireCode(
            { territoireCode: "REG-44" },
          );

        // Then
        expect(territoireCodes[0]).toEqual("REG-44");
        expect(territoireCodes.slice(1).sort()).toEqual(
          [
            "DEPT-08",
            "DEPT-10",
            "DEPT-51",
            "DEPT-52",
            "DEPT-54",
            "DEPT-55",
            "DEPT-57",
            "DEPT-67",
            "DEPT-68",
            "DEPT-88",
          ].sort(),
        );
      }),
    );

    it(
      "doit lancer une erreur si le territoire n'est pas trouvé",
      createIntegrationTest(async () => {
        // When
        await expect(
          prismaTerritoireRepository.recupererTerritoireCodesEtTerritoiresCodesEnfantsParTerritoireCode(
            { territoireCode: "01010101" },
          ),
        ).rejects.toThrow("Territoire non trouvé");
      }),
    );
  });

  describe("#récupérerTousNew", () => {
    it(
      "doit retourner la liste de tous les territoires au format attendu",
      createIntegrationTest(async () => {
        // When
        const territoires = await prismaTerritoireRepository.récupérerTousNew();

        // Then
        expect(territoires).toHaveLength(120);

        expect(territoires).toContainEqual({
          code: "NAT-FR",
          nom: "France",
          nomAffiché: "France",
          codeInsee: "FR",
          codeParent: null,
          maille: "nationale",
        });
      }),
    );
  });
});
