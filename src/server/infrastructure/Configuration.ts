import process from 'node:process';

const THIRTY_DAYS_IN_SECONDS_STR = '2592000';

export class Configuration {
  public readonly logLevel: string;

  public readonly keycloakClientSecret: string;

  public readonly keycloakClientId: string;

  public readonly keycloakIssuer: string;

  public readonly nextAuthSecret: string;

  public readonly nextAuthDebug: boolean;

  public readonly nextAuthSessionMaxAge: number;

  public readonly authUrl: string;

  public readonly logoutUrl: string;

  public readonly tokenUrl: string;

  public readonly webappBaseUrl: string;

  public readonly devPassword: string | undefined;

  public readonly isUsingDevCredentials: boolean;

  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';

    this.devPassword = process.env.DEV_PASSWORD;
    this.isUsingDevCredentials = Boolean(this.devPassword);

    this.keycloakClientId = process.env.KEYCLOAK_CLIENT_ID || 'N/A';
    this.keycloakClientSecret = process.env.KEYCLOAK_CLIENT_SECRET || 'N/A';
    this.keycloakIssuer = process.env.KEYCLOAK_ISSUER || 'N/A';

    this.nextAuthSecret = process.env.NEXTAUTH_SECRET || 'next_auth_secret';
    this.nextAuthDebug = 'true' == process.env.NEXTAUTH_DEBUG;
    this.nextAuthSessionMaxAge = Number.parseInt(process.env.NEXTAUTH_SESSION_MAX_AGE_IN_SECONDS
        ?? THIRTY_DAYS_IN_SECONDS_STR);

    this.tokenUrl = this.keycloakIssuer + '/protocol/openid-connect/token';
    this.authUrl = this.keycloakIssuer + '/protocol/openid-connect/auth'; // '/api/auth/signin/keycloak';
    this.logoutUrl = this.keycloakIssuer + '/protocol/openid-connect/logout';

    this.webappBaseUrl = process.env.WEBAPP_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  }
}

const config = new Configuration();
export default config;
