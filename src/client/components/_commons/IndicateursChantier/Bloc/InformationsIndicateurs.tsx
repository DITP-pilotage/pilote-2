import { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";

export type InformationsIndicateurs = {
  territoireNom: string;
  code: string;
  données: DétailsIndicateur;
}[];
