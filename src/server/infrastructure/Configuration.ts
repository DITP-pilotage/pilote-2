export class Configuration {
  public readonly logLevel: string;

  public readonly keycloakClientSecret: string;

  public readonly keycloakClientId: string;

  public readonly keycloakIssuer: string;

  public readonly authUrl: string;

  public readonly logoutUrl: string;

  public readonly tokenUrl: string;

  public readonly webappBaseUrl: string;

  public readonly redirectUri: string;

  public readonly devPassword: string | undefined;

  public readonly isUsingDevCredentials: boolean;

  public readonly devSessionMaxAge: number = 30 * 24 * 60 * 60; // 30 days

  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';

    this.devPassword = process.env.DEV_PASSWORD;
    this.isUsingDevCredentials = Boolean(this.devPassword);
    if (process.env.DEV_SESSION_MAX_AGE_IN_SECONDS) {
      this.devSessionMaxAge = Number.parseInt(process.env.DEV_SESSION_MAX_AGE_IN_SECONDS);
    }

    this.keycloakClientId = process.env.KEYCLOAK_CLIENT_ID || 'N/A';
    this.keycloakClientSecret = process.env.KEYCLOAK_CLIENT_SECRET || 'N/A';
    this.keycloakIssuer = process.env.KEYCLOAK_ISSUER || 'N/A';

    this.tokenUrl = this.keycloakIssuer + '/protocol/openid-connect/token';
    this.authUrl = this.keycloakIssuer + '/protocol/openid-connect/auth'; // '/api/auth/signin/keycloak';
    this.logoutUrl = this.keycloakIssuer + '/protocol/openid-connect/logout';

    this.webappBaseUrl = process.env.WEBAPP_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    this.redirectUri = this.webappBaseUrl + '/api/auth/callback/keycloak';
  }
}

const config = new Configuration();
export default config;
