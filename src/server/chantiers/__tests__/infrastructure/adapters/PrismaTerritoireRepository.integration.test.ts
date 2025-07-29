import { PrismaTerritoireRepository } from "@/server/chantiers/infrastructure/adapters/PrismaTerritoireRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";

describe("PrismaTerritoireRepository", () => {
  let prismaTerritoireRepository: PrismaTerritoireRepository;

  beforeEach(() => {
    const prismaPilote = new PrismaPilote();
    prismaTerritoireRepository = new PrismaTerritoireRepository({
      prisma: prismaPilote,
    });
  });

  it("doit récupérer la liste des codes de territoire et les codes de leurs territoires enfants", async () => {
    // When
    const territoireCodes =
      await prismaTerritoireRepository.recupererTerritoireCodesEtTerritoiresCodesEnfantsParTerritoireCode(
        { territoireCode: "REG-44" },
      );

    // Then
    expect(territoireCodes).toEqual([
      "REG-44",
      "DEPT-08",
      "DEPT-67",
      "DEPT-10",
      "DEPT-51",
      "DEPT-52",
      "DEPT-54",
      "DEPT-55",
      "DEPT-57",
      "DEPT-68",
      "DEPT-88",
    ]);
  });

  it("doit lancer une erreur si le territoire n'est pas trouvé", async () => {
    // When
    await expect(
      prismaTerritoireRepository.recupererTerritoireCodesEtTerritoiresCodesEnfantsParTerritoireCode(
        { territoireCode: "01010101" },
      ),
    ).rejects.toThrow("Territoire non trouvé");
  });
});
