import { FunctionComponent } from 'react';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { FicheConducteurContrat } from '@/server/fiche-conducteur/app/contrats/FicheConducteurContrat';
import { ficheConducteurHandler } from '@/server/fiche-conducteur/infrastructure/handlers/FicheConducteurHandler';
import { estAutoriséAConsulterLaFicheTerritoriale } from '@/client/utils/fiche-territoriale/fiche-territoriale';
import { PageFicheConducteur } from '@/components/PageFicheConducteur/PageFicheConducteur';

export const getServerSideProps: GetServerSideProps<FicheConducteurContrat> = async ({ req, res, query }) => {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !estAutoriséAConsulterLaFicheTerritoriale(session.profil)) {
    throw new Error('Not connected or not authorized ?');
  }

  const { chantier, avancement, synthèseDesRésultats, donnéesCartographie } = await ficheConducteurHandler().recupererFicheConducteur(query.id as string, 'NAT-FR');

  return {
    props: {
      chantier,
      avancement,
      synthèseDesRésultats,
      donnéesCartographie,
    },
  };
};

const FicheConducteur: FunctionComponent<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ chantier, avancement, synthèseDesRésultats, donnéesCartographie }) => {
  return (
    <PageFicheConducteur
      avancement={avancement}
      chantier={chantier}
      donnéesCartographie={donnéesCartographie}
      synthèseDesRésultats={synthèseDesRésultats}
    />
  );
};

export default FicheConducteur;
