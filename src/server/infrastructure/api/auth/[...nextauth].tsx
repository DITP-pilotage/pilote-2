import NextAuth, { Account, AuthOptions, getServerSession, User } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { JWT } from 'next-auth/jwt';
import { GetServerSidePropsContext } from 'next';
import config from '@/server/infrastructure/Configuration';
import logger from '@/server/infrastructure/logger';
import { dependencies } from '@/server/infrastructure/Dependencies';

export const keycloak = KeycloakProvider({
  clientId: config.keycloakClientId,
  clientSecret: config.keycloakClientSecret,
  issuer: config.keycloakIssuer,
});

async function _assertResponseOk(response: Response, errorMessage: string): Promise<void> {
  if (response && !response.ok) {
    try {
      const json = await response.json();
      logger.error({ response, json }, errorMessage);
    } catch {
      const text = await response.text();
      logger.error({ response, text }, errorMessage);
    }
    throw new Error(errorMessage);
  }
}

/**
 * this performs the final handshake for the keycloak
 * provider, the way it's written could also potentially
 * perform the action for other providers as well
 */
async function doFinalSignoutHandshake(token: PiloteJWTPayload) {
  logger.info({ userId: token.user.id }, 'Logout');
  logger.debug({ token });
  const { provider, idToken } = token;
  if (provider == keycloak.id) {
    try {
      // Add the id_token_hint to the query string
      const params = new URLSearchParams({ id_token_hint: idToken as string });

      logger.debug({ logoutUrl: config.logoutUrl, params });

      const response = await fetch(config.logoutUrl, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
        body: params,
      });
      logger.debug({
        response,
        ok: response?.ok,
        statusText: response?.statusText,
        body: response?.body,
      }, 'Logout response');
      await _assertResponseOk(response, 'Failed to logout');

      logger.info('Completed post-logout handshake');
    } catch (error: any) {
      logger.error(error, 'Unable to perform post-logout handshake');
    }
  }
}

// https://openid.net/specs/openid-connect-core-1_0.html#TokenResponse
type OpenIdTokenResponse = {
  access_token: string,
  token_type: string,
  refresh_token: string,
  expires_in: number,
  id_token: string,
};

type PiloteJWTPayload = {
  accessToken: string,
  accessTokenExpires: number,
  refreshToken: string,
  idToken: string,
  provider: string,
  user: User,
  error?: string
};

// https://next-auth.js.org/tutorials/refresh-token-rotation
/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token: PiloteJWTPayload): Promise<PiloteJWTPayload> {
  logger.info({ userId: token.user.id }, 'Refreshing access token...');
  const { provider, refreshToken } = token as JWT & { refreshToken: string };

  if (provider == keycloak.id) {
    try {
      const fields = {
        client_id: config.keycloakClientId,
        client_secret: config.keycloakClientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      };
      const sendData = new URLSearchParams(fields);

      const response = await fetch(config.tokenUrl, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
        body: sendData,
      });
      await _assertResponseOk(response, 'Failed to refresh token');

      const openIdTokenResponse = (await response.json()) as OpenIdTokenResponse;
      logger.debug({ openIdTokenResponse }, 'openid-connect/token response');

      const result = {
        ...token,
        accessToken: openIdTokenResponse.access_token,
        accessTokenExpires: Date.now() + openIdTokenResponse.expires_in * 1000,
        refreshToken: openIdTokenResponse.refresh_token ?? token.refreshToken, // Fall back to old refresh token
      };

      logger.debug({ result }, 'Refresh token result');
      return result;
    } catch (error) {
      const errorMessage = 'Bad in refresh_token';
      logger.error({ error }, errorMessage);
      logger.debug({ token }, errorMessage);
      return {
        ...token,
        error: 'RefreshAccessTokenError',
      };
    }
  } else {
    const errorMessage = 'Provider: Not Supported';
    logger.error({ provider }, errorMessage);
    logger.debug({ token }, errorMessage);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

const credentialsProvider = CredentialsProvider({
  // The name to display on the sign in form (e.g. 'Sign in with...')
  name: 'credentials',
  // The credentials is used to generate a suitable form on the sign in page.
  // You can specify whatever fields you are expecting to be submitted.
  // e.g. domain, username, password, 2FA token, etc.
  // You can pass any HTML attribute to the <input> tag through the object.
  credentials: {
    username: { label: 'Email', type: 'text', placeholder: 'alicerichard@example.com' },
    password: { label: 'Mot de Passe', type: 'password' },
  },

  async authorize(credentials, _req): Promise<User | null> {
    const password = credentials?.password;
    const username = credentials?.username;
    if (!username || password != config.devPassword) {
      return null;

    }
    const utilisateurRepository = dependencies.getUtilisateurRepository();
    const utilisateur = await utilisateurRepository.récupérer(username);
    
    if (!utilisateur) {
      return null;
    }

    return {
      id: utilisateur.id,
      name: utilisateur.email,
      email: utilisateur.email,
    };
  },
});

function _isLogingIn(account: Account, user: User): Boolean {
  return Boolean(account && user);
}

function _hasExpired(token: PiloteJWTPayload): Boolean {
  if (token.provider == 'credentials') {
    return false;
  }
  const now = Date.now();
  return now >= token.accessTokenExpires;
}

export const authOptions: AuthOptions = {
  providers: config.isUsingDevCredentials
    ? [credentialsProvider]
    : [keycloak],
  debug: config.nextAuthDebug,
  session: {
    maxAge: config.nextAuthSessionMaxAge,
  },
  callbacks: {
    async jwt({ token, account, user, profile, isNewUser }: any & { token: JWT | PiloteJWTPayload, account: Account }): Promise<PiloteJWTPayload> {
      if (_isLogingIn(account, user)) {
        logger.info({ userId: user.id }, 'NextAuth JWT callback called from login');
        logger.debug({ token, user, account, profile, isNewUser });

        return {
          accessToken: account.access_token,
          accessTokenExpires: (account.expires_at - 10) * 1000,
          refreshToken: account.refresh_token,
          idToken: account.id_token,
          provider: account.provider,
          user,
        };
      }

      if (!_hasExpired(token)) {
        return token;
      }

      logger.info('NextAuth JWT callback triggers refreshing (Access Token has expired)');
      return refreshAccessToken(token);
    },

    async session({ session, token }: any & { token: PiloteJWTPayload }): Promise<any> {
      logger.debug({ userId: token.user.id }, 'Session callback, adding habilitations to session');

      const utilisateurRepository = dependencies.getUtilisateurRepository();
      const utilisateur = await utilisateurRepository.récupérer(token.user.email);

      // Send properties to the client
      session.user = token.user;
      session.accessToken = token.accessToken;
      session.error = token.error;
      session.profil = utilisateur?.profil;
      session.habilitations = utilisateur!.habilitations;

      return session;
    },
  },
  events: {
    signOut: ({ token }: any) => {
      return doFinalSignoutHandshake(token);
    },
  },
};

export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext['req'];
  res: GetServerSidePropsContext['res'];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};

const handleNextAuth = NextAuth(authOptions);
export default handleNextAuth;
