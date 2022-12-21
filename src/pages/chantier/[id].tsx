import ChantierInfo from '@/server/domain/chantier/ChantierInfo.interface';
import PageChantier from '@/components/Chantier/PageChantier/PageChantier';
import ChantierInfosFixture from '@/fixtures/ChantierInfosFixture';

interface NextPageChantierProps {
  chantier: ChantierInfo
}

export default function NextPageChantier({ chantier }: NextPageChantierProps) {
  return (
    <PageChantier chantier={chantier} />
  );
}

  
export async function getServerSideProps({ params }: { params: { id: ChantierInfo['id'] } }) {  
  const chantier = ChantierInfosFixture.générer({ id: params.id });

  return {
    props: {
      chantier,
    },
  };
}
