import Head from 'next/head';
import { GetServerSidePropsContext } from 'next';
import { getServerSession } from 'next-auth/next';
import PageAdminIndicateurs from '@/components/PageAdminIndicateurs/PageAdminIndicateurs';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import {
  estAutoriséAModifierDesIndicateurs,
} from '@/client/utils/indicateur/indicateur';

export default function NextPageIndicateurs() {
  return (
    <>
      <Head>
        <title>
          Gestion des indicateurs - PILOTE
        </title>
      </Head>
      <PageAdminIndicateurs />
    </>
  );
}


export async function getServerSideProps({ req, res }: GetServerSidePropsContext) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !estAutoriséAModifierDesIndicateurs(session.profil)) {
    throw new Error('Not connected or not authorized ?');
  }

  return {
    props: {},
  };
}
