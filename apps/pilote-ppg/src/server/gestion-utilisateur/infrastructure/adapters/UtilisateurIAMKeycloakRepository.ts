import KcAdminClient from "@keycloak/keycloak-admin-client";
import { UtilisateurIAMRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository";
import { configuration } from "@/config";
import UtilisateurPourIAM from "@/server/gestion-utilisateur/domain/UtilisateurIAM.interface";
import logger from "@/server/infrastructure/Logger";
import { isUtilisateurDoublonError } from "@/server/utils/errors";

const KEYCLOAK_REALM = "DITP";

const DAY_IN_SECONDS = 3600 * 24;
export class UtilisateurIAMKeycloakRepository implements UtilisateurIAMRepository {
  private kcAdminClient: KcAdminClient | undefined;

  async supprime(email: string): Promise<void> {
    const kcAdminClient = await this.loginKcAdminClient();

    const [utilisateur] = await kcAdminClient.users.find({
      realm: KEYCLOAK_REALM,
      email: email,
      exact: true,
    });

    if (utilisateur?.id) {
      await kcAdminClient.users.del({
        realm: KEYCLOAK_REALM,
        id: utilisateur.id,
      });
      logger.info(
        {
          categorie: "utilisateur",
          source: "UtilisateurIAMKeycloakRepository",
          email,
        },
        "Utilisateur supprimé de Keycloak",
      );
    }
  }

  async desactive(email: string): Promise<void> {
    const kcAdminClient = await this.loginKcAdminClient();
    const [utilisateur] = await kcAdminClient.users.find({
      realm: KEYCLOAK_REALM,
      email: email,
      exact: true,
    });

    if (utilisateur?.id) {
      await kcAdminClient.users.update(
        { id: utilisateur.id },
        { enabled: false },
      );
      logger.info(
        {
          categorie: "utilisateur",
          source: "UtilisateurIAMKeycloakRepository",
          email,
        },
        "Utilisateur désactivé dans Keycloak",
      );
    }
  }

  async reactive(email: string): Promise<void> {
    const kcAdminClient = await this.loginKcAdminClient();

    const [utilisateur] = await kcAdminClient.users.find({
      realm: KEYCLOAK_REALM,
      email: email,
      exact: true,
    });

    if (utilisateur?.id) {
      await kcAdminClient.users.update(
        { id: utilisateur.id },
        { enabled: true },
      );
      logger.info(
        {
          categorie: "utilisateur",
          source: "UtilisateurIAMKeycloakRepository",
          email,
        },
        "Utilisateur réactivé dans Keycloak",
      );
      await kcAdminClient.users.executeActionsEmail({
        realm: KEYCLOAK_REALM,
        clientId: configuration().import.clientId,
        redirectUri: configuration().baseUrl,
        id: utilisateur.id,
        lifespan: 7 * DAY_IN_SECONDS,
        actions: ["UPDATE_PASSWORD"],
      });
      logger.info(
        {
          categorie: "utilisateur",
          source: "UtilisateurIAMKeycloakRepository",
          email,
        },
        "Email de réactivation envoyé",
      );
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
      baseUrl: configuration().import.keycloakUrl,
      realmName: KEYCLOAK_REALM,
      requestArgOptions: {},
    });

    await this.kcAdminClient.auth({
      grantType: "client_credentials",
      clientId: configuration().import.clientId,
      clientSecret: configuration().import.clientSecret,
    });

    return this.kcAdminClient;
  }

  private async importeUtilisateurIAM(utilisateur: UtilisateurPourIAM) {
    if (!this.kcAdminClient) {
      throw new Error("Keycloak client non initialisé");
    }

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
      logger.info(
        {
          categorie: "utilisateur",
          source: "UtilisateurIAMKeycloakRepository",
          email,
          keycloakId: utilisateurIAM.id,
        },
        "Utilisateur créé dans Keycloak",
      );

      // Note : pour que la redirectUri fonctionne, il faut ajouter le clientId et configurer les Valid redirect URIs
      // pour le client en question (du script d'import donc).
      await this.kcAdminClient.users.executeActionsEmail({
        realm: KEYCLOAK_REALM,
        clientId: configuration().import.clientId,
        redirectUri: configuration().baseUrl,
        id: utilisateurIAM.id,
        lifespan: 7 * DAY_IN_SECONDS,
        actions: ["UPDATE_PASSWORD"],
      });
      logger.info(
        {
          categorie: "utilisateur",
          source: "UtilisateurIAMKeycloakRepository",
          email,
        },
        "Email de création envoyé",
      );
    } catch (error) {
      if (isUtilisateurDoublonError(error)) {
        logger.warn(
          {
            categorie: "utilisateur",
            source: "UtilisateurIAMKeycloakRepository",
            email,
          },
          "Utilisateur déjà existant dans Keycloak",
        );
      } else {
        logger.error(
          {
            categorie: "utilisateur",
            source: "UtilisateurIAMKeycloakRepository",
            email,
          },
          `Erreur création utilisateur Keycloak : ${(error as Error).message}`,
        );
        throw error;
      }
    }
  }
}
