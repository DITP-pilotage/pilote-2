import { ChantierFicheTerritoriale } from '@/server/fiche-territoriale/domain/ChantierFicheTerritoriale';
import { formaterDate } from '@/client/utils/date/date';

export interface ChantierFicheTerritorialeContrat {
  nom: string;
  ministereIcone: string;
  meteo: 'ORAGE' | 'NUAGE' | 'COUVERT' | 'SOLEIL' | 'NON_NECESSAIRE' | 'NON_RENSEIGNEE';
  dateQualitative: string;
  tauxAvancement: number | null;
  dateQuantitative: string;
}

export const presenterEnChantierFicheTerritorialeContrat = (chantier: ChantierFicheTerritoriale): ChantierFicheTerritorialeContrat => (
  {
    nom: chantier.nom,
    meteo: chantier.meteo || 'NON_RENSEIGNEE',
    tauxAvancement: chantier.tauxAvancement,
    dateQualitative: chantier.dateQualitative ? `(${formaterDate(chantier.dateQualitative, 'MM/YYYY')})` : '',
    dateQuantitative: chantier.dateQuantitative ? `(${formaterDate(chantier.dateQuantitative, 'MM/YYYY')})` : '',
    ministereIcone: chantier.ministerePorteur.icone,
  }
);
