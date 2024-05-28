import { AvancementsStatistiques } from '@/components/_commons/Avancements/Avancements.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export interface AvancementsStatistiquesAccueilContrat {
  global: {
    moyenne: number | null,
    médiane: number | null,
    minimum: number | null,
    maximum: number | null
  },
  annuel: {
    moyenne: number | null,
  }
}

export type RépartitionsMétéos = { ORAGE: number
  COUVERT: number
  NUAGE: number
  SOLEIL: number
};
export type AvancementsGlobauxTerritoriauxMoyensContrat = { valeur: number | null, codeInsee: CodeInsee, estApplicable: boolean | null }[];
export type AvancementsGlobauxRépartitionsMétéosContrat = { valeur: number | null, codeInsee: CodeInsee, estApplicable: boolean | null }[];

export const presenterEnAvancementsStatistiquesAccueilContrat = (avancementsStatistiques: AvancementsStatistiques): AvancementsStatistiquesAccueilContrat => {
  return {
    global: {
      moyenne: avancementsStatistiques?.global.moyenne || null,
      médiane: avancementsStatistiques?.global.médiane || null,
      minimum: avancementsStatistiques?.global.minimum || null,
      maximum: avancementsStatistiques?.global.maximum || null,
    },
    annuel: {
      moyenne: avancementsStatistiques?.annuel.moyenne || null,
    },
  };
};
