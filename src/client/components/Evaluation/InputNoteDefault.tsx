import { ReactNode } from "react";
import { FormNoteName } from "./form";
import { InputNoteEvaluation } from "./InputNoteEvaluation";

export const InputNoteDefault = ({
  name,
  label,
  mode,
  note,
  onAutosave,
}: {
  name: FormNoteName;
  label: ReactNode;
  mode: "editable" | "bloque" | "lecture-seule";
  note?: number | null;
  onAutosave?: () => void;
}) => {
  if (mode === "lecture-seule") {
    return (
      <div className="flex flex-col mb-2">
        <strong className="text-sm block mb-1 italic">Résultat / 100</strong>
        <span className="font-medium">{note ?? "-"}</span>
      </div>
    );
  }

  return (
    <InputNoteEvaluation
      disabled={mode === "bloque"}
      label={label}
      name={name}
      onAutosave={onAutosave}
    />
  );
};
