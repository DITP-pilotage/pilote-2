import { RecupererValeursAvancementIndicateurTerritoiresQuery } from "@/server/chantiers/infrastructure/queries/RecupererValeursAvancementIndicateurTerritoiresQuery";
import { ListerDetailsIndicateurTerritoireUseCaseV2 } from "@/server/chantiers/usecases/ListerDetailsIndicateurTerritoireUseCaseV2";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

const habilitations = {
  lecture: { chantiers: [], territoires: [], périmètres: [] },
  saisieCommentaire: { chantiers: [], territoires: [], périmètres: [] },
  saisieIndicateur: { chantiers: [], territoires: [], périmètres: [] },
  responsabilite: { chantiers: [], territoires: [], périmètres: [] },
  gestionUtilisateur: { chantiers: [], territoires: [], périmètres: [] },
} as unknown as Habilitations;
const profil: ProfilCode = ProfilEnum.DITP_ADMIN;

function createMockUseCase(
  result: Awaited<
    ReturnType<ListerDetailsIndicateurTerritoireUseCaseV2["run"]>
  >,
) {
  return {
    run: vi.fn().mockResolvedValue(result),
  } as unknown as ListerDetailsIndicateurTerritoireUseCaseV2;
}

describe("RecupererValeursAvancementIndicateurTerritoiresQuery", () => {
  it("retourne un tableau vide quand l'indicateur n'a pas de détails", async () => {
    // given
    const query = new RecupererValeursAvancementIndicateurTerritoiresQuery({
      listerDetailsIndicateurTerritoireUseCaseV2: createMockUseCase({}),
    });

    // when
    const result = await query.execute({
      indicateurId: "IND-001",
      chantierId: "CH-001",
      jalon: 2025,
      habilitations,
      profil,
    });

    // then
    expect(result).toEqual([]);
  });

  it("mappe les détails territoires en valeurs d'avancement", async () => {
    // given
    const query = new RecupererValeursAvancementIndicateurTerritoiresQuery({
      listerDetailsIndicateurTerritoireUseCaseV2: createMockUseCase({
        "IND-001": {
          "DEPT-75": {
            valeurAvancement: 42,
            valeurCibleAnnuelle: 100,
            estApplicable: true,
          },
          "REG-11": {
            valeurAvancement: 55,
            valeurCibleAnnuelle: 80,
            estApplicable: false,
          },
        } as any,
      }),
    });

    // when
    const result = await query.execute({
      indicateurId: "IND-001",
      chantierId: "CH-001",
      jalon: 2025,
      habilitations,
      profil,
    });

    // then
    expect(result).toEqual([
      {
        territoireCode: "DEPT-75",
        valeurAvancement: 42,
        valeurCibleAnnuelle: 100,
        estApplicable: true,
      },
      {
        territoireCode: "REG-11",
        valeurAvancement: 55,
        valeurCibleAnnuelle: 80,
        estApplicable: false,
      },
    ]);
  });

  it("passe les bons paramètres au use case", async () => {
    // given
    const mockUseCase = createMockUseCase({});
    const query = new RecupererValeursAvancementIndicateurTerritoiresQuery({
      listerDetailsIndicateurTerritoireUseCaseV2: mockUseCase,
    });

    // when
    await query.execute({
      indicateurId: "IND-001",
      chantierId: "CH-001",
      jalon: 2025,
      habilitations,
      profil,
    });

    // then
    expect(mockUseCase.run).toHaveBeenCalledWith(
      ["IND-001"],
      "CH-001",
      habilitations,
      profil,
      2025,
    );
  });
});
