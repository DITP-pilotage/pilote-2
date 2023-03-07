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
  logger.debug({ authOptions });
  if (!session) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.keycloakClientId,
      redirect_uri: config.redirectUri,
      scope: 'openid profile email',
    });
    const redirect = {
      destination: config.authUrl + '?' + params,
      permanent: false,
    };
    logger.debug({ config, params, redirect }, 'config, params & redirect');

    return { redirect };
  }
  logger.debug({ session });

  return {
    props: { session },
  };
}
