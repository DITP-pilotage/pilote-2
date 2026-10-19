import { mock, MockProxy } from "vitest-mock-extended";
import { AssertAlbertAccessUseCase } from "@/server/albert-access/usecases/AssertAlbertAccessUseCase";
import { CheckAlbertAccessUseCase } from "@/server/albert-access/usecases/CheckAlbertAccessUseCase";
import { ForbiddenError } from "@/shared/errors/forbidden-error";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";

const UTILISATEUR_ID = "c57f3b57-f4d7-40e2-81fe-65e27fbd8ad0";

describe("AssertAlbertAccessUseCase", () => {
  let checkAlbertAccessUseCase: MockProxy<CheckAlbertAccessUseCase>;
  let useCase: AssertAlbertAccessUseCase;

  beforeEach(() => {
    checkAlbertAccessUseCase = mock<CheckAlbertAccessUseCase>();
    useCase = new AssertAlbertAccessUseCase({ checkAlbertAccessUseCase });
  });

  it("Doit laisser passer un utilisateur ayant accès à l'assistant IA", async () => {
    checkAlbertAccessUseCase.execute.mockResolvedValue({
      peutUtiliser: true,
      scenarios: "coordinateur",
    });

    await expect(
      useCase.execute({
        utilisateurId: UTILISATEUR_ID,
        profil: ProfilEnum.COORDINATEUR_REGION,
      }),
    ).resolves.toBeUndefined();
  });

  it("Doit refuser un utilisateur sans accès à l'assistant IA", async () => {
    checkAlbertAccessUseCase.execute.mockResolvedValue({
      peutUtiliser: false,
      scenarios: "coordinateur",
    });

    await expect(
      useCase.execute({
        utilisateurId: UTILISATEUR_ID,
        profil: ProfilEnum.COORDINATEUR_REGION,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
