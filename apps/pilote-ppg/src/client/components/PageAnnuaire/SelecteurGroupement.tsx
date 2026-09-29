import { useId } from "react";
import { ButtonTag } from "@/components/_commons/ButtonTag";

export function SelecteurGroupement<T extends string>({
  options,
  valeur,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  valeur: T;
  onChange: (valeur: T) => void;
}) {
  const libelleId = useId();
  return (
    <div
      aria-labelledby={libelleId}
      className="flex items-center gap-2 text-sm"
      role="group"
    >
      <span className="font-semibold" id={libelleId}>
        Grouper par :
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {options.map((option) => (
          <ButtonTag
            aria-pressed={option.value === valeur}
            isActive={option.value === valeur}
            key={option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </ButtonTag>
        ))}
      </div>
    </div>
  );
}
