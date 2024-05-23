import useVueDEnsemble from '@/components/useVueDEnsemble';
import useChantiersFiltrés from '@/components/useChantiersFiltrés';
import { ChantierRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';


// Pareil que src/client/components/PageAccueil/PageChantiersNew/useVueDEnsemble.ts
export default function usePageRapportDétaillé(chantiers: ChantierRapportDetailleContrat[]) {
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
