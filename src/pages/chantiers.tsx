import PageChantiers from 'client/components/Chantier/PageChantiers/PageChantiers';
import useChantierStore from 'client/stores/useChantierStore/useChantierStore';
import { chantiers as fakeChantiers } from '../client/components/Chantier/FakeChantiers/FakeChantiers';

interface NextPageChantiersProps {
  chantiers: Chantiers
}

type Chantiers = Record<string, { meteo: number | null, avancement: number | null }>;

function NextPageChantiers({ chantiers }: NextPageChantiersProps) {
  const chantiersStore = useChantierStore(state => state.chantiers);

  const chantiersConsolidés = chantiersStore.map(chantier => (
    {
      id: chantier.id,
      nom: chantier.nom,
      ...chantiers[chantier.id],
    }
  ));

  return (
    <PageChantiers chantiers={chantiersConsolidés} />
  );
}

export const getServerSideProps = async () => {
  let chantiers: Chantiers = {};

  fakeChantiers.forEach(chantier => {
    chantiers[chantier.id] = {
      meteo: chantier.meteo || null,
      avancement: chantier.avancement || null,
    };
  });

  return {
    props: {
      chantiers,
    },
  };
};

export default NextPageChantiers;
