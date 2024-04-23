import { getServerSession } from 'next-auth/next';
import Head from 'next/head';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { FunctionComponent } from 'react';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';

export const getServerSideProps: GetServerSideProps<{}> = async ({ req, res }) => {
  const session = await getServerSession(req, res, authOptions);

  if (session) {
    return {
      redirect: {
        permanent: true,
        destination: '/accueil/chantier/NAT-FR',
      },
    };
  }
  return {
    props: {},
  };
};

const NextPageAccueil: FunctionComponent<InferGetServerSidePropsType<typeof getServerSideProps>> = () => {
  return (
    <Head>
      <title>
        PILOTE - Piloter l’action publique par les résultats
      </title>
    </Head>
  );
};

export default NextPageAccueil;
