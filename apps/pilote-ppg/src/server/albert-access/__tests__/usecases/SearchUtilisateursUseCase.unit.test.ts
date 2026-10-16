import { mock, MockProxy } from "vitest-mock-extended";
import { AlbertAccessRepository } from "@/server/albert-access/domain/ports/AlbertAccessRepository";
import { SearchUtilisateursUseCase } from "@/server/albert-access/usecases/SearchUtilisateursUseCase";

describe("SearchUtilisateursUseCase", () => {
  let albertAccessRepository: MockProxy<AlbertAccessRepository>;
  let useCase: SearchUtilisateursUseCase;

  beforeEach(() => {
    albertAccessRepository = mock<AlbertAccessRepository>();
    albertAccessRepository.searchUtilisateurs.mockResolvedValue([]);
    useCase = new SearchUtilisateursUseCase({ albertAccessRepository });
  });

  it("Doit ne rien chercher en dessous de 3 caractères utiles", async () => {
    expect(await useCase.execute({ query: "  je  " })).toEqual([]);
    expect(albertAccessRepository.searchUtilisateurs).not.toHaveBeenCalled();
  });

  it("Doit chercher la saisie trimée avec une limite de 10", async () => {
    await useCase.execute({ query: "  jean.d " });

    expect(albertAccessRepository.searchUtilisateurs).toHaveBeenCalledWith(
      "jean.d",
      10,
    );
  });
});
