import '@gouvfr/dsfr/dist/component/sidemenu/sidemenu.min.css';
import Head from 'next/head';
import { GetServerSidePropsContext } from 'next';
import { getServerSession } from 'next-auth/next';
import { PageMessageInformation } from '@/components/PageAdminGestionContenus/PageMessageInformation';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { estAutoriséAModifierDesIndicateurs } from '@/client/utils/indicateur/indicateur';

export default function NextAdminMessageInformation() {
  return (
    <>
      <Head>
        <title>
          Message d'information - Pilote
        </title>
      </Head>
      <PageMessageInformation />
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
