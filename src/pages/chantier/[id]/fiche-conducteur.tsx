import { FunctionComponent } from 'react';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { getServerSession } from 'next-auth/next';
import Head from 'next/head';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { FicheConducteurContrat } from '@/server/fiche-conducteur/app/contrats/FicheConducteurContrat';
import { ficheConducteurHandler } from '@/server/fiche-conducteur/infrastructure/handlers/FicheConducteurHandler';
import { PageFicheConducteur } from '@/components/PageFicheConducteur/PageFicheConducteur';
import { RécupérerVariableContenuUseCase } from '@/server/gestion-contenu/usecases/RécupérerVariableContenuUseCase';
import { estAutoriséAConsulterLaFicheConducteur } from '@/client/utils/fiche-conducteur/fiche-conducteur';

export const getServerSideProps: GetServerSideProps<FicheConducteurContrat> = async ({ req, res, query }) => {
  const session = await getServerSession(req, res, authOptions);

  const estFicheConducteurDisponible = await new RécupérerVariableContenuUseCase().run({ nomVariableContenu: 'NEXT_PUBLIC_FF_FICHE_CONDUCTEUR' });

  if (!estFicheConducteurDisponible || !session || !estAutoriséAConsulterLaFicheConducteur(session.profil)) {
    throw new Error('Not connected or not authorized ?');
  }

  const ficheConducteur = await ficheConducteurHandler().recupererFicheConducteur(query.id as string, 'NAT-FR');

  return {
    props: ficheConducteur,
  };
};

const FicheConducteur: FunctionComponent<InferGetServerSidePropsType<typeof getServerSideProps>> = (ficheConducteur) => {
  return (
    <>

      <Head>
        <title>
          Fiche conducteur
        </title>
      </Head>
      <PageFicheConducteur
        {...ficheConducteur}
      />
    </>
  );
};

export default FicheConducteur;
