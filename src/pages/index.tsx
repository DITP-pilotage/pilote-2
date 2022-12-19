import PageChantiers from '@/client/components/Chantier/PageChantiers/PageChantiers';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

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
  const périmètreRepository = dependencies.getPerimètreMinistérielRepository();
  const chantierRepository = dependencies.getChantierRepository();

  const périmètresMinistériels = await périmètreRepository.getListe();
  const chantiers = await chantierRepository.getListe();

  return {
    props: {
      chantiers,
      périmètresMinistériels,
    },
  };
}
