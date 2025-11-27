import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
} from "react";
import { Critere } from "@/server/evaluation/queries/types";

const criteresContext = createContext<Critere[]>([]);

export const useCriteres = () => useContext(criteresContext);

export const useGetCritere = () => {
  const criteres = useCriteres();
  return useCallback(
    (critereId: string) => {
      const critereCible = criteres.find((critere) => critere.id === critereId);
      if (critereCible == null)
        throw new Error(`Critere introuvable: ${critereId}`);
      return critereCible;
    },
    [criteres],
  );
};

export const CriteresProvider = ({
  criteres,
  children,
}: PropsWithChildren<{ criteres: Critere[] }>) => {
  return (
    <criteresContext.Provider value={criteres}>
      {children}
    </criteresContext.Provider>
  );
};
