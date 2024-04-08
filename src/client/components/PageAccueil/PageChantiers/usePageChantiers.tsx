import { actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';
import useVueDEnsemble from '@/components/useVueDEnsemble';
import useChantiersFiltrés from '@/components/useChantiersFiltrés';
import { ChantierAccueilContrat } from '@/server/chantiers/app/contrats/ChantierAccueilContrat';

export default function usePageChantiers(chantiers: ChantierAccueilContrat[]) {
  const { récupérerNombreFiltresActifs } = actionsFiltresStore();
  const { chantiersFiltrés, chantiersFiltrésSansFiltreAlerte } = useChantiersFiltrés(chantiers);

  const aDesDroitsDeLectureSurAuMoinsUnChantierBrouillon = (chantierIds: string[]) => {
    return chantiers.some(chantier => chantier.statut === 'BROUILLON' && chantierIds.includes(chantier.id));
  };

  const {
    avancementsAgrégés,
    répartitionMétéos,
    avancementsGlobauxTerritoriauxMoyens,
    chantiersVueDEnsemble,
    remontéesAlertes,
  } = useVueDEnsemble(chantiersFiltrés, chantiersFiltrésSansFiltreAlerte);

  return {
    nombreFiltresActifs: récupérerNombreFiltresActifs(),
    chantiersFiltrés,
    avancementsAgrégés,
    répartitionMétéos,
    donnéesCartographieAvancement: avancementsGlobauxTerritoriauxMoyens,
    donnéesTableauChantiers: chantiersVueDEnsemble,
    remontéesAlertes,
    aDesDroitsDeLectureSurAuMoinsUnChantierBrouillon,
  };
}
