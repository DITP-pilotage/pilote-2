import PageChantiers from 'client/components/Chantier/PageChantiers/PageChantiers';
import Chantier from 'server/domain/chantier/chantier.interface';
import PérimètreMinistériel from 'server/domain/périmètreMinistériel/périmètreMinistériel.interface';
import getListeChantiers from 'server/usecases/getListeChantiers';

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
  const chantiers = await getListeChantiers();
  const périmètresMinistériels = [
    {
      id: 'PER-1',
      nom: 'Agriculture et Alimentation',
    },
    {
      id: 'PER-2',
      nom: 'Armée',
    },    {
      id: 'PER-3',
      nom: 'Culture',
    },
  ];

  return {
    props: {
      chantiers: chantiers.map((chantier, i) => ({ ...chantier, id_périmètre: périmètresMinistériels[i % 3].id })),
      périmètresMinistériels,
    },
  };
}
