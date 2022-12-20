import Chantier from '@/server/domain/chantier/Chantier.interface';
import PageChantier from '@/components/Chantier/PageChantier/PageChantier';
import ChantiersFixture from '@/fixtures/ChantiersFixture';

interface NextPageChantierProps {
  chantier: Chantier
}

export default function NextPageChantier({ chantier }: NextPageChantierProps) {
  return (
    <PageChantier chantier={chantier} />
  );
}

  
export async function getServerSideProps({ params }: { params: { id: Chantier['id'] } }) {  
  const chantier = ChantiersFixture.générer({ id: params.id });

  return {
    props: {
      chantier,
    },
  };
}
