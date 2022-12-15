import PageChantiers from '@/client/components/Chantier/PageChantiers/PageChantiers';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import PérimètreMinistérielRandomRepository from '@/server/infrastructure/PérimètreMinistérielRandomRepository';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import PérimètreMinistérielRepository from '@/server/domain/périmètreMinistériel/PérimètreMinistérielRepository.interface';
import ChantierRandomRepository from '@/server/infrastructure/ChantierRandomRepository';

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
  const idPérimètres = [ { id: 'PER-001' }, { id: 'PER-002' }, { id: 'PER-003' }, { id: 'PER-004' } ];
  const périmètreRepository: PérimètreMinistérielRepository = new PérimètreMinistérielRandomRepository(idPérimètres);
  const périmètresMinistériels = await périmètreRepository.getListe();
  const chantierRepository: ChantierRepository = new ChantierRandomRepository(120, idPérimètres);
  const chantiers = await chantierRepository.getListe();

  return {
    props: {
      chantiers,
      périmètresMinistériels,
    },
  };
}
