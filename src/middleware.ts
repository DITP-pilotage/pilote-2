import { withAuth } from 'next-auth/middleware';
import { NextFetchEvent, NextRequest, NextResponse } from 'next/server';
import { TokenAPIJWTService } from '@/server/authentification/infrastructure/adapters/services/TokenAPIJWTService';

const pages = { signIn: '/' };

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!request.nextUrl.pathname.startsWith('/api/open-api')) {
    const authMiddleware = withAuth(
      function middleware2(requestAuth) {
        const response = NextResponse.next();

        const cookie = requestAuth.cookies.get('csrf');

        if (requestAuth.nextauth.token && (cookie === undefined || cookie !== requestAuth.nextauth.token.jti)) {
          const jti = String(requestAuth.nextauth.token.jti);
          response.cookies.set('csrf', jti, { sameSite: 'lax' });

          return response;
        }
      },
      { pages },
    );

    // @ts-expect-error
    return authMiddleware(request, event);
  } else {
    if (!request.headers.get('Authorization')) {
      return Response.json(
        { success: false, message: 'Il vous manque le header Authorization avec le token API' },
        { status: 401 },
      );
    }

    try {
      const token = request.headers.get('Authorization')!;
      if (!/^Bearer \S+$/.test(token)) {
        throw new Error('token null');
      }
      await new TokenAPIJWTService({ secret: process.env.TOKEN_API_SECRET! }).decoderTokenAPI(token.split(' ')[1]);
    } catch {
      return Response.json(
        { success: false, message: "Le token n'a pas pu être décodé, assuré vous qu'il soit dans le format 'Bearer <<TokenAPI>>'" },
        { status: 401 },
      );
    }
  }
}

export const config = {
  // s'applique à toutes les urls sauf / - ^/js/ - _next/static - _next/image - favicon.ico
  matcher: ['/((?!js/|_next/static|_next/image|favicon.ico).+)'],
};
