import { AvancementsStatistiques } from '@/components/_commons/Avancements/Avancements.interface';

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

export type AvancementsGlobauxTerritoriauxMoyensContrat = { valeur: number | null, valeurAnnuelle: number | null, territoireCode: string, estApplicable: boolean | null }[];

export const presenterEnAvancementsStatistiquesAccueilContrat = (avancementsStatistiques: AvancementsStatistiques): AvancementsStatistiquesAccueilContrat => {
  return {
    global: {
      moyenne: avancementsStatistiques?.global.moyenne != undefined ? avancementsStatistiques?.global.moyenne :  null,
      médiane: avancementsStatistiques?.global.médiane != undefined ? avancementsStatistiques?.global.médiane :  null,
      minimum: avancementsStatistiques?.global.minimum != undefined ? avancementsStatistiques?.global.minimum : null,
      maximum: avancementsStatistiques?.global.maximum != undefined ? avancementsStatistiques?.global.maximum : null,
    },
    annuel: {
      moyenne: avancementsStatistiques?.annuel.moyenne !== undefined ? avancementsStatistiques?.annuel.moyenne : null,
    },
  };
};
