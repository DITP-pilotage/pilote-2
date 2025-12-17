import { ReactNode } from "react";
import { useController } from "react-hook-form";
import { FormNoteName, useFormulaireEvaluation } from "./form";

const OPTIONS = [
  { id: "aplus", label: "A+", value: 100 },
  { id: "a", label: "A", value: 90 },
  { id: "b", label: "B", value: 70 },
  { id: "c", label: "C", value: 50 },
  { id: "d", label: "D", value: 30 },
  { id: "e", label: "E", value: 10 },
];

const noteToLabel = (note: number | null | undefined): string => {
  if (note == null) return "-";
  const option = OPTIONS.find(({ value }) => value === note);
  return option ? `${option.label} (${option.value}%)` : String(note);
};

export const InputNoteAppreciation = ({
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
  const form = useFormulaireEvaluation();
  const { field } = useController({
    control: form.control,
    name,
  });

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const parsedValue = parseInt(event.target.value, 10);
    const nouvelleNote = isNaN(parsedValue) ? null : parsedValue;
    field.onChange(nouvelleNote);
    onAutosave?.();
  };

  if (mode === "lecture-seule") {
    return (
      <div className="flex flex-col mb-2">
        <span className="text-xs block mb-1 italic font-medium">Résultat</span>
        <span className="font-medium text-sm">{noteToLabel(note)}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col mb-2">
      <label className="text-xs block mb-1 italic font-medium" htmlFor={name}>
        {label}
      </label>
      <select
        className="border !border-b-gray-600 !rounded-t !px-2 !py-1.5 text-center font-medium !bg-dsfr-contrast-grey "
        disabled={mode === "bloque"}
        id={name}
        onChange={handleChange}
        value={field.value ?? ""}
      >
        <option value="">-</option>
        {OPTIONS.map((option) => (
          <option key={option.id} value={option.value}>
            {option.label} ({option.value}%)
          </option>
        ))}
      </select>
    </div>
  );
};
