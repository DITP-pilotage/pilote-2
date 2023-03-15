import Chantier from '@/server/domain/chantier/Chantier.interface';
import PageChantier from '@/components/PageChantier/PageChantier';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import Objectif from '@/server/domain/objectif/Objectif.interface';

interface NextPageChantierProps {
  chantier: Chantier
  indicateurs: Indicateur[]
  objectif: Objectif
}

export default function NextPageChantier({ chantier, indicateurs, objectif }: NextPageChantierProps) {
  return (
    <PageChantier 
      chantier={chantier} 
      indicateurs={indicateurs}
      objectif={objectif}
    />
  );
}

export async function getServerSideProps({ params }: { params: { id: Chantier['id'] } }) {
  const chantierRepository = dependencies.getChantierRepository();
  const chantier: Chantier = await chantierRepository.getById(params.id);

  const indicateurRepository = dependencies.getIndicateurRepository();
  const indicateurs: Indicateur[] = await indicateurRepository.getByChantierId(params.id);

  const objectifRepository = dependencies.getObjectifRepository();
  const objectif: Objectif = await objectifRepository.récupérerLePlusRécent(params.id);

  return {
    props: {
      chantier,
      indicateurs,
      objectif,
    },
  };
}
