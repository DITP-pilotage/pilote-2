import { GetServerSidePropsContext } from 'next';
import PageChantier from '@/components/PageChantier/PageChantier';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Chantier from '@/server/domain/chantier/Chantier.interface';

interface NextPageChantierProps {
  indicateurs: Indicateur[],
}

export default function NextPageChantier({ indicateurs }: NextPageChantierProps) {
  return <PageChantier indicateurs={indicateurs} />;
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
