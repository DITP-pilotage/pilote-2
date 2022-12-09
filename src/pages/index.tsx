import PageChantiers from '@/client/components/Chantier/PageChantiers/PageChantiers';
import ChantierFront from '@/client/interfaces/ChantierFront.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/périmètreMinistériel.interface';
import ChantiersFixture from '@/fixtures/ChantiersFixture';
import PérimètresMinistérielsFixture from '@/fixtures/PérimètresMinistérielsFixture';

interface NextPageAccueilProps {
  chantiers: ChantierFront[]
  périmètresMinistériels: PérimètreMinistériel[]
}

export default function NextPageAccueil({ chantiers, périmètresMinistériels }: NextPageAccueilProps) {
  return (
    <PageChantiers
      chantiers={chantiers}
      périmètresMinistériels={périmètresMinistériels}
    />
  );
}

export async function getServerSideProps() {
  const périmètresMinistériels = PérimètresMinistérielsFixture.générerPlusieurs(4);
  const chantiers = ChantiersFixture.générerPlusieurs(120);

  return {
    props: {
      chantiers: chantiers.map((chantier, i) => ({ ...chantier, id_périmètre: périmètresMinistériels[i % 3].id })),
      périmètresMinistériels,
    },
  };
}
