import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import type { User } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import axios from "axios";
import logger from "@/server/infrastructure/Logger";
import { configuration } from "@/config";

export const keycloak = KeycloakProvider({
  clientId: configuration().keycloak.clientId,
  clientSecret: configuration().keycloak.clientSecret,
  issuer: configuration().keycloak.issuer,
});

function _assertResponseOk(
  response: { status: number; data: unknown },
  errorMessage: string,
): void {
  if (response.status < 200 || response.status >= 300) {
    logger.error(
      { status: response.status, data: response.data },
      errorMessage,
    );
    throw new Error(errorMessage);
  }
}

/**
 * this performs the final handshake for the keycloak
 * provider, the way it's written could also potentially
 * perform the action for other providers as well
 */
async function doFinalSignoutHandshake(token: PiloteJWTPayload) {
  logger.info({ userId: token.user.id }, "Logout");
  logger.debug({ token });
  const { provider, idToken } = token;
  if (provider == keycloak.id) {
    try {
      // Add the id_token_hint to the query string
      const params = new URLSearchParams({ id_token_hint: idToken as string });

      logger.debug({ logoutUrl: configuration().keycloak.logoutUrl, params });

      const response = await axios.post(
        configuration().keycloak.logoutUrl,
        params.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          validateStatus: () => true,
        },
      );
      logger.debug(
        {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
        },
        "Logout response",
      );
      _assertResponseOk(response, "Failed to logout");

      logger.info("Completed post-logout handshake");
    } catch (error: unknown) {
      logger.error(error, "Unable to perform post-logout handshake");
    }
  }
}

// https://openid.net/specs/openid-connect-core-1_0.html#TokenResponse
type OpenIdTokenResponse = {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  id_token: string;
};

type PiloteJWTPayload = {
  accessToken: string;
  accessTokenExpires: number;
  refreshToken: string;
  idToken: string;
  provider: string;
  user: User & { email: string };
  error?: string;
};

// https://next-auth.js.org/tutorials/refresh-token-rotation
/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(
  token: PiloteJWTPayload,
): Promise<PiloteJWTPayload> {
  logger.info({ userId: token.user.id }, "Refreshing access token...");
  const { provider, refreshToken } = token as JWT & { refreshToken: string };

  if (provider == keycloak.id) {
    try {
      const fields = {
        client_id: configuration().keycloak.clientId,
        client_secret: configuration().keycloak.clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      };
      const sendData = new URLSearchParams(fields);

      const response = await axios.post(
        configuration().keycloak.tokenUrl,
        sendData.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          validateStatus: () => true,
        },
      );
      _assertResponseOk(response, "Failed to refresh token");

      const openIdTokenResponse = response.data as OpenIdTokenResponse;
      logger.debug({ openIdTokenResponse }, "openid-connect/token response");

      const result = {
        ...token,
        accessToken: openIdTokenResponse.access_token,
        accessTokenExpires: Date.now() + openIdTokenResponse.expires_in * 1000,
        refreshToken: openIdTokenResponse.refresh_token ?? token.refreshToken, // Fall back to old refresh token
      };

      logger.debug({ result }, "Refresh token result");
      return result;
    } catch (error) {
      const errorMessage = "Bad in refresh_token";
      logger.error({ error }, errorMessage);
      logger.debug({ token }, errorMessage);
      return {
        ...token,
        error: "RefreshAccessTokenError",
      };
    }
  } else {
    const errorMessage = "Provider: Not Supported";
    logger.error({ provider }, errorMessage);
    logger.debug({ token }, errorMessage);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

const credentialsProvider = CredentialsProvider({
  // The name to display on the sign in form (e.g. 'Sign in with...')
  name: "credentials",
  // The credentials is used to generate a suitable form on the sign in page.
  // You can specify whatever fields you are expecting to be submitted.
  // e.g. domain, username, password, 2FA token, etc.
  // You can pass any HTML attribute to the <input> tag through the object.
  credentials: {
    username: {
      label: "Identifiant",
      type: "text",
      placeholder: "alicerichard@example.com",
    },
    password: { label: "Mot de passe", type: "password" },
  },

  async authorize(credentials: Record<string, unknown>): Promise<User | null> {
    const password = credentials?.password as string | undefined;
    const username = credentials?.username as string | undefined;
    if (!username || password != configuration().devPassword) {
      return null;
    }
    const { dependencies } = await import(
      "@/server/infrastructure/Dependencies"
    );
    const utilisateurRepository = dependencies.getUtilisateurRepository();
    const utilisateur = await utilisateurRepository.récupérer(username);

    if (!utilisateur) {
      return null;
    }

    return {
      id: utilisateur.id,
      name: `${utilisateur.prénom} ${utilisateur.nom}`,
      email: utilisateur.email,
    };
  },
});

function _hasExpired(token: PiloteJWTPayload): Boolean {
  if (token.provider == "credentials") {
    return false;
  }
  const now = Date.now();
  return now >= token.accessTokenExpires;
}

const toPiloteJWTPayload = (token: JWT) => token as PiloteJWTPayload;

export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: !!configuration().devPassword ? [credentialsProvider] : [keycloak],
  debug: configuration().nextAuth.debug,
  session: {
    maxAge: configuration().nextAuth.sessionMaxAge,
  },
  events: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signOut: (message: { session: any } | { token: JWT | null }) => {
      if ("token" in message && message.token) {
        return doFinalSignoutHandshake(toPiloteJWTPayload(message.token));
      }
    },
  },
  callbacks: {
    async jwt({
      token,
      account,
      user,
      profile,
    }: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      token: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      account?: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user?: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profile?: any;
    }) {
      if (account != null && user != null) {
        logger.info(
          { userId: user.id },
          "NextAuth JWT callback called from login",
        );
        logger.debug({ token, user, account, profile });

        if (user.email) {
          const { getContainer } = await import("@/server/dependances");
          const utilisateurRepository =
            getContainer("gestionUtilisateur").cradle.utilisateurRepository;
          await utilisateurRepository.mettreAJourDateDerniereConnexion(
            user.email,
            new Date(),
          );
        }

        return {
          accessToken: account.access_token,
          accessTokenExpires:
            account.expires_at == null
              ? null
              : (account.expires_at - 10) * 1000,
          refreshToken: account.refresh_token,
          idToken: account.id_token,
          provider: account.provider,
          user,
        };
      }

      if (!_hasExpired(toPiloteJWTPayload(token))) {
        return token;
      }

      logger.info(
        "NextAuth JWT callback triggers refreshing (Access Token has expired)",
      );
      return refreshAccessToken(toPiloteJWTPayload(token));
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any; token: any }) {
      const piloteToken = toPiloteJWTPayload(token);
      const { dependencies } = await import(
        "@/server/infrastructure/Dependencies"
      );
      const utilisateurRepository = dependencies.getUtilisateurRepository();
      const utilisateur = await utilisateurRepository.récupérer(
        piloteToken.user.email,
      );

      const profilRepository = dependencies.getProfilRepository();
      const profil = await profilRepository.récupérer(utilisateur!.profil);

      logger.debug(
        { userId: utilisateur?.id },
        "Session callback, adding habilitations to session",
      );

      // Send properties to the client
      session.user = {
        // TODO(CHAN 20/01/2026) : supprimer les anciennes infos de la session après déploiement
        ...piloteToken.user,
        id: utilisateur!.id,
        email: utilisateur!.email,
      };
      session.accessToken = piloteToken.accessToken;
      session.profil = utilisateur?.profil;
      session.habilitations = utilisateur!.habilitations;
      session.applicationsAccessibles = utilisateur!.applicationsAccessibles;
      session.profilAAccèsAuxChantiersBrouillons =
        profil?.chantiers.lecture.brouillons ?? false;

      return session;
    },
  },
};

export const { auth, handlers } = NextAuth(authConfig);
