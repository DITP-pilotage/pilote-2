import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { getServerSession } from 'next-auth/next';
import { useSession } from 'next-auth/react';
import assert from 'node:assert/strict';
import PageChantier from '@/components/PageChantier/PageChantier';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
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

export const getServerSideProps: GetServerSideProps<NextPageChantierProps> = async ({ req, res, params }) => {
  if (!params?.id) {
    return {
      notFound: true,
    };
  }

  const session = await getServerSession(req, res, authOptions);

  assert(session, 'Vous devez être authentifié pour accéder a cette page');
  assert(session.habilitations, 'La session ne dispose d\'aucune habilitation');

  try {
    const [chantier, indicateurs] = await Promise.all([
      new RécupérerChantierUseCase(
        dependencies.getChantierRepository(),
        dependencies.getChantierDateDeMàjMeteoRepository(),
        dependencies.getMinistèreRepository(),
        dependencies.getTerritoireRepository(),
      ).run(params.id as string, session.habilitations, session.profil),
      dependencies.getIndicateurRepository().récupérerParChantierId(params.id as string),
    ]);

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
  } catch (error) {
    if (error instanceof NonAutorisé) {
      return { notFound: true };
    } else {
      throw error;
    }
  }
};

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
        territoireSélectionné!.code === 'NAT-FR' && session?.profil === 'DROM' && !chantierInformations.estUnChantierDROM ? (
          <ChoixTerritoire chantierId={chantierInformations.id} />
        ) : (
          <PageChantier
            chantierId={chantierInformations.id}
            indicateurs={indicateurs}
          />
        )
      }
    </>
  );
}
