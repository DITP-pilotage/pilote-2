import KcAdminClient from "@keycloak/keycloak-admin-client";
import { UtilisateurIAMRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository";
import { configuration } from "@/config";
import UtilisateurPourIAM from "@/server/gestion-utilisateur/domain/UtilisateurIAM.interface";
import logger from "@/server/infrastructure/Logger";
import { isUtilisateurDoublonError } from "@/server/utils/errors";

const KEYCLOAK_REALM = "DITP";

const DAY_IN_SECONDS = 3600 * 24;
export class UtilisateurIAMKeycloakRepository
  implements UtilisateurIAMRepository
{
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
      logger.info(`Utilisateur ${email} supprimé.`);
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
      logger.info(`Utilisateur ${email} désactivé.`);
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
      logger.info(`Utilisateur ${email} réactivé.`);
      await kcAdminClient.users.executeActionsEmail({
        realm: KEYCLOAK_REALM,
        clientId: configuration().import.clientId,
        redirectUri: configuration().baseUrl,
        id: utilisateur.id,
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

  async recupererComptesInactifsDepuisKeycloak(): Promise<
    { email: string; joursInactivite: number }[]
  > {
    const kcAdminClient = await this.loginKcAdminClient();

    const utilisateurs = await kcAdminClient.users.find({
      realm: KEYCLOAK_REALM,
    });

    const comptesInactifs: { email: string; joursInactivite: number }[] = [];
    const maintenant = Date.now();
    const SOIXANTE_JOURS_EN_MS = 60 * DAY_IN_SECONDS * 1000;

    for (const utilisateur of utilisateurs) {
      if (!utilisateur.email || !utilisateur.id) {
        continue;
      }

      const sessions = await kcAdminClient.users.listSessions({
        realm: KEYCLOAK_REALM,
        id: utilisateur.id,
      });

      const derniereConnexion =
        sessions.length > 0
          ? Math.max(...sessions.map((session) => session.lastAccess || 0))
          : utilisateur.createdTimestamp;

      if (derniereConnexion) {
        const tempsInactiviteMs = maintenant - derniereConnexion;
        const joursInactivite = Math.floor(
          tempsInactiviteMs / (DAY_IN_SECONDS * 1000),
        );

        if (tempsInactiviteMs > SOIXANTE_JOURS_EN_MS) {
          comptesInactifs.push({
            email: utilisateur.email,
            joursInactivite,
          });
        }
      }
    }

    return comptesInactifs;
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
      logger.info(`Utilisateur ${email} créé.`, utilisateurIAM.id);

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
      logger.info("Email envoyé à l'utilisateur.");
    } catch (error) {
      if (isUtilisateurDoublonError(error)) {
        logger.warn(`L'email ${email} existe déjà.`);
      } else {
        logger.error(error);
        throw error;
      }
    }
  }
}
