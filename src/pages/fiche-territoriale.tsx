import { FunctionComponent } from 'react';
import { GetServerSidePropsContext } from 'next';
import { getServerSession } from 'next-auth/next';
import { PageFicheTerritoriale } from '@/components/PageFicheTerritoriale/PageFicheTerritoriale';
import {
  presenterEnTerritoireContrat,
  TerritoireContrat,
} from '@/server/fiche-territoriale/app/contrats/TerritoireContrat';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { dependencies } from '@/server/infrastructure/Dependencies';
import {
  RécupérerTerritoireParCodeUseCase,
} from '@/server/fiche-territoriale/usecases/RécupérerTerritoireParCodeUseCase';
import {
  RécupérerTauxAvancementGlobalTerritoireUseCase,
} from '@/server/fiche-territoriale/usecases/RécupérerTauxAvancementGlobalTerritoireUseCase';
import { RépartitionMétéos } from '@/components/_commons/RépartitionMétéo/RépartitionMétéo.interface';
import { presenterEnRépartitionsMétéosContrat } from '@/server/fiche-territoriale/app/contrats/RepartitionMeteoContrat';
import { RécupérerRépartitionMétéoUseCase } from '@/server/fiche-territoriale/usecases/RécupérerRépartitionMétéoUseCase';
import {
  ChantierFicheTerritorialeContrat,
  presenterEnChantierFicheTerritorialeContrat,
} from '@/server/fiche-territoriale/app/contrats/ChantierFicheTerritorialeContrat';
import {
  presenterEnTauxAvancementGlobalTerritoireContrat,
} from '@/server/fiche-territoriale/app/contrats/TauxAvancementGlobalTerritoireContrat';
import {
  RécupérerListeChantierFicheTerritorialeUseCase,
} from '@/server/fiche-territoriale/usecases/RécupérerListeChantierFicheTerritorialeUseCase';
import { estAutoriséAConsulterLaFicheTerritoriale } from '@/client/utils/fiche-territoriale/fiche-territoriale';
import {
  RécupérerTauxAvancementAnnuelTerritoireUseCase,
} from '@/server/fiche-territoriale/usecases/RécupérerTauxAvancementAnnuelTerritoireUseCase';
import {
  presenterEnTauxAvancementAnnuelTerritoireContrat,
} from '@/server/fiche-territoriale/app/contrats/TauxAvancementAnnuelTerritoireContrat';


export async function getServerSideProps({ req, res, query }: GetServerSidePropsContext) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !estAutoriséAConsulterLaFicheTerritoriale(session.profil)) {
    throw new Error('Not connected or not authorized ?');
  }

  if (query.territoireCode === 'NAT-FR') {
    throw new Error('Veuillez choisir un département ou une région');
  }

  const territoire = presenterEnTerritoireContrat(await new RécupérerTerritoireParCodeUseCase({ territoireRepository: dependencies.getFicheTerritorialeTerritoireRepository() }).run({ territoireCode: query.territoireCode as string }));

  const avancementGlobalTerritoire = presenterEnTauxAvancementGlobalTerritoireContrat(await new RécupérerTauxAvancementGlobalTerritoireUseCase({ chantierRepository: dependencies.getFicheTerritorialeChantierRepository(), territoireRepository: dependencies.getFicheTerritorialeTerritoireRepository() }).run({ territoireCode: query.territoireCode as string }));

  const avancementAnnuelTerritoire = presenterEnTauxAvancementAnnuelTerritoireContrat(await new RécupérerTauxAvancementAnnuelTerritoireUseCase({ chantierRepository: dependencies.getFicheTerritorialeChantierRepository(), territoireRepository: dependencies.getFicheTerritorialeTerritoireRepository() }).run({ territoireCode: query.territoireCode as string }));

  const répartitionMétéos = presenterEnRépartitionsMétéosContrat(await new RécupérerRépartitionMétéoUseCase({ chantierRepository: dependencies.getFicheTerritorialeChantierRepository(), territoireRepository: dependencies.getFicheTerritorialeTerritoireRepository() }).run({ territoireCode: query.territoireCode as string }));

  const chantiersFicheTerritoriale = await new RécupérerListeChantierFicheTerritorialeUseCase({
    chantierRepository: dependencies.getFicheTerritorialeChantierRepository(),
    territoireRepository: dependencies.getFicheTerritorialeTerritoireRepository(),
    syntheseDesResultatsRepository: dependencies.getFicheTerritorialeSyntheseDesResultatsRepository(),
    indicateurRepository: dependencies.getFicheTerritorialeIndicateurRepository(),
    ministereRepository: dependencies.getFicheTerritorialeMinistereRepository(),
  }).run({ territoireCode: query.territoireCode as string })
    .then(result => result.map(presenterEnChantierFicheTerritorialeContrat));

  return {
    props: {
      territoire,
      avancementGlobalTerritoire,
      avancementAnnuelTerritoire,
      répartitionMétéos,
      chantiersFicheTerritoriale,
    },
  };
}

const FicheTerritoriale: FunctionComponent<{ territoire: TerritoireContrat, avancementGlobalTerritoire: number, avancementAnnuelTerritoire: number, répartitionMétéos: RépartitionMétéos, chantiersFicheTerritoriale: ChantierFicheTerritorialeContrat[] }> = ({ territoire, avancementGlobalTerritoire, avancementAnnuelTerritoire, répartitionMétéos, chantiersFicheTerritoriale }) => {
  return (
    <PageFicheTerritoriale
      avancementAnnuelTerritoire={avancementAnnuelTerritoire}
      avancementGlobalTerritoire={avancementGlobalTerritoire}
      chantiersFicheTerritoriale={chantiersFicheTerritoriale}
      répartitionMétéos={répartitionMétéos}
      territoire={territoire}
    />
  );
};

export default FicheTerritoriale;
