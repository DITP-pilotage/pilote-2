import PageChantiers from '@/client/components/PageChantiers/PageChantiers';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';

// TODO mettre dans Chantier dans 'server/domain/chantier/Chantier.interface.ts'
// ce qui demande d'abord de modifier les repositories de chantier
// ce qui demande de déterminer les id des axes côté data
export type Axe = {
  id: string,
  nom: string,
};

interface NextPageAccueilProps {
  chantiers: Chantier[]
  ministères: Ministère[]
  axes: Axe[],
}

export default function NextPageAccueil({ chantiers, ministères, axes }: NextPageAccueilProps) {
  return (
    <PageChantiers
      axes={axes}
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

  const axes = new Set();
  chantiers.forEach(chantier => chantier.axe !== null && axes.add(chantier.axe));

  const ppg = new Set();
  chantiers.forEach(chantier => chantier.ppg !== null && ppg.add(chantier.ppg));

  return {
    props: {
      chantiers,
      ministères,
      axes: [...axes].sort().map((axe, index) => ({ id: index, nom: axe })),
      ppg: [...ppg].sort().map((ppgÉlément, index) => ({ id: index, nom: ppgÉlément })),
    },
  };
}
