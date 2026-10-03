import { mock, MockProxy } from "vitest-mock-extended";
import { randomUUID } from "crypto";
import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { UtilisateurIAMRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository";
import { SuiviPasswordAdminRepository } from "@/server/gestion-utilisateur/domain/ports/SuiviPasswordAdminRepository";
import { ActionPasswordRepository } from "@/server/gestion-utilisateur/domain/ports/ActionPasswordRepository";
import { ContactInfoLettresService } from "@/server/gestion-utilisateur/domain/ports/ContactInfoLettresService";
import { ExecuterLesActionsPasswordUseCase } from "@/server/gestion-utilisateur/usecases/ExecuterLesActionsPasswordUseCase";
import { SuiviPasswordAdmin } from "@/server/gestion-utilisateur/domain/SuiviPasswordAdmin";
import { ActionPassword } from "@/server/gestion-utilisateur/domain/ActionPassword";
import { configuration } from "@/config";

vi.mock("@/server/infrastructure/Logger", () => ({
  __esModule: true,
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("@/config", () => ({
  configuration: vi.fn(),
}));

const mockConfiguration = vi.mocked(configuration);

describe("ExecuterLesActionsPasswordUseCase", () => {
  let utilisateurRepository: MockProxy<UtilisateurRepository>;
  let utilisateurIAMRepository: MockProxy<UtilisateurIAMRepository>;
  let suiviPasswordAdminRepository: MockProxy<SuiviPasswordAdminRepository>;
  let actionPasswordRepository: MockProxy<ActionPasswordRepository>;
  let contactInfoLettresService: MockProxy<ContactInfoLettresService>;
  let useCase: ExecuterLesActionsPasswordUseCase;

  const AUJOURD_HUI = new Date("2026-09-01T12:00:00Z");
  const TEMPLATE_ID = 42;
  const ADMIN_ID = "admin-id";
  const ADMIN_EMAIL = "admin@test.gouv.fr";

  const configurerTemplate = (templateExpirationPasswordId: number) => {
    mockConfiguration.mockReturnValue({
      brevo: { templateExpirationPasswordId },
    } as unknown as ReturnType<typeof configuration>);
  };

  // Suivi à J-30 de l'expiration par rapport à AUJOURD_HUI : la première relance est due
  const creerSuivi = (
    overrides: Partial<SuiviPasswordAdmin> = {},
  ): SuiviPasswordAdmin => ({
    utilisateurId: ADMIN_ID,
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
    utilisateurId: ADMIN_ID,
    typeAction: "PREMIERE_RELANCE",
    dateCreation: new Date("2026-09-01"),
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
    configurerTemplate(TEMPLATE_ID);

    utilisateurRepository = mock<UtilisateurRepository>();
    utilisateurIAMRepository = mock<UtilisateurIAMRepository>();
    suiviPasswordAdminRepository = mock<SuiviPasswordAdminRepository>();
    actionPasswordRepository = mock<ActionPasswordRepository>();
    contactInfoLettresService = mock<ContactInfoLettresService>();

    useCase = new ExecuterLesActionsPasswordUseCase({
      utilisateurRepository,
      utilisateurIAMRepository,
      suiviPasswordAdminRepository,
      actionPasswordRepository,
      contactInfoLettresService,
    });

    utilisateurRepository.estActif.mockResolvedValue(true);
    utilisateurRepository.recupererUtilisateurEmail.mockResolvedValue(
      ADMIN_EMAIL,
    );
    suiviPasswordAdminRepository.recupererParUtilisateur.mockResolvedValue(
      creerSuivi(),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("refuse de s'exécuter tant que le template Brevo n'est pas configuré", async () => {
    // Given
    configurerTemplate(0);

    // When / Then
    await expect(useCase.run()).rejects.toThrow(
      "Template Brevo d'expiration du mot de passe non configuré",
    );
    expect(
      actionPasswordRepository.recupererActionsParTypeEtStatut,
    ).not.toHaveBeenCalled();
  });

  it("envoie la première relance et pose la date sur le suivi", async () => {
    // Given
    const action = creerAction();
    actionPasswordRepository.recupererActionsParTypeEtStatut.mockResolvedValue([
      action,
    ]);

    // When
    const resultat = await useCase.run();

    // Then
    expect(contactInfoLettresService.envoieUnEmail).toHaveBeenCalledWith(
      [{ email: ADMIN_EMAIL }],
      TEMPLATE_ID,
      { joursAvantExpiration: 30, dateExpiration: "01/10/2026" },
    );
    expect(suiviPasswordAdminRepository.sauvegarder).toHaveBeenCalledWith(
      creerSuivi({ datePremiereRelance: AUJOURD_HUI }),
    );
    expect(actionPasswordRepository.sauvegarder).toHaveBeenCalledWith({
      ...action,
      statut: "SUCCES",
      dateSucces: AUJOURD_HUI,
    });
    expect(
      utilisateurIAMRepository.forcerChangementPassword,
    ).not.toHaveBeenCalled();
    expect(resultat).toEqual({
      premieresRelancesEnvoyees: 1,
      deuxiemesRelancesEnvoyees: 0,
      expirationsForcees: 0,
      erreurs: 0,
    });
  });

  it("envoie la deuxième relance avec 7 jours", async () => {
    // Given
    const suiviAJMoins7 = creerSuivi({
      dateExpiration: new Date("2026-09-08T10:00:00Z"),
      datePremiereRelance: new Date("2026-08-09T10:00:00Z"),
    });
    suiviPasswordAdminRepository.recupererParUtilisateur.mockResolvedValue(
      suiviAJMoins7,
    );
    actionPasswordRepository.recupererActionsParTypeEtStatut.mockResolvedValue([
      creerAction({ typeAction: "DEUXIEME_RELANCE" }),
    ]);

    // When
    const resultat = await useCase.run();

    // Then
    expect(contactInfoLettresService.envoieUnEmail).toHaveBeenCalledWith(
      [{ email: ADMIN_EMAIL }],
      TEMPLATE_ID,
      { joursAvantExpiration: 7, dateExpiration: "08/09/2026" },
    );
    expect(suiviPasswordAdminRepository.sauvegarder).toHaveBeenCalledWith({
      ...suiviAJMoins7,
      dateDeuxiemeRelance: AUJOURD_HUI,
    });
    expect(resultat).toEqual({
      premieresRelancesEnvoyees: 0,
      deuxiemesRelancesEnvoyees: 1,
      expirationsForcees: 0,
      erreurs: 0,
    });
  });

  it("force le changement dans Keycloak, envoie l'email J0 et pose la date d'expiration forcée", async () => {
    // Given
    const suiviExpire = creerSuivi({
      dateExpiration: new Date("2026-09-01T10:00:00Z"),
      datePremiereRelance: new Date("2026-08-02T10:00:00Z"),
      dateDeuxiemeRelance: new Date("2026-08-25T10:00:00Z"),
    });
    suiviPasswordAdminRepository.recupererParUtilisateur.mockResolvedValue(
      suiviExpire,
    );
    actionPasswordRepository.recupererActionsParTypeEtStatut.mockResolvedValue([
      creerAction({ typeAction: "EXPIRATION" }),
    ]);

    // When
    const resultat = await useCase.run();

    // Then
    expect(
      utilisateurIAMRepository.forcerChangementPassword,
    ).toHaveBeenCalledWith(ADMIN_EMAIL);
    expect(contactInfoLettresService.envoieUnEmail).toHaveBeenCalledWith(
      [{ email: ADMIN_EMAIL }],
      TEMPLATE_ID,
      { joursAvantExpiration: 0, dateExpiration: "01/09/2026" },
    );
    expect(suiviPasswordAdminRepository.sauvegarder).toHaveBeenCalledWith({
      ...suiviExpire,
      dateExpirationForcee: AUJOURD_HUI,
    });
    expect(resultat).toEqual({
      premieresRelancesEnvoyees: 0,
      deuxiemesRelancesEnvoyees: 0,
      expirationsForcees: 1,
      erreurs: 0,
    });
  });

  it("marque l'action en échec et ne pose aucune date quand l'envoi échoue", async () => {
    // Given
    const action = creerAction();
    actionPasswordRepository.recupererActionsParTypeEtStatut.mockResolvedValue([
      action,
    ]);
    contactInfoLettresService.envoieUnEmail.mockRejectedValue(
      new Error("Brevo indisponible"),
    );

    // When
    const resultat = await useCase.run();

    // Then
    expect(suiviPasswordAdminRepository.sauvegarder).not.toHaveBeenCalled();
    expect(actionPasswordRepository.sauvegarder).toHaveBeenCalledWith({
      ...action,
      statut: "ECHEC",
      nombreTentatives: 1,
      dateDerniereTentative: AUJOURD_HUI,
      erreur: "Brevo indisponible",
    });
    expect(resultat).toEqual({
      premieresRelancesEnvoyees: 0,
      deuxiemesRelancesEnvoyees: 0,
      expirationsForcees: 0,
      erreurs: 1,
    });
  });

  it("marque en échec une action dont le compte est désactivé, sans email ni appel Keycloak", async () => {
    // Given
    const action = creerAction({ typeAction: "EXPIRATION" });
    actionPasswordRepository.recupererActionsParTypeEtStatut.mockResolvedValue([
      action,
    ]);
    utilisateurRepository.estActif.mockResolvedValue(false);

    // When
    const resultat = await useCase.run();

    // Then
    expect(contactInfoLettresService.envoieUnEmail).not.toHaveBeenCalled();
    expect(
      utilisateurIAMRepository.forcerChangementPassword,
    ).not.toHaveBeenCalled();
    expect(actionPasswordRepository.sauvegarder).toHaveBeenCalledWith(
      expect.objectContaining({
        id: action.id,
        statut: "ECHEC",
        erreur: "Compte désactivé",
      }),
    );
    expect(resultat).toEqual({
      premieresRelancesEnvoyees: 0,
      deuxiemesRelancesEnvoyees: 0,
      expirationsForcees: 0,
      erreurs: 1,
    });
  });

  it("écarte sans erreur une action EXPIRATION devenue obsolète parce que le mot de passe a changé entre-temps", async () => {
    // Given
    const action = creerAction({ typeAction: "EXPIRATION" });
    actionPasswordRepository.recupererActionsParTypeEtStatut.mockResolvedValue([
      action,
    ]);
    suiviPasswordAdminRepository.recupererParUtilisateur.mockResolvedValue(
      creerSuivi({
        dateDernierChangement: new Date("2026-08-31T10:00:00Z"),
        dateExpiration: new Date("2027-02-28T10:00:00Z"),
      }),
    );

    // When
    const resultat = await useCase.run();

    // Then
    expect(
      utilisateurIAMRepository.forcerChangementPassword,
    ).not.toHaveBeenCalled();
    expect(contactInfoLettresService.envoieUnEmail).not.toHaveBeenCalled();
    expect(suiviPasswordAdminRepository.sauvegarder).not.toHaveBeenCalled();
    expect(actionPasswordRepository.sauvegarder).toHaveBeenCalledWith({
      ...action,
      statut: "ECHEC",
      nombreTentatives: 1,
      dateDerniereTentative: AUJOURD_HUI,
      erreur: "Action obsolète : le suivi du mot de passe ne la justifie plus",
    });
    expect(resultat).toEqual({
      premieresRelancesEnvoyees: 0,
      deuxiemesRelancesEnvoyees: 0,
      expirationsForcees: 0,
      erreurs: 0,
    });
  });

  it("écarte une PREMIERE_RELANCE résiduelle quand la relance est déjà posée sur le suivi", async () => {
    // Given
    actionPasswordRepository.recupererActionsParTypeEtStatut.mockResolvedValue([
      creerAction(),
    ]);
    suiviPasswordAdminRepository.recupererParUtilisateur.mockResolvedValue(
      creerSuivi({ datePremiereRelance: new Date("2026-08-31T10:00:00Z") }),
    );

    // When
    const resultat = await useCase.run();

    // Then
    expect(contactInfoLettresService.envoieUnEmail).not.toHaveBeenCalled();
    expect(actionPasswordRepository.sauvegarder).toHaveBeenCalledWith(
      expect.objectContaining({ statut: "ECHEC" }),
    );
    expect(resultat.erreurs).toBe(0);
  });

  it("traite les expirations avant les relances", async () => {
    // Given
    actionPasswordRepository.recupererActionsParTypeEtStatut.mockResolvedValue([
      creerAction({
        utilisateurId: "relance-id",
        typeAction: "PREMIERE_RELANCE",
      }),
      creerAction({ utilisateurId: "expiration-id", typeAction: "EXPIRATION" }),
    ]);
    utilisateurRepository.recupererUtilisateurEmail.mockImplementation(
      async (utilisateurId) => `${utilisateurId}@test.gouv.fr`,
    );
    suiviPasswordAdminRepository.recupererParUtilisateur.mockImplementation(
      async (utilisateurId) =>
        utilisateurId === "expiration-id"
          ? creerSuivi({
              utilisateurId,
              dateExpiration: new Date("2026-09-01T10:00:00Z"),
              datePremiereRelance: new Date("2026-08-02T10:00:00Z"),
              dateDeuxiemeRelance: new Date("2026-08-25T10:00:00Z"),
            })
          : creerSuivi({ utilisateurId }),
    );

    // When
    await useCase.run();

    // Then
    expect(contactInfoLettresService.envoieUnEmail.mock.calls).toEqual([
      [
        [{ email: "expiration-id@test.gouv.fr" }],
        TEMPLATE_ID,
        { joursAvantExpiration: 0, dateExpiration: "01/09/2026" },
      ],
      [
        [{ email: "relance-id@test.gouv.fr" }],
        TEMPLATE_ID,
        { joursAvantExpiration: 30, dateExpiration: "01/10/2026" },
      ],
    ]);
  });
});
