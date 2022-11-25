import PageChantiers from 'client/components/Chantier/PageChantiers/PageChantiers';
import { Chantier } from 'server/domain/chantier/chantier.interface';
import getListeChantiers from 'server/usecases/getListeChantiers';

interface NextPageChantiersProps {
  chantiers: Chantier[]
}

function NextPageChantiers({ chantiers }: NextPageChantiersProps) {
  return (
    <PageChantiers chantiers={chantiers} />
  );
}

export const getServerSideProps = async () => {
  const chantiers = await getListeChantiers();

  return {
    props: {
      chantiers,
    },
  };
};

export default NextPageChantiers;
