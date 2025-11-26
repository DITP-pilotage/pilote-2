import { createContext, useContext } from "react";
import { $Enums } from "@prisma/client";

const context = createContext<null | $Enums.etape_evaluation_enum>(null);

export const useEtapeEvaluation = () => {
  const etape = useContext(context);
  if (etape === null) {
    throw new Error(
      "useEtapeEvaluation doit être utilisé dans un contexte valide",
    );
  }
  return etape;
};

export const EtapeEvaluationProvider = context.Provider;
