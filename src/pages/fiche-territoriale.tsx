import { FunctionComponent } from 'react';
import { GetServerSidePropsContext } from 'next';
import { getServerSession } from 'next-auth/next';
import { PageFicheTerritoriale } from '@/components/PageFicheTerritoriale/PageFicheTerritoriale';
import { TerritoireContrat } from '@/server/fiche-territoriale/app/contrats/TerritoireContrat';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { estAutoriséAModifierDesIndicateurs } from '@/client/utils/indicateur/indicateur';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { Territoire } from '@/server/fiche-territoriale/domain/Territoire';
import {
  RécupérerTerritoireParCodeUseCase,
} from '@/server/fiche-territoriale/usecases/RécupérerTerritoireParCodeUseCase';

function presenterEnTerritoireContrat(territoire: Territoire): TerritoireContrat {
  return {
    nomAffiché: territoire.nomAffiché,
  };
}

export async function getServerSideProps({ req, res, query }: GetServerSidePropsContext) {
  const session = await getServerSession(req, res, authOptions);

  // Définir les autorisations
  if (!session || !estAutoriséAModifierDesIndicateurs(session.profil)) {
    throw new Error('Not connected or not authorized ?');
  }

  const territoire = presenterEnTerritoireContrat(await new RécupérerTerritoireParCodeUseCase({ territoireRepository: dependencies.getFicheTerritorialeTerritoireRepository() }).run({ territoireCode: query.territoireCode as string }));

  return {
    props: {
      territoire,
    },
  };
}

const FicheTerritoriale: FunctionComponent<{ territoire: TerritoireContrat }> = ({ territoire }) => {
  return (
    <PageFicheTerritoriale territoire={territoire} />
  );
};

export default FicheTerritoriale;
