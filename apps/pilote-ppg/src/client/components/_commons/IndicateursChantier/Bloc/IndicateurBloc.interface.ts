import { DétailsIndicateur } from "@/shared/indicateur/DetailsIndicateur.interface";

export type IndicateurDetailsParTerritoire = {
  territoireNom: string;
  territoireCode: string;
  données: DétailsIndicateur;
};
