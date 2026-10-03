import { mock, MockProxy } from "vitest-mock-extended";
import { randomUUID } from "crypto";
import { SuiviPasswordAdminRepository } from "@/server/gestion-utilisateur/domain/ports/SuiviPasswordAdminRepository";
import { ActionPasswordRepository } from "@/server/gestion-utilisateur/domain/ports/ActionPasswordRepository";
import { CreerLesActionsPasswordUseCase } from "@/server/gestion-utilisateur/usecases/CreerLesActionsPasswordUseCase";
import { SuiviPasswordAdmin } from "@/server/gestion-utilisateur/domain/SuiviPasswordAdmin";
import { ActionPassword } from "@/server/gestion-utilisateur/domain/ActionPassword";

vi.mock("@/server/infrastructure/Logger", () => ({
  __esModule: true,
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe("CreerLesActionsPasswordUseCase", () => {
  let suiviPasswordAdminRepository: MockProxy<SuiviPasswordAdminRepository>;
  let actionPasswordRepository: MockProxy<ActionPasswordRepository>;
  let useCase: CreerLesActionsPasswordUseCase;

  const AUJOURD_HUI = new Date("2026-09-01T12:00:00Z");

  const creerSuivi = (
    overrides: Partial<SuiviPasswordAdmin> = {},
  ): SuiviPasswordAdmin => ({
    utilisateurId: "admin-id",
    dateDernierChangement: new Date("2026-04-01T10:00:00Z"),
    dateExpiration: new Date("2026-10-01T10:00:00Z"),
    datePremiereRelance: null,
    dateDeuxiemeRelance: null,
    dateExpirationForcee: null,
    ...overrides,
  });

  const creerAction = (
    overrides: Partial<ActionPassword> = {},
  ): ActionPassword => ({
    id: randomUUID(),
    utilisateurId: "admin-id",
    typeAction: "PREMIERE_RELANCE",
    dateCreation: new Date("2026-08-31"),
    statut: "CREEE",
    dateSucces: null,
    dateDerniereTentative: null,
    nombreTentatives: 0,
    erreur: null,
    ...overrides,
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(AUJOURD_HUI);

    suiviPasswordAdminRepository = mock<SuiviPasswordAdminRepository>();
    actionPasswordRepository = mock<ActionPasswordRepository>();
    actionPasswordRepository.recupererActionsParTypeEtStatut.mockResolvedValue(
      [],
    );

    useCase = new CreerLesActionsPasswordUseCase({
      suiviPasswordAdminRepository,
      actionPasswordRepository,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("ne considère que les suivis des comptes actifs de profil DITP_ADMIN", async () => {
    // Given
    suiviPasswordAdminRepository.recupererDesComptesActifsParProfil.mockResolvedValue(
      [],
    );

    // When
    await useCase.run();

    // Then
    expect(
      suiviPasswordAdminRepository.recupererDesComptesActifsParProfil,
    ).toHaveBeenCalledWith("DITP_ADMIN");
  });

  it("ne crée rien quand aucun suivi n'est dû", async () => {
    // Given
    suiviPasswordAdminRepository.recupererDesComptesActifsParProfil.mockResolvedValue(
      [creerSuivi({ dateExpiration: new Date("2027-01-01T10:00:00Z") })],
    );

    // When
    const resultat = await useCase.run();

    // Then
    expect(actionPasswordRepository.sauvegarder).not.toHaveBeenCalled();
    expect(resultat).toEqual({
      actionsPremiereRelance: 0,
      actionsDeuxiemeRelance: 0,
      actionsExpiration: 0,
    });
  });

  it("crée une action PREMIERE_RELANCE à J-30", async () => {
    // Given
    suiviPasswordAdminRepository.recupererDesComptesActifsParProfil.mockResolvedValue(
      [creerSuivi()],
    );

    // When
    const resultat = await useCase.run();

    // Then
    expect(actionPasswordRepository.sauvegarder).toHaveBeenCalledWith(
      expect.objectContaining({
        utilisateurId: "admin-id",
        typeAction: "PREMIERE_RELANCE",
        statut: "CREEE",
        dateCreation: AUJOURD_HUI,
      }),
    );
    expect(resultat).toEqual({
      actionsPremiereRelance: 1,
      actionsDeuxiemeRelance: 0,
      actionsExpiration: 0,
    });
  });

  it("crée une action DEUXIEME_RELANCE à J-7 et EXPIRATION à J0", async () => {
    // Given
    vi.setSystemTime(new Date("2026-10-01T12:00:00Z"));
    suiviPasswordAdminRepository.recupererDesComptesActifsParProfil.mockResolvedValue(
      [
        creerSuivi({
          utilisateurId: "admin-a-j7",
          dateExpiration: new Date("2026-10-08T10:00:00Z"),
          datePremiereRelance: new Date("2026-09-08T10:00:00Z"),
        }),
        creerSuivi({
          utilisateurId: "admin-a-j0",
          datePremiereRelance: new Date("2026-09-01T10:00:00Z"),
          dateDeuxiemeRelance: new Date("2026-09-24T10:00:00Z"),
        }),
      ],
    );

    // When
    const resultat = await useCase.run();

    // Then
    expect(actionPasswordRepository.sauvegarder).toHaveBeenCalledWith(
      expect.objectContaining({
        utilisateurId: "admin-a-j7",
        typeAction: "DEUXIEME_RELANCE",
      }),
    );
    expect(actionPasswordRepository.sauvegarder).toHaveBeenCalledWith(
      expect.objectContaining({
        utilisateurId: "admin-a-j0",
        typeAction: "EXPIRATION",
      }),
    );
    expect(resultat).toEqual({
      actionsPremiereRelance: 0,
      actionsDeuxiemeRelance: 1,
      actionsExpiration: 1,
    });
  });

  it("ne recrée pas une action du même type déjà en attente", async () => {
    // Given
    suiviPasswordAdminRepository.recupererDesComptesActifsParProfil.mockResolvedValue(
      [creerSuivi()],
    );
    actionPasswordRepository.recupererActionsParTypeEtStatut.mockResolvedValue([
      creerAction(),
    ]);

    // When
    const resultat = await useCase.run();

    // Then
    expect(actionPasswordRepository.sauvegarder).not.toHaveBeenCalled();
    expect(resultat).toEqual({
      actionsPremiereRelance: 0,
      actionsDeuxiemeRelance: 0,
      actionsExpiration: 0,
    });
  });

  it("continue avec les autres suivis quand la sauvegarde d'une action échoue", async () => {
    // Given
    suiviPasswordAdminRepository.recupererDesComptesActifsParProfil.mockResolvedValue(
      [
        creerSuivi({ utilisateurId: "admin-en-erreur" }),
        creerSuivi({ utilisateurId: "admin-ok" }),
      ],
    );
    actionPasswordRepository.sauvegarder
      .mockRejectedValueOnce(new Error("Base indisponible"))
      .mockResolvedValueOnce(undefined);

    // When
    const resultat = await useCase.run();

    // Then
    expect(actionPasswordRepository.sauvegarder).toHaveBeenCalledTimes(2);
    expect(resultat).toEqual({
      actionsPremiereRelance: 1,
      actionsDeuxiemeRelance: 0,
      actionsExpiration: 0,
    });
  });
});
