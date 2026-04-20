import { AvancementsStatistiques } from "@/components/_commons/Avancements/Avancements.interface";

export interface AvancementsStatistiquesAccueilContrat {
  médiane: number | null;
  minimum: number | null;
  maximum: number | null;
}

export type AvancementsGlobauxTerritoriauxMoyensContrat = {
  valeur: number | null;
  valeurAnnuelle: number | null;
  territoireCode: string;
  estApplicable: boolean | null;
}[];

export const presenterEnAvancementsStatistiquesAccueilContrat = (
  avancementsStatistiques: AvancementsStatistiques,
): AvancementsStatistiquesAccueilContrat => {
  return {
    médiane:
      avancementsStatistiques?.médiane != undefined
        ? avancementsStatistiques?.médiane
        : null,
    minimum:
      avancementsStatistiques?.minimum != undefined
        ? avancementsStatistiques?.minimum
        : null,
    maximum:
      avancementsStatistiques?.maximum != undefined
        ? avancementsStatistiques?.maximum
        : null,
  };
};
