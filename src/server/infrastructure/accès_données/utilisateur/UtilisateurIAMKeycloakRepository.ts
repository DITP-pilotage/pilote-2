import KcAdminClient from "@keycloak/keycloak-admin-client";

import { z } from "zod";
import { UtilisateurIAMRepository } from "@/server/domain/utilisateur/UtilisateurIAMRepository";
import logger from "@/server/infrastructure/Logger";
import UtilisateurPourIAM from "@/server/domain/utilisateur/UtilisateurIAM.interface";
import { configuration } from "@/config";

const KEYCLOAK_REALM = "DITP";

const DAY_IN_SECONDS = 3600 * 24;

function isUtilisateurDoublonError(error: unknown) {
  return z
    .object({
      message: z.literal("Request failed with status code 409"),
      responseData: z.object({
        errorMessage: z.literal("User exists with same username"),
      }),
    })
    .safeParse(error).success;
}

export default class UtilisateurIAMKeycloakRepository
  implements UtilisateurIAMRepository
{
  private kcAdminClient: KcAdminClient | undefined;

  constructor(
    private readonly keycloakUrl: string,
    private readonly clientId: string,
    private readonly clientSecret: string,
  ) {}

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

  async ajouteUtilisateurs(utilisateurs: UtilisateurPourIAM[]): Promise<void> {
    await this.loginKcAdminClient();
    for (const record of utilisateurs) {
      await this.importeUtilisateurIAM(record);
    }
  }

  private async loginKcAdminClient() {
    this.kcAdminClient = new KcAdminClient({
      baseUrl: this.keycloakUrl,
      realmName: KEYCLOAK_REALM,
      requestArgOptions: {},
    });

    await this.kcAdminClient.auth({
      grantType: "client_credentials",
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    });

    return this.kcAdminClient;
  }

  private async importeUtilisateurIAM(utilisateur: UtilisateurPourIAM) {
    if (!this.kcAdminClient) {
      throw new Error("kcAdminClient non initialisé");
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
        clientId: this.clientId,
        redirectUri: configuration().nextAuth.url,
        id: utilisateurIAM.id,
        lifespan: 7 * DAY_IN_SECONDS,
        actions: ["UPDATE_PASSWORD"],
      });
      logger.info("Email envoyé à l'utilisateur.");
    } catch (error: unknown) {
      if (isUtilisateurDoublonError(error)) {
        logger.warn(`L'email ${email} existe déjà.`);
      } else {
        logger.error(error);
        throw error;
      }
    }
  }
}
