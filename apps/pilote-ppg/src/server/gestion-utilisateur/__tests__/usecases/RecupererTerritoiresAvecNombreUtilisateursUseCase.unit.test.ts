import { mock, MockProxy } from "vitest-mock-extended";
import { TerritoireBuilder } from "@/test/builders/Territoire.builder";
import { RecupererTerritoiresAvecNombreUtilisateursUseCase } from "@/server/gestion-utilisateur/usecases/RecupererTerritoiresAvecNombreUtilisateursUseCase";
import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { TerritoireRepository } from "@/server/gestion-utilisateur/domain/ports/TerritoireRepository";

describe("RecupererTerritoiresAvecNombreUtilisateursUseCase", () => {
  let utilisateurRepository: MockProxy<UtilisateurRepository>;
  let territoireRepository: MockProxy<TerritoireRepository>;
  let récupérerTerritoiresAvecNombreUtilisateursUseCase: RecupererTerritoiresAvecNombreUtilisateursUseCase;

  beforeEach(() => {
    utilisateurRepository = mock<UtilisateurRepository>();
    territoireRepository = mock<TerritoireRepository>();
    récupérerTerritoiresAvecNombreUtilisateursUseCase =
      new RecupererTerritoiresAvecNombreUtilisateursUseCase({
        territoireRepository,
        utilisateurRepository,
      });
  });

  it("récupère les territoires demandés avec leur nombre d'utilisateurs", async () => {
    // Given
    const territoires = [
      new TerritoireBuilder()
        .avecCode("DEPT-01")
        .avecMaille("departementale")
        .build(),
      new TerritoireBuilder()
        .avecCode("REG-84")
        .avecMaille("regionale")
        .build(),
    ];
    territoireRepository.list.mockResolvedValue(territoires);
    utilisateurRepository.récupérerNombreUtilisateursParTerritoires.mockResolvedValue(
      { "DEPT-01": 2, "REG-84": 4 },
    );

    // When
    const result = await récupérerTerritoiresAvecNombreUtilisateursUseCase.run({
      territoireCodes: ["DEPT-01", "REG-84"],
    });

    // Then
    expect(territoireRepository.list).toHaveBeenCalledWith([
      "DEPT-01",
      "REG-84",
    ]);
    expect(result).toEqual([
      { ...territoires[0], nombreUtilisateur: 2 },
      { ...territoires[1], nombreUtilisateur: 4 },
    ]);
  });

  it("récupère tous les territoires quand aucun code n'est demandé", async () => {
    // Given
    const territoires = [
      new TerritoireBuilder()
        .avecCode("DEPT-01")
        .avecMaille("departementale")
        .build(),
    ];
    territoireRepository.listAll.mockResolvedValue(territoires);
    utilisateurRepository.récupérerNombreUtilisateursParTerritoires.mockResolvedValue(
      { "DEPT-01": 2 },
    );

    // When
    const result = await récupérerTerritoiresAvecNombreUtilisateursUseCase.run({
      territoireCodes: null,
    });

    // Then
    expect(territoireRepository.list).not.toHaveBeenCalled();
    expect(result).toEqual([{ ...territoires[0], nombreUtilisateur: 2 }]);
  });

  it("transmet une liste de codes vide au dépôt sans la convertir en « tous »", async () => {
    // Given
    territoireRepository.list.mockResolvedValue([]);
    utilisateurRepository.récupérerNombreUtilisateursParTerritoires.mockResolvedValue(
      {},
    );

    // When
    const result = await récupérerTerritoiresAvecNombreUtilisateursUseCase.run({
      territoireCodes: [],
    });

    // Then
    expect(territoireRepository.list).toHaveBeenCalledWith([]);
    expect(territoireRepository.listAll).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
