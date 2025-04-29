import { NextRequest, NextResponse } from 'next/server';

// Fonction de génération de nonce compatible avec Edge Runtime
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

export function middleware(_request: NextRequest): NextResponse {
  const nonce = generateNonce();  
  const response = NextResponse.next();

  // Ajouter le nonce aux en-têtes de réponse
  response.headers.set('X-Nonce', nonce);

  // Détecter l'environnement de développement
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Ajout du CSP pour empecher les attaques XSS côté webapp
  const cspValue = isDevelopment
    ? "default-src 'self' data:; frame-src https://video.finances.gouv.fr/ https://app.livestorm.co/; connect-src https://api.validata.etalab.studio/ https://stats.beta.gouv.fr/ 'self' data: ws:; script-src 'self' https://stats.beta.gouv.fr/ 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests; media-src 'self' https://video.finances.gouv.fr/;"
    : `default-src 'self' data:; frame-src https://video.finances.gouv.fr/ https://app.livestorm.co/; connect-src https://api.validata.etalab.studio/ https://stats.beta.gouv.fr/ 'self' data:; script-src 'self' https://stats.beta.gouv.fr/ 'nonce-${nonce}' 'strict-dynamic'; style-src 'self' 'nonce-${nonce}' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; block-all-mixed-content; upgrade-insecure-requests; media-src 'self' https://video.finances.gouv.fr/;`;

  // Définir l'en-tête CSP
  response.headers.set('Content-Security-Policy', cspValue);

  return response;
}

export const config = {
  matcher: '/:path*',
}; 
