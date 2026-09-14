import type { NextAuthConfig } from "next-auth";
import logger from "@/server/infrastructure/Logger";
import type { CategorieLog } from "@/utils/categoriesLog";

const CATEGORIE: CategorieLog = "auth";
const SOURCE = "authjs";

type AuthJsLogContext = Record<string, unknown> & { categorie: CategorieLog };

/**
 * Auth.js range l'erreur d'origine dans `cause.err` et y ajoute des données
 * libres, qui peuvent contenir le profil OIDC ou des jetons. Le reste de la
 * cause n'est donc pas recopié : ces logs sont lisibles depuis le panel
 * administrateur, `provider` est la seule donnée dont on ait besoin pour
 * distinguer un échec ProConnect d'un échec Keycloak.
 */
const readCause = (
  cause: unknown,
): { originalError?: Error; provider?: string } => {
  if (typeof cause !== "object" || cause === null) {
    return {};
  }
  const { err, provider } = cause as { err?: unknown; provider?: unknown };
  return {
    originalError: err instanceof Error ? err : undefined,
    provider: typeof provider === "string" ? provider : undefined,
  };
};

export const buildAuthJsErrorEvent = (
  error: Error,
): { message: string; context: AuthJsLogContext } => {
  const type = (error as { type?: unknown }).type;
  const nom = typeof type === "string" ? type : error.name;
  const { originalError, provider } = readCause(error.cause);

  return {
    message: `Echec du flux d'authentification : ${nom}`,
    context: {
      categorie: CATEGORIE,
      source: SOURCE,
      errorType: nom,
      errorMessage: error.message,
      ...(provider ? { provider } : {}),
      ...(originalError ? { causeMessage: originalError.message } : {}),
      errorStack: originalError?.stack ?? error.stack,
    },
  };
};

/**
 * Sans ceci, tout échec du flux OIDC — userinfo en erreur, `state` ou `nonce`
 * invalide, échange de token refusé — reste dans le logger interne d'Auth.js,
 * c'est-à-dire la sortie standard : l'utilisateur voit un message générique sur
 * /connexion et l'administrateur n'a rien dans le panel Logs.
 */
export const loggerAuthJs: NonNullable<NextAuthConfig["logger"]> = {
  error: (error) => {
    const { message, context } = buildAuthJsErrorEvent(error);
    logger.error(context, message);
  },
  warn: (code) => {
    logger.warn(
      { categorie: CATEGORIE, source: SOURCE, code },
      `Avertissement Auth.js : ${code}`,
    );
  },
  // `debug` est volontairement laissé à Auth.js. Son `setLogger` neutralise le
  // niveau debug quand l'option `debug` est fausse, puis réinstalle sans
  // condition celui qu'on lui fournit : surcharger ce niveau le rendrait actif
  // en production. Il y passe par ailleurs des profils OIDC bruts, qui n'ont
  // rien à faire dans le panel administrateur.
};
