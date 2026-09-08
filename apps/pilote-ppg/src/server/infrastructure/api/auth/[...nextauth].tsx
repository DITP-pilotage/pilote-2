import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import type { User } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import axios from "axios";
import logger from "@/server/infrastructure/Logger";
import { configuration } from "@/config";
import {
  proconnect,
  PROVIDER_PROCONNECT,
} from "@/server/infrastructure/api/auth/proconnect";
import { autoriserConnexionProConnect } from "@/server/authentification/domain/autoriserConnexionProConnect";
import { sessionExpiree } from "@/server/infrastructure/api/auth/expirationSession";
import { CHEMIN_CONNEXION } from "@/server/authentification/domain/cheminsAuthentification";

export const keycloak = KeycloakProvider({
  clientId: configuration().keycloak.clientId,
  clientSecret: configuration().keycloak.clientSecret,
  issuer: configuration().keycloak.publicIssuer, // URL publique pour la validation
  authorization: { url: configuration().keycloak.authUrl },
  token: { url: configuration().keycloak.tokenUrl },
});

function _assertResponseOk(
  response: { status: number; data: unknown },
  errorMessage: string,
): void {
  if (response.status < 200 || response.status >= 300) {
    logger.warn({ status: response.status, data: response.data }, errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * this performs the final handshake for the keycloak
 * provider, the way it's written could also potentially
 * perform the action for other providers as well
 */
async function doFinalSignoutHandshake(token: PiloteJWTPayload) {
  logger.info(
    {
      categorie: "auth",
      source: "nextauth.doFinalSignoutHandshake",
      userId: token.user.id,
    },
    "Logout",
  );
  const { provider, idToken } = token;
  if (provider == keycloak.id) {
    try {
      // Add the id_token_hint to the query string
      const params = new URLSearchParams({ id_token_hint: idToken as string });

      logger.debug(
        {
          categorie: "auth",
          source: "nextauth.doFinalSignoutHandshake",
          logoutUrl: configuration().keycloak.logoutUrl,
        },
        "Logout URL",
      );

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

      logger.info(
        { categorie: "auth", source: "nextauth.doFinalSignoutHandshake" },
        "Completed post-logout handshake",
      );
    } catch (error: unknown) {
      logger.error(
        {
          categorie: "auth",
          source: "nextauth.doFinalSignoutHandshake",
          errorMessage: (error as Error).message,
        },
        "Unable to perform post-logout handshake",
      );
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
  refreshToken?: string;
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
  logger.info(
    {
      categorie: "auth",
      source: "nextauth.refreshAccessToken",
      userId: token.user.id,
    },
    "Refreshing access token...",
  );
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
      logger.debug(
        {
          categorie: "auth",
          source: "nextauth.refreshAccessToken",
          openIdTokenResponse,
        },
        "openid-connect/token response",
      );

      const result = {
        ...token,
        accessToken: openIdTokenResponse.access_token,
        accessTokenExpires: Date.now() + openIdTokenResponse.expires_in * 1000,
        refreshToken: openIdTokenResponse.refresh_token ?? token.refreshToken, // Fall back to old refresh token
        idToken: openIdTokenResponse.id_token ?? token.idToken,
      };

      logger.info(
        { categorie: "auth", source: "nextauth.refreshAccessToken" },
        "Refresh token réussi",
      );
      return result;
    } catch (error) {
      const errorMessage = "Bad in refresh_token";
      logger.warn(
        {
          categorie: "auth",
          source: "nextauth.refreshAccessToken",
          error: (error as Error).message,
        },
        errorMessage,
      );
      return {
        ...token,
        error: "RefreshAccessTokenError",
      };
    }
  } else {
    const errorMessage = "Provider: Not Supported";
    logger.error(
      { categorie: "auth", source: "nextauth.refreshAccessToken", provider },
      errorMessage,
    );
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

const refreshEnCours = new Map<string, Promise<PiloteJWTPayload>>();

async function refreshAccessTokenAvecDeduplication(
  token: PiloteJWTPayload,
): Promise<PiloteJWTPayload> {
  const refreshToken = token.refreshToken;
  if (!refreshToken) {
    // Sans refresh token il n'y a rien à rafraîchir. Cas non atteint pour
    // ProConnect, dont sessionExpiree renvoie toujours false.
    logger.warn(
      { categorie: "auth", source: "nextauth.refreshAccessToken" },
      "Aucun refresh token dans la session",
    );
    return { ...token, error: "RefreshAccessTokenError" };
  }

  const promesseExistante = refreshEnCours.get(refreshToken);
  if (promesseExistante) {
    logger.info(
      { userId: token.user.id },
      "Refresh already in progress, waiting for result...",
    );
    return promesseExistante;
  }

  const promesse = refreshAccessToken(token).finally(() => {
    refreshEnCours.delete(refreshToken);
  });

  refreshEnCours.set(refreshToken, promesse);
  return promesse;
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
    const { getContainer } = await import("@/server/dependances");
    const utilisateurRepository = getContainer("legacy").resolve(
      "utilisateurRepository",
    );
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

const toPiloteJWTPayload = (token: JWT) => token as PiloteJWTPayload;

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    // Volontairement pas de `signIn` ici : le rediriger vers /connexion ferait
    // boucler le mode DEV_PASSWORD, où signIn("keycloak") ne correspond à
    // aucun provider enregistré et doit retomber sur l'écran next-auth par
    // défaut qui porte le formulaire credentials. Les visiteurs non
    // authentifiés arrivent sur /connexion via proxy.ts.
    error: CHEMIN_CONNEXION,
  },
  providers: !!configuration().devPassword
    ? [credentialsProvider]
    : [keycloak, proconnect],
  debug: configuration().nextAuth.debug,
  session: {
    maxAge: configuration().nextAuth.sessionMaxAge,
  },
  events: {
    signOut: (message) => {
      if ("token" in message && message.token) {
        return doFinalSignoutHandshake(toPiloteJWTPayload(message.token));
      }
    },
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== PROVIDER_PROCONNECT) {
        return true;
      }

      const { getContainer } = await import("@/server/dependances");
      const statutCompteQuery =
        getContainer("gestionUtilisateur").cradle.statutCompteQuery;

      const motif = await autoriserConnexionProConnect({
        email: profile?.email,
        recupererStatutCompte: (email) =>
          statutCompteQuery.recuperer({ email }),
      });

      if (motif) {
        // L'email n'est pas journalisé : une identité refusée n'est pas un
        // utilisateur de PILOTE.
        logger.warn(
          {
            categorie: "auth",
            source: "nextauth.signIn",
            provider: account.provider,
            motif,
          },
          "Connexion ProConnect refusée",
        );
        return `${CHEMIN_CONNEXION}?motif=${motif}`;
      }

      logger.info(
        {
          categorie: "auth",
          source: "nextauth.signIn",
          provider: account.provider,
        },
        "Connexion ProConnect autorisée",
      );
      return true;
    },

    async jwt({ token, account, user }) {
      if (account != null && user != null) {
        logger.info(
          {
            categorie: "auth",
            source: "nextauth.jwt",
            userId: user.id,
            email: user.email,
            provider: account.provider,
          },
          "Connexion utilisateur",
        );

        if (user.email) {
          const { getContainer } = await import("@/server/dependances");
          const mettreAJourLaDerniereConnexionUseCase =
            getContainer("gestionUtilisateur").cradle
              .mettreAJourLaDerniereConnexionUseCase;
          await mettreAJourLaDerniereConnexionUseCase.execute({
            email: user.email,
            date: new Date(),
            provider: account.provider,
          });
        }

        return {
          accessToken: account.access_token,
          accessTokenExpires:
            account.expires_at == null
              ? null
              : (account.expires_at - 10) * 1000,
          // ProConnect plafonne le refresh token à 2 h sans rotation : on ne
          // l'utilise pas, donc on ne le conserve pas dans la session.
          refreshToken:
            account.provider === PROVIDER_PROCONNECT
              ? undefined
              : account.refresh_token,
          idToken: account.id_token,
          provider: account.provider,
          user,
        };
      }

      const piloteToken = toPiloteJWTPayload(token);
      if (
        !sessionExpiree({
          provider: piloteToken.provider,
          accessTokenExpires: piloteToken.accessTokenExpires,
          maintenant: Date.now(),
        })
      ) {
        return token;
      }

      logger.info(
        { categorie: "auth", source: "nextauth.jwt" },
        "NextAuth JWT callback triggers refreshing (Access Token has expired)",
      );
      const refreshedToken = await refreshAccessTokenAvecDeduplication(
        toPiloteJWTPayload(token),
      );
      if (refreshedToken.error === "RefreshAccessTokenError") {
        logger.warn(
          { categorie: "auth", source: "nextauth.jwt" },
          "Failed to refresh access token, invalidating session",
        );
        return null;
      }
      return refreshedToken;
    },

    async session({ session, token }) {
      const piloteToken = toPiloteJWTPayload(token);
      const { getContainer } = await import("@/server/dependances");
      const utilisateurRepository = getContainer("legacy").resolve(
        "utilisateurRepository",
      );
      const utilisateur = await utilisateurRepository.récupérer(
        piloteToken.user.email,
      );

      const profilRepository =
        getContainer("legacy").resolve("profilRepository");
      const profil = await profilRepository.récupérer(utilisateur!.profil);

      logger.debug(
        { userId: utilisateur?.id },
        "Session callback, adding habilitations to session",
      );

      session.user = {
        ...session.user,
        // TODO(CHAN 20/01/2026) : supprimer les anciennes infos de la session après déploiement
        ...piloteToken.user,
        id: utilisateur!.id,
        email: utilisateur!.email,
      };
      session.accessToken = piloteToken.accessToken;
      session.profil = utilisateur?.profil;
      // @ts-expect-error il y a une erreur ici car on est pas sur le même type d'habilitation, il faut continuer à migrer ca vers le domaine
      session.habilitations = utilisateur!.habilitations;
      session.applicationsAccessibles = utilisateur!.applicationsAccessibles;
      session.profilAAccèsAuxChantiersBrouillons =
        profil?.chantiers.lecture.brouillons ?? false;

      return session;
    },
  },
};

export const { auth, handlers } = NextAuth(authConfig);
