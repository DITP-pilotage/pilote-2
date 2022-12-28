import Chantier from '@/server/domain/chantier/Chantier.interface';
import PageChantier from '@/components/Chantier/PageChantier/PageChantier';
import { dependencies } from '@/server/infrastructure/Dependencies';

interface NextPageChantierProps {
  chantier: Chantier
}

export default function NextPageChantier({ chantier }: NextPageChantierProps) {
  return (
    <PageChantier chantier={chantier} />
  );
}

export async function getServerSideProps({ params }: { params: { id: Chantier['id'], zoneNom: Chantier['zoneNom'] } }) {
  const chantierRepository = dependencies.getChantierRepository();
  const chantier: Chantier = await chantierRepository.getById(params.id, '');

  return {
    props: {
      chantier,
    },
  };
}
