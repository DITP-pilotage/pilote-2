import ChantierInfo from '@/server/domain/chantier/ChantierInfo.interface';
import PageChantier from '@/components/Chantier/PageChantier/PageChantier';
import ChantiersFixture from '@/fixtures/ChantiersFixture';

interface NextPageChantierProps {
  chantier: ChantierInfo
}

export default function NextPageChantier({ chantier }: NextPageChantierProps) {
  return (
    <PageChantier chantier={chantier} />
  );
}

  
export async function getServerSideProps({ params }: { params: { id: ChantierInfo['id'] } }) {  
  const chantier = ChantiersFixture.générer({ id: params.id });

  return {
    props: {
      chantier,
    },
  };
}
