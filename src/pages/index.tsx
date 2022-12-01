import PageChantiers from 'client/components/Chantier/PageChantiers/PageChantiers';
import { Chantier } from 'server/domain/chantier/chantier.interface';
import getListeChantiers from 'server/usecases/getListeChantiers';

interface NextPageAccueilProps {
  chantiers: Chantier[]
}

export default function NextPageAccueil({ chantiers }: NextPageAccueilProps) {
  return (
    <PageChantiers chantiers={chantiers} />
  );
}

export async function getServerSideProps() {
  const chantiers = await getListeChantiers();

  return {
    props: {
      chantiers,
    },
  };
}
