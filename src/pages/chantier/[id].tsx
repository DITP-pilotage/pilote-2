import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { getServerSession } from 'next-auth/next';
import { useSession } from 'next-auth/react';
import PageChantier from '@/components/PageChantier/PageChantier';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { ChantierInformations } from '@/components/PageImportIndicateur/ChantierInformation.interface';
import RécupérerChantierUseCase from '@/server/usecase/chantier/RécupérerChantierUseCase';
import { territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import ChoixTerritoire from '@/components/PageChantier/ChoixTerritoire/ChoixTerritoire';
import { NonAutorisé } from '@/server/utils/errors';

interface NextPageChantierProps {
  indicateurs: Indicateur[],
  chantierInformations: ChantierInformations,
}

export default function NextPageChantier({ indicateurs, chantierInformations }: NextPageChantierProps) {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  const { data: session } = useSession();
  
  return (
    <>
      <Head>
        <title>
          {`Chantier ${chantierInformations.id.replace('CH-', '')} - ${chantierInformations.nom} - PILOTE`}
        </title>
      </Head>
      {
        territoireSélectionné!.code === 'NAT-FR' && session?.profil === 'DROM' && !chantierInformations.estUnChantierDROM ?
          <ChoixTerritoire chantierId={chantierInformations.id} />
          :
          <PageChantier
            chantierId={chantierInformations.id}
            indicateurs={indicateurs}
          />
      }
    </>
  );
}

export async function getServerSideProps({ req, res, params }: GetServerSidePropsContext<{ id: Chantier['id'] }>) {
  if (!params?.id) {
    return {
      notFound: true,
    };
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.habilitations)
    return { props: {} };

  const indicateurRepository = dependencies.getIndicateurRepository();
  const indicateurs: Indicateur[] = await indicateurRepository.récupérerParChantierId(params.id);
  let chantier: Chantier;
  try {
    chantier = await new RécupérerChantierUseCase().run(params.id, session.habilitations, session.profil);
  } catch (error) {
    if (error instanceof NonAutorisé) {
      return { notFound: true };
    } else {
      throw error;
    }
  }
  return {
    props: {
      indicateurs,
      chantierInformations: {
        id: chantier.id,
        nom: chantier.nom,
        estUnChantierDROM: chantier.périmètreIds.includes('PER-018'),
      },
    },
  };
}
