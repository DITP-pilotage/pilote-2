import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { getServerSession } from 'next-auth/next';
import PageChantier from '@/components/PageChantier/PageChantier';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { ChantierInformation } from '@/components/PageImportIndicateur/ChantierInformation.interface';

interface NextPageChantierProps {
  indicateurs: Indicateur[],
  chantierInformation: ChantierInformation,
}

export default function NextPageChantier({ indicateurs, chantierInformation }: NextPageChantierProps) {
  return (
    <>
      <Head>
        <title>
          {`Chantier ${chantierInformation.id.replace('CH-', '')} - ${chantierInformation.nom} - PILOTE`}
        </title>
      </Head>
      <PageChantier
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
  const chantierRepository = dependencies.getChantierRepository();
  const chantier: Chantier = await chantierRepository.getById(params!.id, session.habilitations);

  return {
    props: {
      indicateurs,
      chantierInformation: {
        id: chantier.id,
        nom: chantier.nom,
        axe: chantier.axe,
        ppg: chantier.ppg,
      },
    },
  };
}
