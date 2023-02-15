import NextAuth from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import type { JWT } from 'next-auth/jwt';

// TODO: on a besoin d'une couche config qui collecte les variables d'env qui traite le cas undefined en amont
export const keycloak = KeycloakProvider({
  clientId: process.env.KEYCLOAK_CLIENT_ID,
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
  issuer: process.env.KEYCLOAK_ISSUER,
});
 
// this performs the final handshake for the keycloak
// provider, the way it's written could also potentially
// perform the action for other providers as well


/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
/**
 * @param  {JWT} token
 */

async function doFinalSignoutHandshake(token: JWT) {
  const { provider, id_token } = token;
  if (provider == keycloak.id) {
    try {
      // Add the id_token_hint to the query string
      const params = new URLSearchParams({
        id_token_hint: id_token,
      });

      const url =
        keycloak.options.issuer + '/protocol/openid-connect/logout';
      const response = await fetch(url, {
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
      console.log('Completed post-logout handshake', status, statusText);
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
  const { provider, id_token } = token;



  if (provider == keycloak.id) {
    try {
      const fields = {
        client_id: keycloak.options.clientId,
        client_secret: keycloak.options.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: token.refresh_token,
      };
      const send_data = new URLSearchParams(fields);

      const url =
        keycloak.options.issuer + '/protocol/openid-connect/token';
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
        body: send_data,
      });

      const refreshedTokens = await response.json();

      if (!response.ok) {
        throw refreshedTokens;
      }
      let current_date = new Date();
      let res = {
        // to review
        ...token,
        expires_at: current_date.setSeconds(current_date.getSeconds() + refreshedTokens.expires_in - 15),
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
  } else
    throw Error;
}

export const authOptions = {
  // Configure one or more authentication providers  
  providers: [
    keycloak,
  ],
  callbacks: {
    async jwt({ token, account, user, profile, isNewUser }) {
      // Persist the OAuth access_token to the token right after signin

      let current_date = new Date();

      // account is defined when recieved token from server (ie Keycloak)
      // Initial log in
      if (account && user) {
        console.log('------> JWT fnt');
        console.log('> Token=', token);
        console.log('> account=', account);
        console.log('> profile=', profile);
        console.log('> isNewUser=', isNewUser);
        console.log('date=', current_date);
        console.log(' JWT fnt <--------------<<<');

        token.accessToken = account.access_token;
        token.expires_at = current_date.setSeconds(current_date.getSeconds() + 20);  // account.expires_at;
        token.provider = account.provider;
        token.refresh_token = account.refresh_token;
        token.id_token = account.id_token;
      }

      if (current_date < token.expires_at) {
        return token;
      } else {
        console.error('Token HAS EXPIRED');
        return refreshAccessToken(token);
      }


    },
    async session({ session, token, user }) {
      // Send properties to the client, like an access_token from a provider.
      session.accessToken = token.accessToken;
      session.tokenExp = token.expires_at;
      return session;
    },
  },
  events: {
    signOut: ({ session, token }) => { doFinalSignoutHandshake(token); },
  },
};
export default NextAuth(authOptions);
