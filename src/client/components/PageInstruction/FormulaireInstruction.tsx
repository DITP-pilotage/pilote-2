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
      onEnregistrer={enregistrerBrouillon}
      rattachements={rattachements}
    />
  );
};
