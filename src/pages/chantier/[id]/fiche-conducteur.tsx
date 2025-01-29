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
import {
  getAnneeAffichageDateDeBascule,
} from '@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getDateBasculeAffichageValeursAnneePrecedente';
import { configuration } from '@/config';

export const getServerSideProps: GetServerSideProps<{
  ficheConducteur: FicheConducteurContrat,
  jalon: number
}> = async ({ req, res, query }) => {
  const session = await getServerSession(req, res, authOptions);

  const estFicheConducteurDisponible = new RécupérerVariableContenuUseCase().run({ nomVariableContenu: 'NEXT_PUBLIC_FF_FICHE_CONDUCTEUR' });

  if (!estFicheConducteurDisponible || !session || !estAutoriséAConsulterLaFicheConducteur(session.profil)) {
    throw new Error('Not connected or not authorized ?');
  }

  const jalon = Number.parseInt(query.jalon as string) || getAnneeAffichageDateDeBascule(new Date(), configuration.dateBasculeAffichageValeursAnneePrecedente);

  const ficheConducteur = await ficheConducteurHandler().recupererFicheConducteur(query.id as string, 'NAT-FR', jalon);

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
