import { ChantierFicheTerritoriale } from '@/server/fiche-territoriale/domain/ChantierFicheTerritoriale';
import { formaterDate } from '@/client/utils/date/date';

interface IndicateurFicheTerritorialeContrat {
  tauxAvancementNational: number;
  tauxAvancement: number;
  valeurActuelle: number;
  valeurCible: number;
  nom: string
}

export interface ChantierFicheTerritorialeContrat {
  nom: string;
  ministereIcone: string;
  meteo: 'ORAGE' | 'NUAGE' | 'COUVERT' | 'SOLEIL' | 'NON_NECESSAIRE' | 'NON_RENSEIGNEE';
  dateQualitative: string;
  tauxAvancement: number | null;
  dateQuantitative: string;
  indicateurs: IndicateurFicheTerritorialeContrat[];
}

export const presenterEnChantierFicheTerritorialeContrat = (chantier: ChantierFicheTerritoriale): ChantierFicheTerritorialeContrat => (
  {
    nom: chantier.nom,
    meteo: chantier.meteo || 'NON_RENSEIGNEE',
    tauxAvancement: chantier.tauxAvancement,
    dateQualitative: chantier.dateQualitative ? `(${formaterDate(chantier.dateQualitative, 'MM/YYYY')})` : '',
    dateQuantitative: chantier.dateQuantitative ? `(${formaterDate(chantier.dateQuantitative, 'MM/YYYY')})` : '',
    ministereIcone: chantier.ministerePorteur.icone,
    indicateurs: [
      {
        nom: 'Nombre de places d\'hébergement et en logement adapté dédiées aux femmes victimes de violences',
        valeurActuelle: 10.03,
        valeurCible: 21.18,
        tauxAvancement: 40.53,
        tauxAvancementNational: 50.12,
      }, {
        nom: 'Nombre de zones couvertes par les pylônes 4G du New Deal Mobile mis en service',
        valeurActuelle: 32.03,
        valeurCible: 53.18,
        tauxAvancement: 12.53,
        tauxAvancementNational: 34.12,
      },
    ],
  }
);
