import { getContainer } from "@/server/dependances";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";

describe("CheckAlbertAccessUseCase", () => {
  it(
    "Doit refuser un coordinateur sans permission en base et lui attribuer les scénarios coordinateur",
    createIntegrationTest(async () => {
      const useCase = getContainer("albertAccess").resolve(
        "checkAlbertAccessUseCase",
      );

      const result = await useCase.execute({
        utilisateurId: "c57f3b57-f4d7-40e2-81fe-65e27fbd8ad0",
        profil: ProfilEnum.COORDINATEUR_REGION,
      });

      expect(result).toEqual({
        peutUtiliser: false,
        scenarios: "coordinateur",
      });
    }),
  );
});
