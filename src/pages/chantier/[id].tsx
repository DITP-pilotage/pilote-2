import Chantier from '@/server/domain/chantier/Chantier.interface';
import PageChantier from '@/components/PageChantier/PageChantier';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { DétailsCommentaire } from '@/server/domain/chantier/Commentaire.interface';

interface NextPageChantierProps {
  chantier: Chantier
  indicateurs: Indicateur[]
  objectif: DétailsCommentaire | null
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

  const commentaireRepository = dependencies.getCommentaireRepository();
  const objectif: DétailsCommentaire | null = await commentaireRepository.getObjectifsByChantierId(params.id);

  return {
    props: {
      chantier,
      indicateurs,
      objectif,
    },
  };
}
