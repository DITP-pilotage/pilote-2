import NextAuth from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { JWT } from 'next-auth/jwt';
import config from '@/server/infrastructure/Configuration';
import logger from '@/server/infrastructure/logger';

export const keycloak = KeycloakProvider({
  clientId: config.keycloakClientId,
  clientSecret: config.keycloakClientSecret,
  issuer: config.keycloakIssuer,
});

/**
 * this performs the final handshake for the keycloak
 * provider, the way it's written could also potentially
 * perform the action for other providers as well
 */
async function doFinalSignoutHandshake(token: JWT) {
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
      logger.debug({ response, ok: response?.ok, statusText: response?.statusText, body: response?.body }, 'Logout response');

      const refreshedTokens = await response.json();
      if (response && !response.ok) {
        logger.debug({ response, refreshedTokens }, 'Failed to logout');
        // noinspection ExceptionCaughtLocallyJS
        throw refreshedTokens;
      }

      // The response body should contain a confirmation that the user has been logged out
      logger.info('Completed post-logout handshake');
    } catch (error: any) {
      logger.error(error, 'Unable to perform post-logout handshake');
    }
  }
}

// https://next-auth.js.org/tutorials/refresh-token-rotation
/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
/**
 * @param  {JWT} token
 */
async function refreshAccessToken(token: JWT) {
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

      const refreshedTokens = await response.json();

      if (!response.ok) {
        // noinspection ExceptionCaughtLocallyJS
        throw refreshedTokens;
      }

      let res = {
        // to review
        ...token,
        accessToken: refreshedTokens.access_token,
        accessTokenExpires: Date.now() + refreshedTokens.expires_at * 1000,
        refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
      };

      logger.debug('*****************');
      logger.debug(refreshedTokens);
      logger.debug('*****************');
      logger.debug(res);
      return res;
    } catch (error) {
      logger.error(error, 'Bad in refresh_token');
      return {
        ...token,
        error: 'RefreshAccessTokenError',
      };
    }
  } else {
    logger.info("Provider: Not Supported '" + provider + "'");
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
    username: { label: 'Utilisateur', type: 'text', placeholder: 'alicerichard' },
    password: { label: 'Mot de Passe', type: 'password' },
  },

  async authorize(credentials, _req) {
    const username = credentials?.username;
    const password = credentials?.password;
    if (username != config.devUsername || password != config.devPassword) {
      return null;
    }
    return { id: '1', name: username, email: `${username}@example.com` };
  },
});

const providers = [];
if (config.isUsingDevCredentials) {
  providers.push(credentialsProvider);
} else {
  providers.push(keycloak);
}

// noinspection JSUnusedGlobalSymbols
export const authOptions = {
  providers,
  callbacks: {
    async jwt({ token, account, user, profile, isNewUser }: any) {
      // Persist the OAuth access_token to the token right after signin

      const currentDate = Date.now();

      // account is defined when recieved token from server (ie Keycloak)
      // Initial log in
      if (account && user) {
        logger.debug({ token, user, account, profile, isNewUser, currentDate }, '------> JWT fnt');

        return {
          accessToken: account.access_token,
          accessTokenExpires: currentDate + (account.expires_at - 10) * 1000,
          //accessTokenExpires: Date.now() + 5 * 1000,
          refreshToken: account.refresh_token,
          idToken: account.id_token,
          provider: account.provider,
          user,
        };
      }
      //logger.warn('******')
      //logger.debug({ token, user, account, profile }, 'Token')

      if (token.provider == 'credentials' || currentDate < token.accessTokenExpires) {
        return token;
      }

      logger.debug('Token has expired, refreshing.');
      return refreshAccessToken(token);
    },

    async session({ session, token }: any) {
      // Send properties to the client, like an access_token from a provider.
      session.user = token.user;
      session.accessToken = token.accessToken;
      session.error = token.error;

      return session;
    },
  },
  events: {
    signOut: ({ token }: any) => { return doFinalSignoutHandshake(token); },
  },
};

export default NextAuth(authOptions);
