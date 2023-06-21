import Chantier from '@/server/domain/chantier/Chantier.interface';
import { actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';
import useVueDEnsemble from '@/components/useVueDEnsemble';
import useChantiersFiltrés from '@/components/useChantiersFiltrés';
import { useRemontéesAlertes } from '@/components/PageAccueil/PageChantiers/useRemontéesAlertes';

export default function usePageChantiers(chantiers: Chantier[]) {
  const { récupérerNombreFiltresActifs } = actionsFiltresStore();
  const { chantiersFiltrés, chantiersFiltrésSansFiltreAlerte } = useChantiersFiltrés(chantiers);

  const { remontéesAlertes } = useRemontéesAlertes(chantiersFiltrésSansFiltreAlerte);

  const {
    avancementsAgrégés,
    répartitionMétéos,
    avancementsGlobauxTerritoriauxMoyens,
    chantiersVueDEnsemble,
  } = useVueDEnsemble(chantiersFiltrés);

  return {
    nombreFiltresActifs: récupérerNombreFiltresActifs(),
    chantiersFiltrés,
    avancementsAgrégés,
    répartitionMétéos,
    donnéesCartographieAvancement: avancementsGlobauxTerritoriauxMoyens,
    donnéesTableauChantiers: chantiersVueDEnsemble,
    remontéesAlertes,
  };
}
