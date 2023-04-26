import Chantier from '@/server/domain/chantier/Chantier.interface';
import { actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';
import useVueDEnsemble from '@/components/useVueDEnsemble';

export default function usePageChantiers(chantiers: Chantier[]) {
  const { récupérerNombreFiltresActifs } = actionsFiltresStore();
  const {
    chantiersFiltrés,
    avancementsAgrégés,
    répartitionMétéos,
    avancementsGlobauxTerritoriauxMoyens,
    chantiersVueDEnsemble,
  } = useVueDEnsemble(chantiers);

  return {
    nombreFiltresActifs: récupérerNombreFiltresActifs(),
    chantiersFiltrés,
    avancementsAgrégés,
    répartitionMétéos,
    donnéesCartographie: avancementsGlobauxTerritoriauxMoyens,
    donnéesTableauChantiers: chantiersVueDEnsemble,
  };
}
