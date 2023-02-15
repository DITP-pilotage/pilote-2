export class Configuration {
  public readonly isUsingDatabase: Boolean;

  public readonly keycloakClientSecret: string;

  public readonly keycloakClientId: string;

  public readonly keycloakIssuer: string;

  constructor(env: NodeJS.ProcessEnv) {
    this.isUsingDatabase = env.USE_DATABASE == 'true';

    this.keycloakClientId = env.KEYCLOAK_CLIENT_ID || 'N/A';
    this.keycloakClientSecret = env.KEYCLOAK_CLIENT_SECRET || 'N/A';
    this.keycloakIssuer = env.KEYCLOAK_ISSUER || 'N/A';
  }
}

export const config = new Configuration(process.env);
