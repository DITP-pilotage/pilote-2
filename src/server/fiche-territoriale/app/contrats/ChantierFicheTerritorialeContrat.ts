import { ChantierFicheTerritoriale } from '@/server/fiche-territoriale/domain/ChantierFicheTerritoriale';
import { formaterDate } from '@/client/utils/date/date';
import { IndicateurFicheTerritoriale } from '@/server/fiche-territoriale/domain/IndicateurFicheTerritoriale';

interface IndicateurFicheTerritorialeContrat {
  tauxAvancementNational: number | null;
  tauxAvancement: number | null;
  valeurActuelle: number | null;
  valeurCible: number | null;
  nom: string
  uniteMesure: string | null
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

const presenterEnIndicateurFicheTerritorialeContrat = (indicateur: IndicateurFicheTerritoriale): IndicateurFicheTerritorialeContrat => ({
  nom: indicateur.nom,
  valeurActuelle: indicateur.valeurActuelle,
  valeurCible: indicateur.valeurCible,
  tauxAvancement: indicateur.tauxAvancement,
  tauxAvancementNational: indicateur.tauxAvancementNational,
  uniteMesure: indicateur.uniteMesure,
});

export const presenterEnChantierFicheTerritorialeContrat = (chantier: ChantierFicheTerritoriale): ChantierFicheTerritorialeContrat => (
  {
    nom: chantier.nom,
    meteo: chantier.meteo || 'NON_RENSEIGNEE',
    tauxAvancement: chantier.tauxAvancement,
    dateQualitative: chantier.dateQualitative ? `(${formaterDate(chantier.dateQualitative, 'MM/YYYY')})` : '',
    dateQuantitative: chantier.dateQuantitative ? `(${formaterDate(chantier.dateQuantitative, 'MM/YYYY')})` : '',
    ministereIcone: chantier.ministerePorteur.icone,
    indicateurs: chantier.indicateurs.map(presenterEnIndicateurFicheTerritorialeContrat),
  }
);
