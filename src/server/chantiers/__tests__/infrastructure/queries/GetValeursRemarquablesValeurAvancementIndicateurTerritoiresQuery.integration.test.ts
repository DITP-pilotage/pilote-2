import { GetValeursRemarquablesValeurAvancementIndicateurTerritoiresQuery } from "@/server/chantiers/infrastructure/queries/GetValeursRemarquablesValeurAvancementIndicateurTerritoiresQuery";
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

function createQuery(
  details: Record<
    string,
    { valeurAvancement: number | null; estApplicable: boolean | null }
  >,
) {
  return new GetValeursRemarquablesValeurAvancementIndicateurTerritoiresQuery({
    listerDetailsIndicateurTerritoireUseCaseV2: createMockUseCase({
      "IND-001": details as any,
    }),
  });
}

describe("GetValeursRemarquablesValeurAvancementIndicateurTerritoiresQuery", () => {
  it("retourne null pour toutes les valeurs quand il n'y a pas de territoires", async () => {
    // given
    const query = createQuery({});

    // when
    const result = await query.execute({
      indicateurId: "IND-001",
      chantierId: "CH-001",
      maille: "departementale",
      jalon: 2025,
      habilitations,
      profil,
    });

    // then
    expect(result).toEqual({
      minimum: null,
      médiane: null,
      maximum: null,
    });
  });

  it("calcule la médiane pour un nombre impair de valeurs", async () => {
    // given
    const query = createQuery({
      "DEPT-75": { valeurAvancement: 30, estApplicable: true },
      "DEPT-92": { valeurAvancement: 50, estApplicable: true },
      "DEPT-93": { valeurAvancement: 70, estApplicable: true },
    });

    // when
    const result = await query.execute({
      indicateurId: "IND-001",
      chantierId: "CH-001",
      maille: "departementale",
      jalon: 2025,
      habilitations,
      profil,
    });

    // then
    expect(result).toEqual({
      minimum: 30,
      médiane: 50,
      maximum: 70,
    });
  });

  it("calcule la médiane pour un nombre pair de valeurs", async () => {
    // given
    const query = createQuery({
      "DEPT-75": { valeurAvancement: 20, estApplicable: true },
      "DEPT-92": { valeurAvancement: 40, estApplicable: true },
      "DEPT-93": { valeurAvancement: 60, estApplicable: true },
      "DEPT-94": { valeurAvancement: 80, estApplicable: true },
    });

    // when
    const result = await query.execute({
      indicateurId: "IND-001",
      chantierId: "CH-001",
      maille: "departementale",
      jalon: 2025,
      habilitations,
      profil,
    });

    // then
    expect(result).toEqual({
      minimum: 20,
      médiane: 50,
      maximum: 80,
    });
  });

  it("filtre par maille régionale", async () => {
    // given
    const query = createQuery({
      "REG-11": { valeurAvancement: 10, estApplicable: true },
      "REG-44": { valeurAvancement: 90, estApplicable: true },
      "DEPT-75": { valeurAvancement: 50, estApplicable: true },
    });

    // when
    const result = await query.execute({
      indicateurId: "IND-001",
      chantierId: "CH-001",
      maille: "regionale",
      jalon: 2025,
      habilitations,
      profil,
    });

    // then
    expect(result).toEqual({
      minimum: 10,
      médiane: 50,
      maximum: 90,
    });
  });

  it("filtre par maille départementale", async () => {
    // given
    const query = createQuery({
      "DEPT-75": { valeurAvancement: 20, estApplicable: true },
      "DEPT-92": { valeurAvancement: 80, estApplicable: true },
      "REG-11": { valeurAvancement: 50, estApplicable: true },
    });

    // when
    const result = await query.execute({
      indicateurId: "IND-001",
      chantierId: "CH-001",
      maille: "departementale",
      jalon: 2025,
      habilitations,
      profil,
    });

    // then
    expect(result).toEqual({
      minimum: 20,
      médiane: 50,
      maximum: 80,
    });
  });

  it("exclut les territoires non applicables", async () => {
    // given
    const query = createQuery({
      "DEPT-75": { valeurAvancement: 10, estApplicable: false },
      "DEPT-92": { valeurAvancement: 50, estApplicable: true },
      "DEPT-93": { valeurAvancement: 90, estApplicable: true },
    });

    // when
    const result = await query.execute({
      indicateurId: "IND-001",
      chantierId: "CH-001",
      maille: "departementale",
      jalon: 2025,
      habilitations,
      profil,
    });

    // then
    expect(result).toEqual({
      minimum: 50,
      médiane: 70,
      maximum: 90,
    });
  });

  it("exclut les territoires avec valeurAvancement null", async () => {
    // given
    const query = createQuery({
      "DEPT-75": { valeurAvancement: null, estApplicable: true },
      "DEPT-92": { valeurAvancement: 40, estApplicable: true },
      "DEPT-93": { valeurAvancement: 60, estApplicable: true },
    });

    // when
    const result = await query.execute({
      indicateurId: "IND-001",
      chantierId: "CH-001",
      maille: "departementale",
      jalon: 2025,
      habilitations,
      profil,
    });

    // then
    expect(result).toEqual({
      minimum: 40,
      médiane: 50,
      maximum: 60,
    });
  });
});
