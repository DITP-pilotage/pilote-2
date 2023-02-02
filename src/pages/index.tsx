import PageChantiers from '@/client/components/PageChantiers/PageChantiers';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Ministère } from '@/components/PageChantiers/BarreLatérale/FiltresMinistères/FiltresMinistères.interface';

interface NextPageAccueilProps {
  chantiers: Chantier[]
  ministères: Ministère[]
}

export default function NextPageAccueil({ chantiers, ministères }: NextPageAccueilProps) {
  return (
    <PageChantiers
      chantiers={chantiers}
      ministères={ministères}
    />
  );
}

export async function getServerSideProps() {
  const chantierRepository = dependencies.getChantierRepository();
  const chantiers = await chantierRepository.getListe();

  const ministèreRepository = dependencies.getMinistèreRepository();
  const ministères = await ministèreRepository.getListe();

  return {
    props: {
      chantiers,
      ministères,
    },
  };
}
