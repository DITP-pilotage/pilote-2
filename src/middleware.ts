import { getToken } from 'next-auth/jwt';
import { withAuth } from 'next-auth/middleware';
import { NextFetchEvent, NextRequest, NextResponse } from 'next/server';

import logger from './server/infrastructure/Logger';
const pages = { signIn: '/' };

function generateNonce(): string {
  // Utiliser crypto.getRandomValues de manière compatible avec tous les environnements
  let nonce = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  
  // Créer un tableau d'octets aléatoires compatible avec tous les environnements
  const array = new Uint8Array(16);
  
  if (typeof crypto !== 'undefined') {
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
      client_id: process.env.KEYCLOAK_CLIENT_ID || '',
      client_secret: process.env.KEYCLOAK_CLIENT_SECRET || '',
      token,
    });

    const response = await fetch(`${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token/introspect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { active: boolean };
    return data.active === true;

  } catch (error) {
    logger.error('Error validating Keycloak token:', error);
    return false;
  }
}

export const middleware = async (request: NextRequest, event: NextFetchEvent)=> {
  const nonce = generateNonce();

  const response = NextResponse.next();

  const isDev = process.env.NODE_ENV === 'development';

  response.headers.set('x-nonce', nonce);

  // Ajout du CSP pour empecher les attaques XSS côté serveur
  if (isDev || request.nextUrl.pathname.startsWith('/centreaide')) {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' ws: wss:; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'",
    );
  } else {
    response.headers.set(
      'Content-Security-Policy',
      `default-src 'self'; 
       script-src 'self' 'nonce-${nonce}' https://plausible.4p-analyse.fr https://app.livestorm.co/; 
       style-src 'self' 'unsafe-inline';
       img-src 'self' data: blob:; 
       font-src 'self' data:; 
       connect-src 'self'; 
       frame-src 'self'; 
       object-src 'none'; 
       base-uri 'self'; 
       form-action 'self'`.replace(/\n\s+/g, ' '),
    );
  }

  if (!request.nextUrl.pathname.startsWith('/api/open-api')) {
    const authMiddleware = withAuth(
      async function middleware2(requestAuth) {
        const cookie = requestAuth.cookies.get('csrf');

        const token = await getToken({ req: requestAuth });
        
        const isValidToken = await validateKeycloakToken(token?.accessToken as string);

        if (!process.env.DEV_PASSWORD && !isValidToken) {
          // Créer une redirection vers la racine
          const redirectResponse = NextResponse.redirect(new URL('/', requestAuth.url), { status: 303 });
          
          // Supprimer les cookies d'authentification
          redirectResponse.cookies.set('next-auth.session-token', '', { 
            expires: new Date(0),
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
          });
          // Supprimer les cookies d'authentification
          redirectResponse.cookies.set('__Secure-next-auth.session-token.0', '', { 
            expires: new Date(0),
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
          });
          // Supprimer les cookies d'authentification
          redirectResponse.cookies.set('__Secure-next-auth.session-token.1', '', { 
            expires: new Date(0),
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
          });
          
          redirectResponse.cookies.set('next-auth.callback-url', '', {
            expires: new Date(0),
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
          });
          
          redirectResponse.cookies.set('next-auth.csrf-token', '', {
            expires: new Date(0),
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
          });
          
          // Supprimer également le cookie csrf personnalisé si utilisé
          redirectResponse.cookies.set('csrf', '', {
            expires: new Date(0),
            path: '/',
            sameSite: 'lax',
          });
          
          return redirectResponse;
        }

        if (requestAuth.nextauth.token && (cookie === undefined || cookie !== requestAuth.nextauth.token.jti)) {
          const jti = String(requestAuth.nextauth.token.jti);
          response.cookies.set('csrf', jti, { sameSite: 'lax' });
        }

        return response;
      },
      { pages },
    );

    // @ts-expect-error
    return authMiddleware(request, event);
  }
  
  return response;
};

export const config = {
  // s'applique à toutes les urls sauf / - ^/js/ - _next/static - _next/image - favicon.ico
  matcher: ['/((?!js/|_next/static|_next/image|favicon.ico).+)'],
};
