import { useFormulaireInstruction } from "@/components/PageInstruction/form";
import { InputNoteControlled } from "@/components/_commons/InputNoteControlled";

type FormNoteName =
  | `fichesEvaluation.${string}.objectifs.${string}.note`
  | `fichesEvaluation.${string}.criteres.${string}.note`;
type FormCommentaireName =
  | `fichesEvaluation.${string}.objectifs.${string}.commentaire`
  | `fichesEvaluation.${string}.criteres.${string}.commentaire`;

export const InputNoteInstruction = ({
  name,
  disabled = false,
}: {
  name: FormNoteName;
  disabled?: boolean;
}) => {
  const form = useFormulaireInstruction();
  const commentaireName = name.replace(".note", ".commentaire");

  return (
    <InputNoteControlled
      control={form.control}
      name={name}
      onChange={() => form.trigger(commentaireName as FormCommentaireName)}
      readOnly={disabled}
    />
  );
};
