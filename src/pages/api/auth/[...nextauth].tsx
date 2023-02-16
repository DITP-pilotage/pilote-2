import NextAuth from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { JWT } from 'next-auth/jwt';
import config from '@/server/infrastructure/Configuration';

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
      const params = new URLSearchParams({
        id_token_hint: idToken as string,
      });

      const response = await fetch(config.logoutUrl, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
        body: params,
      });

      const refreshedTokens = await response.json();

      if (!response.ok) {
        throw refreshedTokens;
      }
      
      // The response body should contain a confirmation that the user has been logged out
      console.log('Completed post-logout handshake', status);
    } catch (error: any) {
      console.error('Unable to perform post-logout handshake', error);
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
        throw refreshedTokens;
      }
      let currentDate = new Date();
      let res = {
        // to review
        ...token,
        expires_at: currentDate.setSeconds(currentDate.getSeconds() + refreshedTokens.expires_in - 15),
        refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
      };
      
      console.log('*****************');
      console.log(refreshedTokens);
      console.log('*****************');
      console.log(res);
      return res;
    } catch (error) {
      console.log(error);
      return null;
    }
  } else {
    throw new Error('Error on this line');
  }
}

const credentialsProvider = CredentialsProvider({
  // The name to display on the sign in form (e.g. 'Sign in with...')
  name: 'Credentials',
  // The credentials is used to generate a suitable form on the sign in page.
  // You can specify whatever fields you are expecting to be submitted.
  // e.g. domain, username, password, 2FA token, etc.
  // You can pass any HTML attribute to the <input> tag through the object.
  credentials: {
    username: { label: 'Username', type: 'text', placeholder: 'jsmith' },
    password: {  label: 'Password', type: 'password' },
  },

  async authorize(credentials, _req) {
    // returns either a object representing a user or value
    // false/null if the credentials are invalid.
    // e.g. return { id: 1, name: 'J Smith', email: 'jsmith@example.com' }
    if (credentials?.username == config.basicAuthUsername && credentials?.password == config.basicAuthPassword) {
      return { id: '1', name: credentials?.username, email: 'ditp@example.com' };
    }

    return null;
  },
});

const providers = [];
if (config.isUsingBasicAuth) {
  providers.push(credentialsProvider);
} else {
  providers.push(keycloak);
}

export const authOptions = {
  // Configure one or more authentication providers  
  providers,
  callbacks: {
    async jwt({ token, account, user, profile, isNewUser }: any) {
      // Persist the OAuth access_token to the token right after signin

      let currentDate = new Date();

      // account is defined when recieved token from server (ie Keycloak)
      // Initial log in
      if (account && user) {
        console.log('------> JWT fnt');
        console.log('> Token=', token);
        console.log('> user=', user);
        console.log('> account=', account);
        console.log('> profile=', profile);
        console.log('> isNewUser=', isNewUser);
        console.log('date=', currentDate);
        console.log(' JWT fnt <--------------<<<');

        token.accessToken = account.access_token;
        token.expires_at = currentDate.setSeconds(currentDate.getSeconds() + 20);  // account.expires_at;
        token.provider = account.provider;
        token.refreshToken = account.refresh_token;
        token.idToken = account.id_token;
      }

      if (token.provider == 'credentials' || currentDate < token.expires_at) {
        return token;
      } else {
        console.error('Token HAS EXPIRED');
        return refreshAccessToken(token);
      }


    },
    async session({ session, token }: any) {
      // Send properties to the client, like an access_token from a provider.
      session.accessToken = token.accessToken;
      session.tokenExp = token.expires_at;
      return session;
    },
  },
  events: {
    signOut: ({ token }: any) => { doFinalSignoutHandshake(token); },
  },
};

export default NextAuth(authOptions);
