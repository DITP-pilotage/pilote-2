import Chantier from '@/server/domain/chantier/Chantier.interface';
import PageChantier from '@/components/PageChantier/PageChantier';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

interface NextPageChantierProps {
  chantier: Chantier
  indicateurs: Indicateur[]
}

export default function NextPageChantier({ chantier, indicateurs }: NextPageChantierProps) {
  return (
    <PageChantier 
      chantier={chantier} 
      indicateurs={indicateurs}
    />
  );
}

export async function getServerSideProps({ params }: { params: { id: Chantier['id'] } }) {
  const chantierRepository = dependencies.getChantierRepository();
  const chantier: Chantier = await chantierRepository.getById(params.id);
  const indicateurs: Indicateur[] = chantier.indicateurs;

  return {
    props: {
      chantier,
      indicateurs,
    },
  };
}
