import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import PageChantier from '@/components/PageChantier/PageChantier';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Chantier from '@/server/domain/chantier/Chantier.interface';

interface NextPageChantierProps {
  indicateurs: Indicateur[],
}

export default function NextPageChantier({ indicateurs }: NextPageChantierProps) {
  const id = useRouter().query.id;
  const chantierId = Array.isArray(id) ? id[0] : id;
  return (
    <>
      <Head>
        <title>
          {`Chantier ${chantierId?.replace('CH-', '') ?? ''} - PILOTE`}
        </title>
      </Head>
      <PageChantier
        indicateurs={indicateurs}
      />
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext<{ id: Chantier['id'] }>) {
  const indicateurRepository = dependencies.getIndicateurRepository();
  const indicateurs: Indicateur[] = await indicateurRepository.récupérerParChantierId(context.params!.id);

  return {
    props: {
      indicateurs,
    },
  };
}
