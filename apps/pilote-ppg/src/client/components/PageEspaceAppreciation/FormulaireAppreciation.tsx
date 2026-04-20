import { $Enums } from "@prisma/client";
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
      etape={$Enums.etape_evaluation_enum.CONSOLIDATION}
      onEnregistrer={enregisterBrouillon}
      rattachements={rattachements}
      titre="Espace d'appréciation"
    />
  );
};
