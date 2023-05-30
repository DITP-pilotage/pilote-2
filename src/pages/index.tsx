import { getServerSession } from 'next-auth/next';
import { GetServerSidePropsContext } from 'next/types';
import Head from 'next/head';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Axe from '@/server/domain/axe/Axe.interface';
import Ppg from '@/server/domain/ppg/Ppg.interface';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import PageAccueil from '@/components/PageAccueil/PageAccueil';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import RécupérerListeChantiersUseCase from '@/server/usecase/chantier/RécupérerListeChantiersUseCase';
import RécupérerListeProjetsStructurantsUseCase from '@/server/usecase/projetStructurant/RécupérerListeProjetsStructurantsUseCase';

interface NextPageAccueilProps {
  chantiers: Chantier[]
  projetsStructurants: ProjetStructurant[]
  ministères: Ministère[]
  axes: Axe[],
  ppgs: Ppg[],
}

export default function NextPageAccueil({ chantiers, projetsStructurants, ministères, axes, ppgs }: NextPageAccueilProps) {
  return (
    <>
      <Head>
        <title>
          PILOTE - Piloter l’action publique par les résultats
        </title>
      </Head>
      <PageAccueil
        axes={axes}
        chantiers={chantiers}
        ministères={ministères}
        ppgs={ppgs}
        projetsStructurants={projetsStructurants}
      />
    </>
  );
}

export async function getServerSideProps({ req, res }: GetServerSidePropsContext) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.habilitations)
    return { props: {} };

  const chantiers = await new RécupérerListeChantiersUseCase().run(session.habilitations, session.profil);
  
  const projetsStructurants: ProjetStructurant[] = new RécupérerListeProjetsStructurantsUseCase().run();

  console.log(projetsStructurants);
  
  

  let axes: Axe[] = [];
  let ppgs: Ppg[] = [];
  let ministères: Ministère[] = [];

  if (chantiers.length > 0) {
    const ministèreRepository = dependencies.getMinistèreRepository();
    ministères = await ministèreRepository.getListePourChantiers(chantiers);

    const axeRepository = dependencies.getAxeRepository();
    axes = await axeRepository.getListePourChantiers(chantiers);

    const ppgRepository = dependencies.getPpgRepository();
    ppgs = await ppgRepository.getListePourChantiers(chantiers);
  }

  return {
    props: {
      chantiers,
      projetsStructurants,
      ministères,
      axes,
      ppgs,
    },
  };
}
