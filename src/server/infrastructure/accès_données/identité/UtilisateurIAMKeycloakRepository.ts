import { faker } from '@faker-js/faker/locale/fr';
import dotenv from 'dotenv';
dotenv.config();
import assert from 'node:assert/strict';
import { UtilisateurIAMRepository } from '@/server/domain/identité/UtilisateurIAMRepository';
import UtilisateurPourIAM from '@/server/domain/identité/UtilisateurPourIAM';
import logger from '@/server/infrastructure/logger';
import configuration from '@/server/infrastructure/Configuration';

const KEYCLOAK_REALM = 'DITP';

// Oups?! Voir : https://github.com/TypeStrong/ts-node/discussions/1290
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const _dynamicImport = new Function('specifier', 'return import(specifier)');

const DAY_IN_SECONDS = 3600 * 24;
export default class UtilisateurIAMKeycloakRepository implements UtilisateurIAMRepository {
  private kcAdminClient: any;

  constructor(
    private readonly keycloakUrl: string,
    private readonly clientId: string,
    private readonly clientSecret: string,
  ) {
    assert(this.keycloakUrl);
    assert(this.clientId);
    assert(this.clientSecret);
  }

  async ajouteUtilisateurs(utilisateurs: UtilisateurPourIAM[]): Promise<void> {
    await this.loginKcAdminClient();
    for (const record of utilisateurs) {
      await this.importeUtilisateurIAM(record);
    }
  }

  private async loginKcAdminClient() {
    const { default: KcAdminClient } = await _dynamicImport('@keycloak/keycloak-admin-client');
    this.kcAdminClient = new KcAdminClient({
      baseUrl: this.keycloakUrl,
      realmName: KEYCLOAK_REALM,
      requestArgOptions: {},
    });

    await this.kcAdminClient.auth({
      grantType: 'client_credentials',
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    });

    return this.kcAdminClient;
  }

  private générerMotDePasse(): string {
    return faker.internet.password(15, false, /\w/, '');
  }

  private async importeUtilisateurIAM(utilisateur: UtilisateurPourIAM) {
    const email = utilisateur.email;
    const motDePasse = this.générerMotDePasse();
    const passwordCred = { temporary: true, type: 'password', value: motDePasse };
    try {
      const { id: idUtilisateur } = await this.kcAdminClient.users.create({
        realm: KEYCLOAK_REALM,
        username: email,
        email,
        firstName: utilisateur.prénom,
        lastName: utilisateur.nom,
        enabled: true,
        emailVerified: true,
        requiredActions: ['UPDATE_PASSWORD'],
        credentials: [passwordCred],
      });
      logger.info(`Utilisateur ${email} créé, mot de passe temporaire: '${motDePasse}'.`);

      // Note : pour que la redirectUri fonctionne, il faut ajouter le clientId et configurer les Valid redirect URIs
      // pour le client en question (du script d'import donc).
      await this.kcAdminClient.users.executeActionsEmail({
        realm: KEYCLOAK_REALM,
        clientId: this.clientId,
        redirectUri: configuration.webappBaseUrl,
        id: idUtilisateur,
        lifespan: 4 * DAY_IN_SECONDS,
        actions: ['UPDATE_PASSWORD'],
      });
      logger.info('Email envoyé à l\'utilisateur.');

    } catch (error: any) {
      if (error.message == 'Request failed with status code 409') {
        logger.warn(`L'email ${email} existe déjà.`);
      } else {
        logger.error(error);
        throw error;
      }
    }
  }
}
