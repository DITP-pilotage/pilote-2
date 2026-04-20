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
        <span className="text-xs block mb-1 italic font-medium">
          Résultat / 100
        </span>
        <span className="font-medium text-sm">{note ?? "-"}</span>
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
