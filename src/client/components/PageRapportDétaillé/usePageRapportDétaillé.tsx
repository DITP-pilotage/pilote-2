import Chantier from '@/server/domain/chantier/Chantier.interface';
import useVueDEnsemble from '@/components/useVueDEnsemble';
import useChantiersFiltrés from '@/components/useChantiersFiltrés';

export default function usePageRapportDétaillé(chantiers: Chantier[]) {
  const { chantiersFiltrés, chantiersFiltrésSansFiltreAlerte } = useChantiersFiltrés(chantiers);

  const {
    avancementsAgrégés,
    répartitionMétéos,
    avancementsGlobauxTerritoriauxMoyens,
    chantiersVueDEnsemble,
    remontéesAlertes,
  } = useVueDEnsemble(chantiersFiltrés, chantiersFiltrésSansFiltreAlerte);

  return {
    chantiersFiltrés,
    avancementsAgrégés,
    répartitionMétéos,
    donnéesCartographie: avancementsGlobauxTerritoriauxMoyens,
    donnéesTableauChantiers: chantiersVueDEnsemble,
    remontéesAlertes,
  };
}
