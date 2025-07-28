import { GetServerSidePropsContext } from 'next';
import { FunctionComponent } from 'react';
import Head from 'next/head';
import { getServerSession } from 'next-auth/next';
import { getContainer } from '@/server/dependances';
import ValidationInscription from '@/components/PageInscription/ValidationInscription';
import ErreurInscription from '@/components/PageInscription/ErreurInscription';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';

export interface NextPageInscriptionProps {
  contactAjouterALaListe: boolean
}

export async function getServerSideProps({ req, res }: GetServerSidePropsContext<{
  id: string,
}>) {
  const session = await getServerSession(req, res, authOptions);

  const redirigerVersPageAccueil = {
    redirect: {
      destination: '/',
      permanent: false,
    },
  };

  if (!session?.user.id) {
    return redirigerVersPageAccueil;
  }

  const contactAjouterALaListe = await getContainer('gestionUtilisateur').resolve('ajouterUnContactAUneInfoLettreUseCase').execute(session.user.id, 11);
  
  return {
    props: {
      contactAjouterALaListe,
    },
  };
}

const NextPageAdminIndicateur: FunctionComponent<NextPageInscriptionProps> = ({
  contactAjouterALaListe,
}) => {
  return (
    <>
      <Head>
        <title>
          { contactAjouterALaListe ? 'Minute Pilote - Inscription validée' : 'Minute Pilote - Erreur inscription'}
        </title>
      </Head>
      <main>
        {
          contactAjouterALaListe ? <ValidationInscription /> : <ErreurInscription />
        }
      </main>
    </>
  );
};

export default NextPageAdminIndicateur;
