import PageChantiers from '@/client/components/PageChantiers/PageChantiers';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Axe from '@/server/domain/axe/Axe.interface';
import Ppg from '@/server/domain/ppg/Ppg.interface';

interface NextPageAccueilProps {
  chantiers: Chantier[]
  ministères: Ministère[]
  axes: Axe[],
  ppg: Ppg[]
}

export default function NextPageAccueil({ chantiers, ministères, axes, ppg }: NextPageAccueilProps) {
  return (
    <PageChantiers
      axes={axes}
      chantiers={chantiers}
      ministères={ministères}
      ppg={ppg}
    />
  );
}



export async function getServerSideProps() {
  const chantierRepository = dependencies.getChantierRepository();
  const chantiers = await chantierRepository.getListe();

  const ministèreRepository = dependencies.getMinistèreRepository();
  const ministères = await ministèreRepository.getListe();

  const axeRepository = dependencies.getAxeRepository();
  const axes = await axeRepository.getListe();

  const ppgRepository = dependencies.getPpgRepository();
  const ppgs = await ppgRepository.getListe();

  return {
    props: {
      chantiers,
      ministères,
      axes: axes,
      ppg: ppgs,
    },
  };
}
