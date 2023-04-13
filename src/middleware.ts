import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

const pages = { signIn: '/' };

export default withAuth(
  function middleware(request) {
    const response = NextResponse.next();

    const cookie = request.cookies.get('csrf');

    if (request.nextauth.token && (cookie === undefined || cookie !== request.nextauth.token.jti)) {
      const jti = String(request.nextauth.token.jti);
      response.cookies.set('csrf', jti, { sameSite: 'lax' });

      return response;
    }
  }, 
  { pages },
);

export const config = {
  // s'applique à toutes les urls sauf / - ^/js/
  matcher: ['/((?!js/).+)'],
};
