import PageChantiers from '@/client/components/Chantier/PageChantiers/PageChantiers';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/périmètreMinistériel.interface';
import PérimètresMinistérielsFixture from '@/fixtures/PérimètresMinistérielsFixture';
import Chantier from '@/server/domain/chantier/chantier.interface';
import { ChantierRepository } from '@/server/domain/chantier/chantierRepository.interface';
import { ChantierRandomRepository } from '@/server/infrastructure/chantierRandomRepository';

interface NextPageAccueilProps {
  chantiers: Chantier[]
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
  const valeursFixes = [ { id: 'PER-001' }, { id: 'PER-002' }, { id: 'PER-003' }, { id: 'PER-004' } ];
  const périmètresMinistériels = PérimètresMinistérielsFixture.générerPlusieurs(4, valeursFixes);
  const chantierRepository: ChantierRepository = new ChantierRandomRepository(120, valeursFixes);
  const chantiers = await chantierRepository.getListeChantiers();

  return {
    props: {
      chantiers,
      périmètresMinistériels,
    },
  };
}
