import { getServerSession } from 'next-auth/next';
import config from '@/server/infrastructure/Configuration';
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
  // eslint-disable-next-line no-console
  console.log('PLOP', session, authOptions);
  if (!session) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.keycloakClientId,
      redirect_uri: config.redirectUri,
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
