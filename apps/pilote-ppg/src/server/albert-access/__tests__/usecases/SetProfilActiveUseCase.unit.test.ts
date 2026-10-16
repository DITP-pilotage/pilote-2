import { mock, MockProxy } from "vitest-mock-extended";
import { AlbertAccessRepository } from "@/server/albert-access/domain/ports/AlbertAccessRepository";
import { SetProfilActiveUseCase } from "@/server/albert-access/usecases/SetProfilActiveUseCase";
import { BadRequestError } from "@/shared/errors/bad-request-error";
import { NotFoundError } from "@/shared/errors/not-found-error";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";

describe("SetProfilActiveUseCase", () => {
  let albertAccessRepository: MockProxy<AlbertAccessRepository>;
  let useCase: SetProfilActiveUseCase;

  beforeEach(() => {
    albertAccessRepository = mock<AlbertAccessRepository>();
    useCase = new SetProfilActiveUseCase({ albertAccessRepository });
  });

  it("Doit activer un profil", async () => {
    await useCase.execute({
      profilCode: ProfilEnum.COORDINATEUR_REGION,
      active: true,
    });

    expect(albertAccessRepository.setProfilActive).toHaveBeenCalledWith(
      ProfilEnum.COORDINATEUR_REGION,
      true,
    );
  });

  it("Doit refuser de modifier DITP_ADMIN", async () => {
    await expect(
      useCase.execute({ profilCode: ProfilEnum.DITP_ADMIN, active: false }),
    ).rejects.toBeInstanceOf(BadRequestError);
    expect(albertAccessRepository.setProfilActive).not.toHaveBeenCalled();
  });

  it("Doit refuser un profil inconnu", async () => {
    await expect(
      useCase.execute({ profilCode: "PROFIL_INCONNU", active: true }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(albertAccessRepository.setProfilActive).not.toHaveBeenCalled();
  });
});
