import { TableauEvaluation } from "@/client/components/Evaluation/TableauEvaluation";
import { useTableauEvaluation } from "@/client/components/Evaluation/useTableauEvaluation";
import { pageConsolidation } from "./PageConsolidationServerSideContext";
import { useEnregistrerBrouillonConsolidation } from "./useEnregistrerBrouillonConsolidation";

export const FormulaireConsolidation = () => {
  const { rattachements, criteres } =
    pageConsolidation.useServerSidePropsContext();
  const { table } = useTableauEvaluation({ rattachements, criteres });
  const enregisterBrouillon = useEnregistrerBrouillonConsolidation();

  return (
    <TableauEvaluation
      onEnregistrer={enregisterBrouillon}
      rattachements={rattachements}
      table={table}
    />
  );
};
