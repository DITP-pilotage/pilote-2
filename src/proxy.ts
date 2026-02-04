import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

import logger from "./server/infrastructure/Logger";

function generateNonce(): string {
  // Utiliser crypto.getRandomValues de manière compatible avec tous les environnements
  let nonce = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  // Créer un tableau d'octets aléatoires compatible avec tous les environnements
  const array = new Uint8Array(16);

  if (typeof crypto !== "undefined") {
    // Environnement de navigateur ou Node.js récent
    crypto.getRandomValues(array);
  } else {
    // Fallback pour les environnements sans crypto.getRandomValues
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }

  // Convertir les bytes en chaîne base64
  for (const byte of array) {
    nonce += possible.charAt(byte % possible.length);
  }

  return nonce;
}

async function validateKeycloakToken(token: string): Promise<boolean> {
  try {
    const params = new URLSearchParams({
      client_id: process.env.KEYCLOAK_CLIENT_ID || "",
      client_secret: process.env.KEYCLOAK_CLIENT_SECRET || "",
      token,
    });

    const response = await fetch(
      `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token/introspect`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      },
    );

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { active: boolean };
    return data.active === true;
  } catch (error) {
    logger.error("Error validating Keycloak token:", error);
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const nonce = generateNonce();

  const response = NextResponse.next();

  const isDev = process.env.NODE_ENV === "development";

  response.headers.set("x-nonce", nonce);

  // Ajout du CSP pour empecher les attaques XSS côté serveur
  if (isDev || request.nextUrl.pathname.startsWith("/centreaide") || request.nextUrl.pathname.startsWith("/centre-aide-pilote-2")) {
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src https://api.validata.etalab.studio/ https://stats.beta.gouv.fr/ 'self' ws: wss:; frame-src 'self' https://video.finances.gouv.fr/; object-src 'none'; base-uri 'self'; form-action 'self'; media-src 'self' https://video.finances.gouv.fr/",
    );
  } else {
    response.headers.set(
      "Content-Security-Policy",
      `default-src 'self';
       script-src 'self' 'nonce-${nonce}' https://plausible.4p-analyse.fr https://app.livestorm.co/ https://stats.beta.gouv.fr/;
       style-src 'self' 'unsafe-inline';
       img-src 'self' data: blob:;
       font-src 'self' data:;
       connect-src https://api.validata.etalab.studio/ https://stats.beta.gouv.fr/ 'self';
       frame-src 'self' https://video.finances.gouv.fr/;
       object-src 'none';
       base-uri 'self';
       media-src 'self' https://video.finances.gouv.fr/;
       form-action 'self'`.replace(/\n\s+/g, " "),
    );
  }

  const pathname = request.nextUrl.pathname;
  const routesTrpcPubliques = [
    "/api/trpc/gestionContenu.recupererMessageInformation",
    "/api/trpc/gestionContenu.recupererVariableContenu",
  ];

  const estRoutePublique =
    pathname.startsWith("/api/open-api") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/centre-aide-pilote-2") ||
    pathname.startsWith("/centreaide") ||
    pathname.startsWith("/api/admin/cron") ||
    routesTrpcPubliques.some((route) => pathname.startsWith(route));

  if (!estRoutePublique) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const redirectResponse = NextResponse.redirect(
        new URL("/", request.url),
        { status: 303 },
      );
      return redirectResponse;
    }

    if (!process.env.DEV_PASSWORD) {
      const isValidToken = await validateKeycloakToken(
        token?.accessToken as string,
      );

      if (!isValidToken) {
        // Créer une redirection vers la racine
        const redirectResponse = NextResponse.redirect(
          new URL("/", request.url),
          { status: 303 },
        );

        // Supprimer les cookies d'authentification (next-auth v4 legacy)
        redirectResponse.cookies.set("next-auth.session-token", "", {
          expires: new Date(0),
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });
        redirectResponse.cookies.set("next-auth.session-token.0", "", {
          expires: new Date(0),
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });
        redirectResponse.cookies.set("next-auth.session-token.1", "", {
          expires: new Date(0),
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });
        redirectResponse.cookies.set("__Secure-next-auth.session-token.0", "", {
          expires: new Date(0),
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });
        redirectResponse.cookies.set("__Secure-next-auth.session-token.1", "", {
          expires: new Date(0),
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });

        // Supprimer les cookies d'authentification (next-auth v5 / authjs)
        redirectResponse.cookies.set("authjs.session-token", "", {
          expires: new Date(0),
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });
        redirectResponse.cookies.set("__Secure-authjs.session-token", "", {
          expires: new Date(0),
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });
        redirectResponse.cookies.set("authjs.callback-url", "", {
          expires: new Date(0),
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });
        redirectResponse.cookies.set("authjs.csrf-token", "", {
          expires: new Date(0),
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });

        redirectResponse.cookies.set("next-auth.callback-url", "", {
          expires: new Date(0),
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });

        redirectResponse.cookies.set("next-auth.csrf-token", "", {
          expires: new Date(0),
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });

        // Supprimer également le cookie csrf personnalisé si utilisé
        redirectResponse.cookies.set("csrf", "", {
          expires: new Date(0),
          path: "/",
          sameSite: "lax",
        });

        return redirectResponse;
      }
    }

    const cookie = request.cookies.get("csrf")?.value;

    // CSRF handling
    if (token.jti && (cookie === undefined || cookie !== token.jti)) {
      const jti = String(token.jti);
      response.cookies.set("csrf", jti, {
        sameSite: "lax",
        httpOnly: false,
        path: "/",
      });
    }
  }

  return response;
}

export const config = {
  // s'applique à toutes les urls sauf / - ^/js/ - _next/static - _next/image - favicon.ico
  matcher: ["/((?!js/|_next/static|_next/image|favicon.ico|favicon/).+)"],
};
