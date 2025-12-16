import { ReactNode } from "react";
import { useFormulaireEvaluation } from "@/components/Evaluation/form";
import { InputNoteControlled } from "@/components/_commons/InputNoteControlled";
import { useAutosave } from "@/components/Evaluation/useAutosave";

type FormNoteName =
  | `fichesEvaluation.${string}.objectifs.${string}.note`
  | `fichesEvaluation.${string}.criteres.${string}.note`;

export const InputNoteEvaluation = ({
  name,
  label,
  disabled = false,
  onAutosave,
  onFocus,
}: {
  name: FormNoteName;
  disabled?: boolean;
  label: ReactNode;
  onAutosave?: () => void;
  onFocus?: () => void;
}) => {
  const form = useFormulaireEvaluation();
  const autosave = useAutosave({ onAutosave });

  return (
    <InputNoteControlled
      control={form.control}
      label={label}
      name={name}
      {...autosave}
      onChange={() => autosave.onChange()}
      onFocus={onFocus}
      readOnly={disabled}
    />
  );
};
