import { DétailsIndicateur } from "@/shared/indicateur/DetailsIndicateur.interface";

export type InformationsIndicateurs = {
  territoireNom: string;
  code: string;
  données: DétailsIndicateur;
}[];
