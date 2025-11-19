import { TableauEvaluation } from "@/client/components/Evaluation/TableauEvaluation";
import { pageEspaceAppreciation } from "./PageEspaceAppreciationServerSideContext";
import { useEnregistrerBrouillonConsolidation } from "./useEnregistrerBrouillonConsolidation";

export const FormulaireAppreciation = () => {
  const { rattachements, criteres } =
    pageEspaceAppreciation.useServerSidePropsContext();
  const enregisterBrouillon = useEnregistrerBrouillonConsolidation();

  return (
    <TableauEvaluation
      criteres={criteres}
      onEnregistrer={enregisterBrouillon}
      rattachements={rattachements}
    />
  );
};
