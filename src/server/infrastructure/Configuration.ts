export class Configuration {
  public readonly logLevel: string;

  public readonly keycloakClientSecret: string;

  public readonly keycloakClientId: string;

  public readonly keycloakIssuer: string;

  public readonly authUrl: string;

  public readonly logoutUrl: string;

  public readonly tokenUrl: string;

  public readonly redirectUri: string;

  public readonly devUsername: string | undefined;

  public readonly devPassword: string | undefined;

  public readonly devEmail: string | null;

  public readonly isUsingDevCredentials: boolean;

  public readonly devSessionMaxAge: number = 30 * 24 * 60 * 60; // 30 days

  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';

    const devCredentials = process.env.DEV_CREDENTIALS;
    if (devCredentials) {
      this.isUsingDevCredentials = true;
      const parts = devCredentials.split(':');
      this.devUsername = parts[0];
      this.devPassword = parts[1];
      this.devEmail = process.env.DEV_EMAIL;
    } else {
      this.isUsingDevCredentials = false;
    }
    if (process.env.DEV_SESSION_MAX_AGE_IN_SECONDS) {
      this.devSessionMaxAge = Number.parseInt(process.env.DEV_SESSION_MAX_AGE_IN_SECONDS);
    }

    this.keycloakClientId = process.env.KEYCLOAK_CLIENT_ID || 'N/A';
    this.keycloakClientSecret = process.env.KEYCLOAK_CLIENT_SECRET || 'N/A';
    this.keycloakIssuer = process.env.KEYCLOAK_ISSUER || 'N/A';

    this.tokenUrl = this.keycloakIssuer + '/protocol/openid-connect/token';
    this.authUrl = this.keycloakIssuer + '/protocol/openid-connect/auth'; // '/api/auth/signin/keycloak';
    this.logoutUrl = this.keycloakIssuer + '/protocol/openid-connect/logout';
    this.redirectUri = process.env.NEXTAUTH_URL + '/api/auth/callback/keycloak';
  }
}

const config = new Configuration();
export default config;
