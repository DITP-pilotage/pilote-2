import { mock, MockProxy } from "vitest-mock-extended";
import { EmailManager } from "@/server/framework/email/EmailManager";
import { KeycloakBrevoProfilModifieSideEffects } from "@/server/profil-utilisateur/infrastructure/adapters/KeycloakBrevoProfilModifieSideEffects";
import { creerProfilUtilisateur } from "@/server/profil-utilisateur/domain/ProfilUtilisateur";

vi.mock("@keycloak/keycloak-admin-client", () => ({ default: vi.fn() }));

import KcAdminClient from "@keycloak/keycloak-admin-client";

const profil = creerProfilUtilisateur({
  id: "utilisateur-1",
  nom: "Dupont",
  prenom: "Jean",
  email: "jean.dupont@example.com",
  fonction: null,
  service: null,
  serviceAutre: null,
  perimetreMinisteriel: null,
});

describe("KeycloakBrevoProfilModifieSideEffects", () => {
  let emailManager: MockProxy<EmailManager>;

  beforeEach(() => {
    vi.mocked(KcAdminClient).mockClear();
    emailManager = mock<EmailManager>();
  });

  it.each(["", "ToBeDefined"])(
    "ne contacte pas Keycloak quand l'URL Keycloak vaut %j",
    async (keycloakUrl) => {
      // Given
      const sideEffects = new KeycloakBrevoProfilModifieSideEffects({
        emailManager,
        keycloakUrl,
        keycloakClientId: "client-id",
        keycloakClientSecret: "client-secret",
      });

      // When
      await sideEffects.executer(profil);

      // Then
      expect(KcAdminClient).not.toHaveBeenCalled();
      expect(emailManager.updateContact).toHaveBeenCalledWith(
        "jean.dupont@example.com",
        { nom: "Dupont", prenom: "Jean" },
      );
    },
  );

  it("met à jour l'utilisateur Keycloak quand l'URL Keycloak est renseignée", async () => {
    // Given
    const kcAdminClient = {
      auth: vi.fn(),
      users: {
        find: vi.fn().mockResolvedValue([{ id: "keycloak-id" }]),
        update: vi.fn(),
      },
    };
    vi.mocked(KcAdminClient).mockImplementation(function () {
      return kcAdminClient;
    });
    const sideEffects = new KeycloakBrevoProfilModifieSideEffects({
      emailManager,
      keycloakUrl: "https://keycloak.example.com",
      keycloakClientId: "client-id",
      keycloakClientSecret: "client-secret",
    });

    // When
    await sideEffects.executer(profil);

    // Then
    expect(kcAdminClient.users.update).toHaveBeenCalledWith(
      { realm: "DITP", id: "keycloak-id" },
      { firstName: "Jean", lastName: "Dupont" },
    );
  });
});
