import { ChantierAccueilContrat } from '@/server/chantiers/app/contrats/ChantierAccueilContrat';
import {
  AvancementsStatistiquesAccueilContrat,
} from '@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat';
import { AgrégatParTerritoire } from '@/client/utils/chantier/agrégateurNew/agrégateur.interface';
import useVueDEnsemble from './useVueDEnsemble';

export default function usePageChantiers(chantiers: ChantierAccueilContrat[], territoireCode: string, mailleSelectionnee: 'départementale' | 'régionale', filtresComptesCalculés: Record<string, { nombre: number }>, avancementsAgrégés: AvancementsStatistiquesAccueilContrat, donnéesTerritoiresAgrégées: AgrégatParTerritoire) {
  const aDesDroitsDeLectureSurAuMoinsUnChantierBrouillon = (chantierIds: string[]) => {
    return chantiers.some(chantier => chantier.statut === 'BROUILLON' && chantierIds.includes(chantier.id));
  };

  const {
    répartitionMétéos,
    avancementsGlobauxTerritoriauxMoyens,
    chantiersVueDEnsemble,
    remontéesAlertes,
  } = useVueDEnsemble(chantiers, territoireCode, mailleSelectionnee, filtresComptesCalculés, avancementsAgrégés, donnéesTerritoiresAgrégées);

  return {
    chantiersFiltrés: chantiers,
    avancementsAgrégés,
    répartitionMétéos,
    donnéesCartographieAvancement: avancementsGlobauxTerritoriauxMoyens,
    donnéesTableauChantiers: chantiersVueDEnsemble,
    remontéesAlertes,
    aDesDroitsDeLectureSurAuMoinsUnChantierBrouillon,
  };
}
