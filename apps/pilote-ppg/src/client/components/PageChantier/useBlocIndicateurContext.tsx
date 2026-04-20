import { createContext, PropsWithChildren, useContext } from "react";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import { DétailTerritoire } from "@/server/domain/territoire/Territoire.interface";
import { DatajobsExecution } from "@/server/datajobs-execution/DatajobsExecution";
import {
  DétailsIndicateur,
  DétailsIndicateurs,
} from "@/server/domain/indicateur/DétailsIndicateur.interface";
import { configurationFeatureFlip } from "@/config";

type UseBlocIndicateurContext = {
  chantier: Chantier;
  indicateur: Indicateur;
  territoireCode: string;
  jalon: number;
  territoireSélectionné: DétailTerritoire;
  datajobsExecution: DatajobsExecution;
  détailsIndicateurs: DétailsIndicateurs;
  detailIndicateurDuTerritoire: DétailsIndicateur;
  configurationFeatureFlipping: ReturnType<typeof configurationFeatureFlip>;
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
