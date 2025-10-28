import { pageInstruction } from "@/components/PageInstruction/PageInstructionServerSideContext";
import { TableauEvaluation } from "@/components/Evaluation/TableauEvaluation";
import { useTableauEvaluation } from "@/components/Evaluation/useTableauEvaluation";
import { useEnregistrerBrouillonInstruction } from "./useEnregistrerBrouillonInstruction";

export const FormulaireInstruction = () => {
  const { rattachements, criteres } =
    pageInstruction.useServerSidePropsContext();
  const { table } = useTableauEvaluation({ rattachements, criteres });
  const enregistrerBrouillon = useEnregistrerBrouillonInstruction();

  return (
    <TableauEvaluation
      onEnregistrer={enregistrerBrouillon}
      rattachements={rattachements}
      table={table}
    />
  );
};
