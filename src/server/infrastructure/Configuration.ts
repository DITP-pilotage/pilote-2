export class Configuration {
  public readonly isUsingDatabase: Boolean;

  public readonly logLevel: string;

  public readonly keycloakClientSecret: string;

  public readonly keycloakClientId: string;

  public readonly keycloakIssuer: string;

  public readonly authUrl: string;

  public readonly logoutUrl: string;

  public readonly tokenUrl: string;

  public readonly redirectUri: string;

  public readonly basicAuthUsername: string | undefined;

  public readonly basicAuthPassword: string | undefined;

  public readonly isUsingBasicAuth: boolean;

  constructor() {
    this.isUsingDatabase = process.env.USE_DATABASE == 'true';
    this.logLevel = process.env.LOG_LEVEL || 'info';

    const basicAuth = process.env.BASIC_AUTH_CREDENTIALS;
    if (basicAuth) {
      // TODO: pas basic auth mais credentials
      this.isUsingBasicAuth = true;
      const parts = basicAuth.split(':');
      this.basicAuthUsername = parts[0];
      this.basicAuthPassword = parts[1];
    } else {
      this.isUsingBasicAuth = false;
    }

    this.keycloakClientId = process.env.KEYCLOAK_CLIENT_ID || 'N/A';
    this.keycloakClientSecret = process.env.KEYCLOAK_CLIENT_SECRET || 'N/A';
    this.keycloakIssuer = process.env.KEYCLOAK_ISSUER || 'N/A';

    this.tokenUrl = this.keycloakIssuer + '/protocol/openid-connect/token';
    this.authUrl = this.keycloakIssuer + '/protocol/openid-connect/auth'; // '/api/auth/signin/keycloak';
    this.logoutUrl = this.keycloakIssuer + '/protocol/openid-connect/logout';
    this.redirectUri = 'http://localhost:3000/api/auth/callback/keycloak';
  }
}


const config = new Configuration();
export default config;
