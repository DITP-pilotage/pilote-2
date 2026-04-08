import KcAdminClient from "@keycloak/keycloak-admin-client";
import { ProfilModifieSideEffects } from "@/server/profil-utilisateur/domain/ports/ProfilModifieSideEffects";
import { ProfilUtilisateur } from "@/server/profil-utilisateur/domain/ProfilUtilisateur";
import { EmailManager } from "@/server/infrastructure/email-manager/EmailManager";
import logger from "@/server/infrastructure/Logger";

const KEYCLOAK_REALM = "DITP";

interface Dependencies {
  emailManager: EmailManager;
  keycloakUrl: string;
  keycloakClientId: string;
  keycloakClientSecret: string;
}

export class KeycloakBrevoProfilModifieSideEffects implements ProfilModifieSideEffects {
  private readonly emailManager: EmailManager;

  private readonly keycloakUrl: string;

  private readonly keycloakClientId: string;

  private readonly keycloakClientSecret: string;

  constructor(deps: Dependencies) {
    this.emailManager = deps.emailManager;
    this.keycloakUrl = deps.keycloakUrl;
    this.keycloakClientId = deps.keycloakClientId;
    this.keycloakClientSecret = deps.keycloakClientSecret;
  }

  async executer(profil: ProfilUtilisateur): Promise<void> {
    await Promise.all([
      this.updateBrevoContact(profil).catch((error) => {
        logger.error(
          {
            categorie: "utilisateur",
            source: "KeycloakBrevoProfilModifieSideEffects",
            email: profil.email,
          },
          `Erreur mise à jour contact Brevo : ${(error as Error).message}`,
        );
      }),
      this.updateKeycloakUser(profil).catch((error) => {
        logger.error(
          {
            categorie: "utilisateur",
            source: "KeycloakBrevoProfilModifieSideEffects",
            email: profil.email,
          },
          `Erreur mise à jour utilisateur Keycloak : ${(error as Error).message}`,
        );
      }),
    ]);
  }

  private async updateBrevoContact(profil: ProfilUtilisateur): Promise<void> {
    await this.emailManager.updateContact(profil.email, {
      nom: profil.nom,
      prenom: profil.prenom,
    });
  }

  private async updateKeycloakUser(profil: ProfilUtilisateur): Promise<void> {
    const kcAdminClient = new KcAdminClient({
      baseUrl: this.keycloakUrl,
      realmName: KEYCLOAK_REALM,
      requestArgOptions: {},
    });

    await kcAdminClient.auth({
      grantType: "client_credentials",
      clientId: this.keycloakClientId,
      clientSecret: this.keycloakClientSecret,
    });

    const [utilisateur] = await kcAdminClient.users.find({
      realm: KEYCLOAK_REALM,
      email: profil.email,
      exact: true,
    });

    if (utilisateur?.id) {
      await kcAdminClient.users.update(
        {
          realm: KEYCLOAK_REALM,
          id: utilisateur.id,
        },
        {
          firstName: profil.prenom,
          lastName: profil.nom,
        },
      );
    }
  }
}
