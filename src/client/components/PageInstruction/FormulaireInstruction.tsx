import { $Enums } from "@prisma/client";
import { pageInstruction } from "@/components/PageInstruction/PageInstructionServerSideContext";
import { TableauEvaluation } from "@/components/Evaluation/TableauEvaluation";
import { useEnregistrerBrouillonInstruction } from "./useEnregistrerBrouillonInstruction";

export const FormulaireInstruction = () => {
  const { rattachements, criteres } =
    pageInstruction.useServerSidePropsContext();
  const enregistrerBrouillon = useEnregistrerBrouillonInstruction();

  return (
    <TableauEvaluation
      criteres={criteres}
      etape={$Enums.etape_evaluation_enum.INSTRUCTION}
      onEnregistrer={enregistrerBrouillon}
      rattachements={rattachements}
      titre="Espace d'instruction"
    />
  );
};
