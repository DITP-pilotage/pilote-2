import { getServerSession } from 'next-auth/next';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { authOptions, keycloak } from './api/auth/[...nextauth]';



export default function Signin() {
  const router = useRouter();
  const { status } = useSession();

  /*useEffect(() => {
    if (status === "unauthenticated") {
      void signIn("keycloak");
    } else if (status === "authenticated") {
      void router.push("/");
    }
  }, [status, router]);
*/
  return (<div>
    PLOP
  </div>);
}


export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  console.log('PLOP', session, authOptions);
  if (!session) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.KEYCLOAK_CLIENT_ID,
      redirect_uri: 'http://localhost:3000/api/auth/callback/keycloak',
      scope: 'openid profile email',
    });


    return {
      redirect: {
        destination: process.env.KEYCLOAK_ISSUER + '/protocol/openid-connect/auth?' + params,
        //destination: "/api/auth/signin/keycloak",
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}
