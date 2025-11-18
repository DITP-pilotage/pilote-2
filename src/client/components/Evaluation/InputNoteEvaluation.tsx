import { useFormulaireEvaluation } from "@/components/Evaluation/form";
import { InputNoteControlled } from "@/components/_commons/InputNoteControlled";
import { useAutosave } from "@/components/Evaluation/useAutosave";

type FormNoteName =
  | `fichesEvaluation.${string}.objectifs.${string}.note`
  | `fichesEvaluation.${string}.criteres.${string}.note`;
type FormCommentaireName =
  | `fichesEvaluation.${string}.objectifs.${string}.commentaire`
  | `fichesEvaluation.${string}.criteres.${string}.commentaire`;

export const InputNoteEvaluation = ({
  name,
  disabled = false,
  onAutosave,
}: {
  name: FormNoteName;
  disabled?: boolean;
  onAutosave?: () => void;
}) => {
  const form = useFormulaireEvaluation();
  const commentaireName = name.replace(".note", ".commentaire");
  const autosave = useAutosave({ onAutosave });

  return (
    <InputNoteControlled
      control={form.control}
      name={name}
      {...autosave}
      onChange={async () => {
        await form.trigger(commentaireName as FormCommentaireName);
        autosave.onChange();
      }}
      readOnly={disabled}
    />
  );
};
