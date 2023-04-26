import Chantier from '@/server/domain/chantier/Chantier.interface';
import useVueDEnsemble from '@/components/useVueDEnsemble';
import useChantiersFiltrés from '@/components/useChantiersFiltrés';

export default function usePageRapportDétaillé(chantiers: Chantier[]) {
  const chantiersFiltrés = useChantiersFiltrés(chantiers);
  const {
    avancementsAgrégés,
    répartitionMétéos,
    avancementsGlobauxTerritoriauxMoyens,
    chantiersVueDEnsemble,
  } = useVueDEnsemble(chantiersFiltrés);

  return {
    chantiersFiltrés,
    avancementsAgrégés,
    répartitionMétéos,
    donnéesCartographie: avancementsGlobauxTerritoriauxMoyens,
    donnéesTableauChantiers: chantiersVueDEnsemble,
  };
}
