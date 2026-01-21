import { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";

export type IndicateurDetailsParTerritoire = {
  territoireNom: string;
  données: DétailsIndicateur;
};
