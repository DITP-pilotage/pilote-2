import ChantierFront from '@/client/interfaces/ChantierFront.interface';
import PageChantier from '@/components/Chantier/PageChantier/PageChantier';
import ChantiersFixture from '@/fixtures/ChantiersFixture';

interface NextPageChantierProps {
  chantier: ChantierFront
}

export default function NextPageChantier({ chantier }: NextPageChantierProps) {
  return (
    <PageChantier chantier={chantier} />
  );
}

  
export async function getServerSideProps({ params }: { params: { id: ChantierFront['id'] } }) {  
  const chantier = ChantiersFixture.générer({ id: params.id, nom: 'Offrir une scolarisation inclusive et adaptée à tous les enfants handicapés' });

  return {
    props: {
      chantier,
    },
  };
}
