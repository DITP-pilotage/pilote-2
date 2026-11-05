import { useId } from "react";
import { ButtonTag } from "@/components/_commons/ButtonTag";
import { clsxm } from "@/utils/clsxm";

export function SelecteurGroupement<T extends string>({
  options,
  valeur,
  onChange,
  className,
}: {
  options: readonly { value: T; label: string; aide?: string }[];
  valeur: T;
  onChange: (valeur: T) => void;
  className?: string;
}) {
  const libelleId = useId();
  const aide = options.find((option) => option.value === valeur)?.aide;
  return (
    <div
      aria-labelledby={libelleId}
      className={clsxm(
        "flex flex-wrap items-center gap-3 border-b border-dsfr-grey-925 bg-white px-6 py-3 text-sm",
        className,
      )}
      role="group"
    >
      <span className="font-medium text-dsfr-grey-200" id={libelleId}>
        Regrouper par
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
      {aide && <span className="text-dsfr-mention-grey">{aide}</span>}
    </div>
  );
}
