import Chantier from '@/server/domain/chantier/Chantier.interface';
import PageChantier from '@/components/PageChantier/PageChantier';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { Objectifs } from '@/server/domain/objectif/Objectif.interface';

interface NextPageChantierProps {
  chantier: Chantier
  indicateurs: Indicateur[]
  objectifs: Objectifs
}

export default function NextPageChantier({ chantier, indicateurs, objectifs }: NextPageChantierProps) {
  return (
    <PageChantier 
      chantier={chantier} 
      indicateurs={indicateurs}
      objectifs={objectifs}
    />
  );
}

export async function getServerSideProps({ params }: { params: { id: Chantier['id'] } }) {
  const chantierRepository = dependencies.getChantierRepository();
  const chantier: Chantier = await chantierRepository.getById(params.id);

  const indicateurRepository = dependencies.getIndicateurRepository();
  const indicateurs: Indicateur[] = await indicateurRepository.récupérerParChantierId(params.id);

  const objectifs: Objectifs = {
    notreAmbition: null,
    déjàFait: null,
    àFaire: null,
  };

  return {
    props: {
      chantier,
      indicateurs,
      objectifs,
    },
  };
}
