export class Configuration {
  public readonly isUsingDatabase: Boolean;

  public readonly keycloakClientSecret: string;

  public readonly keycloakClientId: string;

  public readonly keycloakIssuer: string;

  public readonly authUrl: string;

  public readonly logoutUrl: string;

  public readonly tokenUrl: string;

  constructor(env: NodeJS.ProcessEnv) {
    this.isUsingDatabase = env.USE_DATABASE == 'true';

    this.keycloakClientId = env.KEYCLOAK_CLIENT_ID || 'N/A';
    this.keycloakClientSecret = env.KEYCLOAK_CLIENT_SECRET || 'N/A';
    this.keycloakIssuer = env.KEYCLOAK_ISSUER || 'N/A';

    this.tokenUrl = this.keycloakIssuer + '/protocol/openid-connect/token';
    this.authUrl = this.keycloakIssuer + '/protocol/openid-connect/auth';
    this.logoutUrl = this.keycloakIssuer + '/protocol/openid-connect/logout';
  }
}

export const config = new Configuration(process.env);
