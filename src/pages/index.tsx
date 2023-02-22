import PageChantiers from '@/client/components/PageChantiers/PageChantiers';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Chantier, { Axe, Ppg } from '@/server/domain/chantier/Chantier.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';

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

  const axes = new Set();
  const ppg = new Set();
  chantiers.forEach(chantier => {
    if (chantier.axe !== null)
      axes.add(chantier.axe);
    if (chantier.ppg !== null)
      ppg.add(chantier.ppg);
  });
  return {
    props: {
      chantiers,
      ministères,
      axes: [...axes].sort().map((axe, index) => ({ id: index, nom: axe })),
      ppg: [...ppg].sort().map((ppgÉlément, index) => ({ id: index, nom: ppgÉlément })),
    },
  };
}
