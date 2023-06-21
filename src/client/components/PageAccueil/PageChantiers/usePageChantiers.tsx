import Chantier from '@/server/domain/chantier/Chantier.interface';
import { actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';
import useVueDEnsemble from '@/components/useVueDEnsemble';
import useChantiersFiltrés from '@/components/useChantiersFiltrés';
import { useRemontéesAlertes } from '@/components/PageAccueil/PageChantiers/useRemontéesAlertes';

export default function usePageChantiers(chantiers: Chantier[]) {
  const { récupérerNombreFiltresActifs } = actionsFiltresStore();
  const chantiersFiltrés = useChantiersFiltrés(chantiers);

  const { remontéesAlertes, chantiersSélectionnésAlertes } = useRemontéesAlertes(chantiersFiltrés);

  const {
    avancementsAgrégés,
    répartitionMétéos,
    avancementsGlobauxTerritoriauxMoyens,
    chantiersVueDEnsemble,
  } = useVueDEnsemble(chantiersSélectionnésAlertes);

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
