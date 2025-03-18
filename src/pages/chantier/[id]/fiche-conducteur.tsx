import { FunctionComponent } from 'react';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { getServerSession } from 'next-auth/next';
import Head from 'next/head';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { FicheConducteurContrat } from '@/server/fiche-conducteur/app/contrats/FicheConducteurContrat';
import { PageFicheConducteur } from '@/components/PageFicheConducteur/PageFicheConducteur';
import { RécupérerVariableContenuUseCase } from '@/server/gestion-contenu/usecases/RécupérerVariableContenuUseCase';
import { estAutoriséAConsulterLaFicheConducteur } from '@/client/utils/fiche-conducteur/fiche-conducteur';
import {
  getAnneeDateDeBascule,
} from '@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule';
import { configuration } from '@/config';
import { getContainer } from '@/server/dependances';

export const getServerSideProps: GetServerSideProps<{
  ficheConducteur: FicheConducteurContrat,
  jalon: number
}> = async ({ req, res, query }) => {
  const session = await getServerSession(req, res, authOptions);

  const estFicheConducteurDisponible = new RécupérerVariableContenuUseCase().run({ nomVariableContenu: 'NEXT_PUBLIC_FF_FICHE_CONDUCTEUR' });

  if (!estFicheConducteurDisponible || !session || !estAutoriséAConsulterLaFicheConducteur(session.profil)) {
    throw new Error('Not connected or not authorized ?');
  }

  const jalon = Number.parseInt(query.jalon as string) || getAnneeDateDeBascule(new Date(), configuration.dateBasculeAffichageValeursAnneePrecedente);

  const ficheConducteur = await getContainer('ficheConducteur').resolve('ficheConducteurHandler').recupererFicheConducteur(query.id as string, 'NAT-FR', jalon);

  return {
    props: {
      ficheConducteur,
      jalon,
    },
  };
};

const FicheConducteur: FunctionComponent<InferGetServerSidePropsType<typeof getServerSideProps>> = ({
  ficheConducteur,
  jalon,
}) => {
  return (
    <>
      <Head>
        <title>
          Fiche conducteur
        </title>
      </Head>
      <PageFicheConducteur
        {...ficheConducteur}
        jalon={jalon}
      />
    </>
  );
};

export default FicheConducteur;
