import PageChantiers from '@/client/components/Chantier/PageChantiers/PageChantiers';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import ChantierInfo from '@/server/domain/chantier/ChantierInfo.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

interface NextPageAccueilProps {
  chantiers: ChantierInfo[]
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
  const chantierInfoRepository = dependencies.getChantierInfoRepository();

  const périmètresMinistériels = await périmètreRepository.getListe();
  const chantiers = await chantierInfoRepository.getListe();

  return {
    props: {
      chantiers,
      périmètresMinistériels,
    },
  };
}
