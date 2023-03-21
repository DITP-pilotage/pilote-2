import { withAuth } from 'next-auth/middleware';

const pages = { signIn: '/' };

export default withAuth({ pages });

export const config = {
  // s'applique à toutes les urls sauf / et ^/js/
  matcher: ['/((?!js/).+)'],
};
