import { withAuth } from 'next-auth/middleware';
import { NextFetchEvent, NextRequest, NextResponse } from 'next/server';

const pages = { signIn: '/' };

export const middleware = async (request: NextRequest, event: NextFetchEvent)=> {
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
  }
};

export const config = {
  // s'applique à toutes les urls sauf / - ^/js/ - _next/static - _next/image - favicon.ico
  matcher: ['/((?!js/|_next/static|_next/image|favicon.ico).+)'],
};
