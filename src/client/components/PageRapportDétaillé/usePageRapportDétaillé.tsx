import Chantier from '@/server/domain/chantier/Chantier.interface';
import useVueDEnsemble from '@/components/useVueDEnsemble';

export default function usePageRapportDétaillé(chantiers: Chantier[]) {
  const {
    chantiersFiltrés,
    avancementsAgrégés,
    répartitionMétéos,
    avancementsGlobauxTerritoriauxMoyens,
    chantiersVueDEnsemble,
  } = useVueDEnsemble(chantiers);

  return {
    chantiersFiltrés,
    avancementsAgrégés,
    répartitionMétéos,
    donnéesCartographie: avancementsGlobauxTerritoriauxMoyens,
    donnéesTableauChantiers: chantiersVueDEnsemble,
  };
}
