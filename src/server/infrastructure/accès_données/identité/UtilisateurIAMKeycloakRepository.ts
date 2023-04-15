import assert from 'node:assert/strict';
import { UtilisateurIAMRepository } from '@/server/domain/identité/UtilisateurIAMRepository';
import UtilisateurPourIAM from '@/server/domain/identité/UtilisateurPourIAM';
import logger from '@/server/infrastructure/logger';

const KEYCLOAK_REALM = 'DITP';

// Oups?! Voir : https://github.com/TypeStrong/ts-node/discussions/1290
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const dynamicImport = new Function('specifier', 'return import(specifier)');

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

  async loginKcAdminClient() {
    const { default: KcAdminClient } = await dynamicImport('@keycloak/keycloak-admin-client');
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

  async importeUtilisateurIAM(record: UtilisateurPourIAM) {
    const email = record.email;
    const passwordCred = { temporary: true, type: 'password', value: record.motDePasse };
    try {
      await this.kcAdminClient.users.create({
        realm: KEYCLOAK_REALM,
        username: email,
        email,
        firstName: record.prénom,
        lastName: record.nom,
        enabled: true,
        emailVerified: true,
        requiredActions: ['UPDATE_PASSWORD'],
        credentials: [passwordCred],
      });
      logger.info(`Utilisateur ${email} créé.`);
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
