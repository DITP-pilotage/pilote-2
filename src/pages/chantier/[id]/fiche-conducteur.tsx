import { FunctionComponent } from 'react';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { FicheConducteurContrat } from '@/server/fiche-conducteur/app/contrats/FicheConducteurContrat';
import { ficheConducteurHandler } from '@/server/fiche-conducteur/infrastructure/handlers/FicheConducteurHandler';
import { estAutoriséAConsulterLaFicheTerritoriale } from '@/client/utils/fiche-territoriale/fiche-territoriale';
import { PageFicheConducteur } from '@/components/PageFicheConducteur/PageFicheConducteur';
import { RécupérerVariableContenuUseCase } from '@/server/gestion-contenu/usecases/RécupérerVariableContenuUseCase';

export const getServerSideProps: GetServerSideProps<FicheConducteurContrat> = async ({ req, res, query }) => {
  const session = await getServerSession(req, res, authOptions);

  const estFicheConducteurDisponible = await new RécupérerVariableContenuUseCase().run({ nomVariableContenu: 'NEXT_PUBLIC_FF_FICHE_CONDUCTEUR' });

  if (!estFicheConducteurDisponible || !session || !estAutoriséAConsulterLaFicheTerritoriale(session.profil)) {
    throw new Error('Not connected or not authorized ?');
  }

  const ficheConducteur = await ficheConducteurHandler().recupererFicheConducteur(query.id as string, 'NAT-FR');

  return {
    props: ficheConducteur,
  };
};

const FicheConducteur: FunctionComponent<InferGetServerSidePropsType<typeof getServerSideProps>> = (ficheConducteur) => {
  return (
    <PageFicheConducteur
      {...ficheConducteur}
    />
  );
};

export default FicheConducteur;
