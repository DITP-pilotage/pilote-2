import { withAuth } from 'next-auth/middleware';
import { NextFetchEvent, NextRequest, NextResponse } from 'next/server';

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

export const middleware = async (request: NextRequest, event: NextFetchEvent)=> {
  const nonce = generateNonce();

  const response = NextResponse.next();

  const isDev = process.env.NODE_ENV === 'development';

  response.headers.set('x-nonce', nonce);

  // Ajout du CSP pour empecher les attaques XSS côté serveur
  if (isDev) {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' ws: wss:; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'",
    );
  } else {
    response.headers.set(
      'Content-Security-Policy',
      `default-src 'self'; 
       script-src 'self' 'nonce-${nonce}'; 
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
      function middleware2(requestAuth) {
        const cookie = requestAuth.cookies.get('csrf');

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
