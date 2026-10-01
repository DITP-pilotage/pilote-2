import handler from "@/pages/api/admin/cron/expiration-password-admin";
import {
  setupRequest,
  setupResponse,
} from "@/server/infrastructure/test/apiTestHelpers";
import { configuration } from "@/config";
import { getContainer } from "@/server/dependances";
import { envoieMessageTchap } from "@/server/utils/notification-tchap";

vi.mock("@/config", () => ({
  configuration: vi.fn(),
}));

vi.mock("@/server/dependances", () => ({
  getContainer: vi.fn(),
}));

vi.mock("@/server/utils/notification-tchap", () => ({
  envoieMessageTchap: vi.fn(),
}));

vi.mock("@/server/infrastructure/Logger", () => ({
  __esModule: true,
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockConfiguration = vi.mocked(configuration);
const mockGetContainer = vi.mocked(getContainer);
const mockEnvoieMessageTchap = vi.mocked(envoieMessageTchap);

function configurer(overrides: { scalingoEnvironment?: string } = {}) {
  mockConfiguration.mockReturnValue({
    logLevel: "warn",
    scalingoEnvironment: overrides.scalingoEnvironment ?? "PROD",
    cron: { authSecret: "secret-cron" },
    tchap: {
      baseUrl: "https://tchap.test",
      roomIdDesactivationComptes: "!salon:tchap.test",
      accessToken: "token",
    },
  } as unknown as ReturnType<typeof configuration>);
}

function brancherLesUseCases(resultats: {
  synchronisation?: object;
  creation?: object;
  execution?: object;
  flipActif?: boolean;
}) {
  const synchroniser = vi.fn().mockResolvedValue(
    resultats.synchronisation ?? {
      suivisInitialises: 0,
      changementsDetectes: 0,
      comptesNonSoumis: 0,
      erreurs: 0,
    },
  );
  const creer = vi.fn().mockResolvedValue(
    resultats.creation ?? {
      actionsPremiereRelance: 0,
      actionsDeuxiemeRelance: 0,
      actionsExpiration: 0,
    },
  );
  const executer = vi.fn().mockResolvedValue(
    resultats.execution ?? {
      premieresRelancesEnvoyees: 0,
      deuxiemesRelancesEnvoyees: 0,
      expirationsForcees: 0,
      erreurs: 0,
    },
  );
  const useCases: Record<string, { run: ReturnType<typeof vi.fn> }> = {
    synchroniserLesSuivisPasswordAdminUseCase: { run: synchroniser },
    creerLesActionsPasswordUseCase: { run: creer },
    executerLesActionsPasswordUseCase: { run: executer },
  };
  const recupererFeatureFlips = vi.fn().mockResolvedValue({
    NEXT_PUBLIC_FF_EXPIRATION_PASSWORD_ADMIN: resultats.flipActif ?? true,
  });
  const conteneurs: Record<string, { resolve: (nom: string) => unknown }> = {
    gestionUtilisateur: { resolve: (nom: string) => useCases[nom] },
    legacy: { resolve: () => ({ run: recupererFeatureFlips }) },
  };
  mockGetContainer.mockImplementation(
    ((nom: string) => conteneurs[nom]) as unknown as typeof getContainer,
  );

  return { synchroniser, creer, executer };
}

const requeteCron = () =>
  setupRequest({
    method: "POST",
    headers: { authorization: "Bearer secret-cron" },
  });

describe("cron/expiration-password-admin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configurer();
  });

  it("répond skipped hors PROD", async () => {
    // Given
    configurer({ scalingoEnvironment: "STAGING" });
    const { synchroniser } = brancherLesUseCases({});
    const response = setupResponse();

    // When
    await handler(requeteCron(), response);

    // Then
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.status().json).toHaveBeenCalledWith({
      skipped: true,
      reason: "Environment is not PROD",
    });
    expect(synchroniser).not.toHaveBeenCalled();
  });

  it("répond skipped quand le feature flip (registre admin) est désactivé", async () => {
    // Given
    const { synchroniser } = brancherLesUseCases({ flipActif: false });
    const response = setupResponse();

    // When
    await handler(requeteCron(), response);

    // Then
    expect(response.status().json).toHaveBeenCalledWith({
      skipped: true,
      reason:
        "Feature flag NEXT_PUBLIC_FF_EXPIRATION_PASSWORD_ADMIN is disabled",
    });
    expect(synchroniser).not.toHaveBeenCalled();
  });

  it("enchaîne les trois phases et renvoie leurs résultats sans message Tchap", async () => {
    // Given
    const { synchroniser, creer, executer } = brancherLesUseCases({
      execution: {
        premieresRelancesEnvoyees: 2,
        deuxiemesRelancesEnvoyees: 1,
        expirationsForcees: 0,
        erreurs: 0,
      },
    });
    const response = setupResponse();

    // When
    await handler(requeteCron(), response);

    // Then
    expect(synchroniser).toHaveBeenCalledTimes(1);
    expect(creer).toHaveBeenCalledTimes(1);
    expect(executer).toHaveBeenCalledTimes(1);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.status().json).toHaveBeenCalledWith({
      resultatSynchronisation: {
        suivisInitialises: 0,
        changementsDetectes: 0,
        comptesNonSoumis: 0,
        erreurs: 0,
      },
      resultatCreation: {
        actionsPremiereRelance: 0,
        actionsDeuxiemeRelance: 0,
        actionsExpiration: 0,
      },
      resultatExecution: {
        premieresRelancesEnvoyees: 2,
        deuxiemesRelancesEnvoyees: 1,
        expirationsForcees: 0,
        erreurs: 0,
      },
    });
    expect(mockEnvoieMessageTchap).not.toHaveBeenCalled();
  });

  it("envoie un message Tchap quand des erreurs sont remontées", async () => {
    // Given
    brancherLesUseCases({
      synchronisation: {
        suivisInitialises: 0,
        changementsDetectes: 0,
        comptesNonSoumis: 0,
        erreurs: 1,
      },
      execution: {
        premieresRelancesEnvoyees: 0,
        deuxiemesRelancesEnvoyees: 0,
        expirationsForcees: 0,
        erreurs: 2,
      },
    });
    const response = setupResponse();

    // When
    await handler(requeteCron(), response);

    // Then
    expect(response.status).toHaveBeenCalledWith(200);
    expect(mockEnvoieMessageTchap).toHaveBeenCalledWith(
      expect.stringContaining("3 erreur(s)"),
      "https://tchap.test",
      "!salon:tchap.test",
      "token",
    );
  });

  it("répond 500 et prévient sur Tchap quand une phase lève une exception", async () => {
    // Given
    const { synchroniser } = brancherLesUseCases({});
    synchroniser.mockRejectedValue(new Error("Keycloak injoignable"));
    const response = setupResponse();

    // When
    await handler(requeteCron(), response);

    // Then
    expect(response.status).toHaveBeenCalledWith(500);
    expect(mockEnvoieMessageTchap).toHaveBeenCalledWith(
      expect.stringContaining("Erreur lors de l'expiration des mots de passe"),
      "https://tchap.test",
      "!salon:tchap.test",
      "token",
    );
  });
});
