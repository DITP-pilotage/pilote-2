import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { getServerSession } from 'next-auth/next';
import PageChantier from '@/components/PageChantier/PageChantier';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { ChantierInformations } from '@/components/PageImportIndicateur/ChantierInformation.interface';
import RécupérerChantierUseCase from '@/server/usecase/chantier/RécupérerChantierUseCase';

interface NextPageChantierProps {
  indicateurs: Indicateur[],
  chantierInformations: ChantierInformations,
}

export default function NextPageChantier({ indicateurs, chantierInformations }: NextPageChantierProps) {
  return (
    <>
      <Head>
        <title>
          {`Chantier ${chantierInformations.id.replace('CH-', '')} - ${chantierInformations.nom} - PILOTE`}
        </title>
      </Head>
      <PageChantier
        chantierId={chantierInformations.id}
        indicateurs={indicateurs}
      />
    </>
  );
}

export async function getServerSideProps({ req, res, params }: GetServerSidePropsContext<{ id: Chantier['id'] }>) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.habilitations)
    return { props: {} };

  const indicateurRepository = dependencies.getIndicateurRepository();
  const indicateurs: Indicateur[] = await indicateurRepository.récupérerParChantierId(params!.id);
  const chantier: Chantier = await new RécupérerChantierUseCase().run(params!.id, session.habilitations);

  return {
    props: {
      indicateurs,
      chantierInformations: {
        id: chantier.id,
        nom: chantier.nom,
      },
    },
  };
}
