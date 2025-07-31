import KcAdminClient from "@keycloak/keycloak-admin-client";
import { UtilisateurIAMRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository";
import { configuration } from "@/config";
import UtilisateurPourIAM from "@/server/gestion-utilisateur/domain/UtilisateurIAM.interface";
import logger from "@/server/infrastructure/Logger";

const KEYCLOAK_REALM = "DITP";

const DAY_IN_SECONDS = 3600 * 24;
export class UtilisateurIAMKeycloakRepository
  implements UtilisateurIAMRepository
{
  private kcAdminClient: any;

  async supprime(email: string): Promise<void> {
    await this.loginKcAdminClient();

    const utilisateur = await this.kcAdminClient.users.findOne({
      realm: KEYCLOAK_REALM,
      email: email,
    });

    if (utilisateur.length > 0) {
      await this.kcAdminClient.users.del({
        realm: KEYCLOAK_REALM,
        id: utilisateur[0].id,
      });
      logger.info(`Utilisateur ${email} supprimé.`);
    }
  }

  async desactive(email: string): Promise<void> {
    await this.loginKcAdminClient();

    const utilisateur = await this.kcAdminClient.users.findOne({
      realm: KEYCLOAK_REALM,
      email: email,
    });

    if (utilisateur.length > 0) {
      await this.kcAdminClient.users.update(
        { id: utilisateur[0].id },
        { enabled: false },
      );
      logger.info(`Utilisateur ${email} désactivé.`);
    }
  }

  async reactive(email: string): Promise<void> {
    await this.loginKcAdminClient();

    const utilisateur = await this.kcAdminClient.users.findOne({
      realm: KEYCLOAK_REALM,
      email: email,
    });

    if (utilisateur.length > 0) {
      await this.kcAdminClient.users.update(
        { id: utilisateur[0].id },
        { enabled: true },
      );
      logger.info(`Utilisateur ${email} réactivé.`);
      await this.kcAdminClient.users.executeActionsEmail({
        realm: KEYCLOAK_REALM,
        clientId: configuration.import.clientId,
        redirectUri: configuration.baseUrl,
        id: utilisateur[0].id,
        lifespan: 7 * DAY_IN_SECONDS,
        actions: ["UPDATE_PASSWORD"],
      });
      logger.info("Email envoyé à l'utilisateur.");
    }
  }

  async ajouteUtilisateurs(utilisateurs: UtilisateurPourIAM[]): Promise<void> {
    await this.loginKcAdminClient();
    for (const record of utilisateurs) {
      await this.importeUtilisateurIAM(record);
    }
  }

  private async loginKcAdminClient() {
    this.kcAdminClient = new KcAdminClient({
      baseUrl: configuration.import.keycloakUrl,
      realmName: KEYCLOAK_REALM,
      requestArgOptions: {},
    });

    await this.kcAdminClient.auth({
      grantType: "client_credentials",
      clientId: configuration.import.clientId,
      clientSecret: configuration.import.clientSecret,
    });

    return this.kcAdminClient;
  }

  private async importeUtilisateurIAM(utilisateur: UtilisateurPourIAM) {
    const email = utilisateur.email;
    try {
      const utilisateurIAM = await this.kcAdminClient.users.create({
        realm: KEYCLOAK_REALM,
        username: email,
        email,
        firstName: utilisateur.prénom,
        lastName: utilisateur.nom,
        enabled: true,
        emailVerified: true,
        requiredActions: ["UPDATE_PASSWORD"],
      });
      logger.info(`Utilisateur ${email} créé.`, utilisateurIAM.id);

      // Note : pour que la redirectUri fonctionne, il faut ajouter le clientId et configurer les Valid redirect URIs
      // pour le client en question (du script d'import donc).
      await this.kcAdminClient.users.executeActionsEmail({
        realm: KEYCLOAK_REALM,
        clientId: configuration.import.clientId,
        redirectUri: configuration.baseUrl,
        id: utilisateurIAM.id,
        lifespan: 7 * DAY_IN_SECONDS,
        actions: ["UPDATE_PASSWORD"],
      });
      logger.info("Email envoyé à l'utilisateur.");
    } catch (error: any) {
      if (
        error.message == "Request failed with status code 409" ||
        error?.responseData?.errorMessage === "User exists with same username"
      ) {
        logger.warn(`L'email ${email} existe déjà.`);
      } else {
        logger.error(error);
        throw error;
      }
    }
  }
}
