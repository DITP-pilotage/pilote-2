import { mock, MockProxy } from "vitest-mock-extended";
import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { UtilisateurIAMRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository";
import { SuiviPasswordAdminRepository } from "@/server/gestion-utilisateur/domain/ports/SuiviPasswordAdminRepository";
import { ActionPasswordRepository } from "@/server/gestion-utilisateur/domain/ports/ActionPasswordRepository";
import { SynchroniserLesSuivisPasswordAdminUseCase } from "@/server/gestion-utilisateur/usecases/SynchroniserLesSuivisPasswordAdminUseCase";
import { SuiviPasswordAdmin } from "@/server/gestion-utilisateur/domain/SuiviPasswordAdmin";

vi.mock("@/server/infrastructure/Logger", () => ({
  __esModule: true,
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe("SynchroniserLesSuivisPasswordAdminUseCase", () => {
  let utilisateurRepository: MockProxy<UtilisateurRepository>;
  let utilisateurIAMRepository: MockProxy<UtilisateurIAMRepository>;
  let suiviPasswordAdminRepository: MockProxy<SuiviPasswordAdminRepository>;
  let actionPasswordRepository: MockProxy<ActionPasswordRepository>;
  let useCase: SynchroniserLesSuivisPasswordAdminUseCase;

  const AUJOURD_HUI = new Date("2026-10-01T12:00:00Z");
  const ADMIN = { id: "admin-id", email: "admin@test.gouv.fr" };

  const creerSuivi = (
    overrides: Partial<SuiviPasswordAdmin> = {},
  ): SuiviPasswordAdmin => ({
    utilisateurId: ADMIN.id,
    dateDernierChangement: new Date("2026-04-01T10:00:00Z"),
    dateExpiration: new Date("2026-10-01T10:00:00Z"),
    datePremiereRelance: new Date("2026-09-01T10:00:00Z"),
    dateDeuxiemeRelance: null,
    dateExpirationForcee: null,
    ...overrides,
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(AUJOURD_HUI);

    utilisateurRepository = mock<UtilisateurRepository>();
    utilisateurIAMRepository = mock<UtilisateurIAMRepository>();
    suiviPasswordAdminRepository = mock<SuiviPasswordAdminRepository>();
    actionPasswordRepository = mock<ActionPasswordRepository>();

    useCase = new SynchroniserLesSuivisPasswordAdminUseCase({
      utilisateurRepository,
      utilisateurIAMRepository,
      suiviPasswordAdminRepository,
      actionPasswordRepository,
    });

    utilisateurRepository.recupererComptesActifsParProfil.mockResolvedValue([
      ADMIN,
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("ne synchronise que les comptes actifs de profil DITP_ADMIN", async () => {
    // Given
    utilisateurRepository.recupererComptesActifsParProfil.mockResolvedValue([]);

    // When
    const resultat = await useCase.run();

    // Then
    expect(
      utilisateurRepository.recupererComptesActifsParProfil,
    ).toHaveBeenCalledWith("DITP_ADMIN");
    expect(resultat).toEqual({
      suivisInitialises: 0,
      changementsDetectes: 0,
      comptesNonSoumis: 0,
      erreurs: 0,
    });
  });

  it("initialise le suivi d'un compte qui n'en a pas encore", async () => {
    // Given
    suiviPasswordAdminRepository.recupererParUtilisateur.mockResolvedValue(
      null,
    );
    utilisateurIAMRepository.recupererDateDernierChangementPassword.mockResolvedValue(
      new Date("2026-04-01T10:00:00Z"),
    );

    // When
    const resultat = await useCase.run();

    // Then
    expect(suiviPasswordAdminRepository.sauvegarder).toHaveBeenCalledWith({
      utilisateurId: ADMIN.id,
      dateDernierChangement: new Date("2026-04-01T10:00:00Z"),
      dateExpiration: new Date("2026-10-31T12:00:00Z"),
      datePremiereRelance: null,
      dateDeuxiemeRelance: null,
      dateExpirationForcee: null,
    });
    expect(
      actionPasswordRepository.annulerActionsEnAttente,
    ).not.toHaveBeenCalled();
    expect(resultat).toEqual({
      suivisInitialises: 1,
      changementsDetectes: 0,
      comptesNonSoumis: 0,
      erreurs: 0,
    });
  });

  it("ignore un compte sans mot de passe Keycloak", async () => {
    // Given
    suiviPasswordAdminRepository.recupererParUtilisateur.mockResolvedValue(
      null,
    );
    utilisateurIAMRepository.recupererDateDernierChangementPassword.mockResolvedValue(
      null,
    );

    // When
    const resultat = await useCase.run();

    // Then
    expect(suiviPasswordAdminRepository.sauvegarder).not.toHaveBeenCalled();
    expect(resultat).toEqual({
      suivisInitialises: 0,
      changementsDetectes: 0,
      comptesNonSoumis: 1,
      erreurs: 0,
    });
  });

  it("ne modifie rien quand la date Keycloak est inchangée", async () => {
    // Given
    suiviPasswordAdminRepository.recupererParUtilisateur.mockResolvedValue(
      creerSuivi(),
    );
    utilisateurIAMRepository.recupererDateDernierChangementPassword.mockResolvedValue(
      new Date("2026-04-01T10:00:00Z"),
    );

    // When
    const resultat = await useCase.run();

    // Then
    expect(suiviPasswordAdminRepository.sauvegarder).not.toHaveBeenCalled();
    expect(
      actionPasswordRepository.annulerActionsEnAttente,
    ).not.toHaveBeenCalled();
    expect(resultat).toEqual({
      suivisInitialises: 0,
      changementsDetectes: 0,
      comptesNonSoumis: 0,
      erreurs: 0,
    });
  });

  it("repart sur un nouveau cycle et annule les actions en attente quand le mot de passe a changé", async () => {
    // Given
    suiviPasswordAdminRepository.recupererParUtilisateur.mockResolvedValue(
      creerSuivi(),
    );
    utilisateurIAMRepository.recupererDateDernierChangementPassword.mockResolvedValue(
      new Date("2026-09-28T10:00:00Z"),
    );

    // When
    const resultat = await useCase.run();

    // Then
    expect(suiviPasswordAdminRepository.sauvegarder).toHaveBeenCalledWith({
      utilisateurId: ADMIN.id,
      dateDernierChangement: new Date("2026-09-28T10:00:00Z"),
      dateExpiration: new Date("2027-03-28T10:00:00Z"),
      datePremiereRelance: null,
      dateDeuxiemeRelance: null,
      dateExpirationForcee: null,
    });
    expect(
      actionPasswordRepository.annulerActionsEnAttente,
    ).toHaveBeenCalledWith(ADMIN.id);
    expect(resultat).toEqual({
      suivisInitialises: 0,
      changementsDetectes: 1,
      comptesNonSoumis: 0,
      erreurs: 0,
    });
  });

  it("compte une erreur et continue quand Keycloak échoue pour un compte", async () => {
    // Given
    const autreAdmin = { id: "autre-id", email: "autre@test.gouv.fr" };
    utilisateurRepository.recupererComptesActifsParProfil.mockResolvedValue([
      ADMIN,
      autreAdmin,
    ]);
    suiviPasswordAdminRepository.recupererParUtilisateur.mockResolvedValue(
      null,
    );
    utilisateurIAMRepository.recupererDateDernierChangementPassword
      .mockRejectedValueOnce(new Error("Keycloak indisponible"))
      .mockResolvedValueOnce(new Date("2026-09-01T10:00:00Z"));

    // When
    const resultat = await useCase.run();

    // Then
    expect(suiviPasswordAdminRepository.sauvegarder).toHaveBeenCalledTimes(1);
    expect(suiviPasswordAdminRepository.sauvegarder).toHaveBeenCalledWith(
      expect.objectContaining({ utilisateurId: autreAdmin.id }),
    );
    expect(resultat).toEqual({
      suivisInitialises: 1,
      changementsDetectes: 0,
      comptesNonSoumis: 0,
      erreurs: 1,
    });
  });
});
