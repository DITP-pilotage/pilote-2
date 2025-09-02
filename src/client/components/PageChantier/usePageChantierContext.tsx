import { createContext, PropsWithChildren, useContext } from "react";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import { DétailTerritoire } from "@/server/domain/territoire/Territoire.interface";
import { DatajobsExecution } from "@/server/datajobs-execution/DatajobsExecution";

type UsePageChantierContext = {
  chantier: Chantier;
  indicateur: Indicateur;
  territoireCode: string;
  territoireSélectionné: DétailTerritoire;
  datajobsExecution: DatajobsExecution;
};

const context = createContext<UsePageChantierContext | null>(null);

export const usePageChantierContext = () => {
  const contextValues = useContext(context);

  if (!contextValues) {
    throw new Error("usePageChantier must be used within the context!");
  }

  return contextValues;
};

export const PageChantierProvider = ({
  children,
  ...props
}: PropsWithChildren<UsePageChantierContext>) => {
  return <context.Provider value={props}>{children}</context.Provider>;
};
