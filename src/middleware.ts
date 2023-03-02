// https://github.com/nextauthjs/next-auth/discussions/3079

import { withAuth } from 'next-auth/middleware';
import configuration from '@/server/infrastructure/Configuration';

const pages = { signIn: '/api/auth/signin' };

if (!configuration.isUsingDevCredentials) {
  pages.signIn = '/signIn';
}

export default withAuth({ pages });

export const config = {
  matcher: ['/(.*)'],
};
