import { getServerSession } from 'next-auth/next';
import config from '@/server/infrastructure/Configuration';
import logger from '@/server/infrastructure/logger';
import { authOptions } from './api/auth/[...nextauth]';

export default function Signin() {
  return (
    <div>
      PLOP
    </div>
  );
}

export async function getServerSideProps(context: any) {
  const session = await getServerSession(context.req, context.res, authOptions);
  logger.debug('PLOP', session, authOptions);
  if (!session) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.keycloakClientId,
      redirect_uri: 'http://' + context.req.headers.host + config.redirectUri,
      scope: 'openid profile email',
    });

    return {
      redirect: {
        destination: config.authUrl + '?' + params,
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}
