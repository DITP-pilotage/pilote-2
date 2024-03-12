import { FunctionComponent } from 'react';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { getServerSession } from 'next-auth/next';
import { PageFicheTerritoriale } from '@/components/PageFicheTerritoriale/PageFicheTerritoriale';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { estAutoriséAConsulterLaFicheTerritoriale } from '@/client/utils/fiche-territoriale/fiche-territoriale';
import { FicheTerritorialeContrat } from '@/server/fiche-territoriale/app/contrats/FicheTerritorialeContrat';
import { ficheTerritorialeHandler } from '@/server/fiche-territoriale/infrastructure/handlers/FicheTerritorialeHandler';


export const getServerSideProps: GetServerSideProps<{ ficheTerritoriale: FicheTerritorialeContrat }> = async ({ req, res, query }) => {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !estAutoriséAConsulterLaFicheTerritoriale(session.profil)) {
    throw new Error('Not connected or not authorized ?');
  }

  if (query.territoireCode === 'NAT-FR') {
    throw new Error('Veuillez choisir un département ou une région');
  }

  const ficheTerritoriale = await ficheTerritorialeHandler().recupererFicheTerritoriale(query.territoireCode as string);

  return {
    props: {
      ficheTerritoriale,
    },
  };
};

const FicheTerritoriale: FunctionComponent<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ ficheTerritoriale }) => {
  return (
    <PageFicheTerritoriale
      avancementAnnuelTerritoire={ficheTerritoriale.avancementAnnuelTerritoire}
      avancementGlobalTerritoire={ficheTerritoriale.avancementGlobalTerritoire}
      chantiersFicheTerritoriale={ficheTerritoriale.chantiersFicheTerritoriale}
      répartitionMétéos={ficheTerritoriale.répartitionMétéos}
      territoire={ficheTerritoriale.territoire}
    />
  );
};

export default FicheTerritoriale;
