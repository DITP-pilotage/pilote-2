import { TableauEvaluation } from "@/client/components/Evaluation/TableauEvaluation";
import { pageConsolidation } from "./PageConsolidationServerSideContext";
import { useEnregistrerBrouillonConsolidation } from "./useEnregistrerBrouillonConsolidation";

export const FormulaireConsolidation = () => {
  const { rattachements, criteres } =
    pageConsolidation.useServerSidePropsContext();
  const enregisterBrouillon = useEnregistrerBrouillonConsolidation();

  return (
    <TableauEvaluation
      criteres={criteres}
      onEnregistrer={enregisterBrouillon}
      rattachements={rattachements}
    />
  );
};
