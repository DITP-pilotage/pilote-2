import { mock, MockProxy } from "vitest-mock-extended";
import { AlbertAccessRepository } from "@/server/albert-access/domain/ports/AlbertAccessRepository";
import { AddUtilisateurUseCase } from "@/server/albert-access/usecases/AddUtilisateurUseCase";
import { BadRequestError } from "@/shared/errors/bad-request-error";
import { NotFoundError } from "@/shared/errors/not-found-error";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";

const UTILISATEUR_ID = "c57f3b57-f4d7-40e2-81fe-65e27fbd8ad0";

describe("AddUtilisateurUseCase", () => {
  let albertAccessRepository: MockProxy<AlbertAccessRepository>;
  let useCase: AddUtilisateurUseCase;

  beforeEach(() => {
    albertAccessRepository = mock<AlbertAccessRepository>();
    useCase = new AddUtilisateurUseCase({ albertAccessRepository });
  });

  it("Doit ajouter un utilisateur Pilote existant", async () => {
    albertAccessRepository.findUtilisateurProfil.mockResolvedValue(
      ProfilEnum.PREFET_REGION,
    );

    await useCase.execute({ utilisateurId: UTILISATEUR_ID });

    expect(albertAccessRepository.addUtilisateur).toHaveBeenCalledWith(
      UTILISATEUR_ID,
    );
  });

  it("Doit refuser un utilisateur inconnu de Pilote", async () => {
    albertAccessRepository.findUtilisateurProfil.mockResolvedValue(null);

    await expect(
      useCase.execute({ utilisateurId: UTILISATEUR_ID }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(albertAccessRepository.addUtilisateur).not.toHaveBeenCalled();
  });

  it("Doit refuser un utilisateur DITP_ADMIN", async () => {
    albertAccessRepository.findUtilisateurProfil.mockResolvedValue(
      ProfilEnum.DITP_ADMIN,
    );

    await expect(
      useCase.execute({ utilisateurId: UTILISATEUR_ID }),
    ).rejects.toBeInstanceOf(BadRequestError);
    expect(albertAccessRepository.addUtilisateur).not.toHaveBeenCalled();
  });
});
