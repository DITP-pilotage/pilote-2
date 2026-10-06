import { createContext, PropsWithChildren, useContext } from "react";
import { Chantier } from "@/shared/chantier/Chantier.interface";
import { Indicateur } from "@/shared/indicateur/Indicateur.interface";
import { DétailTerritoire } from "@/shared/territoire/Territoire.interface";
import { DatajobsExecution } from "@/server/datajobs-execution/DatajobsExecution";
import {
  DétailsIndicateur,
  DétailsIndicateurs,
} from "@/shared/indicateur/DetailsIndicateur.interface";
type UseBlocIndicateurContext = {
  chantier: Chantier;
  indicateur: Indicateur;
  territoireCode: string;
  jalon: number;
  territoireSélectionné: DétailTerritoire;
  datajobsExecution: DatajobsExecution;
  détailsIndicateurs: DétailsIndicateurs;
  detailIndicateurDuTerritoire: DétailsIndicateur;
};

const context = createContext<UseBlocIndicateurContext | null>(null);

export const useBlocIndicateurContext = () => {
  const contextValues = useContext(context);

  if (!contextValues) {
    throw new Error(
      "useBlocIndicateurContext must be used within the context!",
    );
  }

  return contextValues;
};

export const BlocIndicateurProvider = ({
  children,
  ...props
}: PropsWithChildren<UseBlocIndicateurContext>) => {
  return <context.Provider value={props}>{children}</context.Provider>;
};
