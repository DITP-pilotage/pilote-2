import { TerritoireContrat } from '@/server/fiche-territoriale/app/contrats/TerritoireContrat';
import { RepartitionMeteoContrat } from '@/server/fiche-territoriale/app/contrats/RepartitionMeteoContrat';
import {
  ChantierFicheTerritorialeContrat,
} from '@/server/fiche-territoriale/app/contrats/ChantierFicheTerritorialeContrat';

export interface FicheTerritorialeContrat {
  territoire: TerritoireContrat,
  avancementGlobalTerritoire: number | null,
  avancementAnnuelTerritoire: number | null,
  répartitionMétéos: RepartitionMeteoContrat,
  chantiersFicheTerritoriale: ChantierFicheTerritorialeContrat[],
}
