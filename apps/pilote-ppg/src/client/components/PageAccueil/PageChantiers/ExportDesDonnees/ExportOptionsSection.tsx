import { ReactNode } from "react";
import { CheckboxField } from "@/components/shared/Checkbox";
import { clsxm } from "@/utils/clsxm";

export interface ExportOption {
  value: string;
  label: ReactNode;
  detailedLabel?: ReactNode;
  details?: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
}

interface ExportOptionsSectionProps {
  title: string;
  options: ExportOption[];
  selectedOptions: string[];
  showDetails?: boolean;
  onToggle?: (value: string) => void;
  separator?: boolean;
  labelClassName?: string;
  className?: string;
}

export const ExportOptionsSection = ({
  title,
  options,
  selectedOptions,
  showDetails = false,
  onToggle,
  separator = false,
  labelClassName,
  className,
}: ExportOptionsSectionProps) => (
  <div className={clsxm("mb-4 pr-2", separator && "border-b pb-4", className)}>
    <h3 className="mb-2 text-base underline">{title}</h3>
    <div className="flex flex-col gap-2">
      {options.map((option) => (
        <CheckboxField
          checked={selectedOptions.includes(option.value)}
          disabled={option.disabled}
          hint={option.hint}
          id={option.value}
          key={option.value}
          label={
            showDetails && option.detailedLabel
              ? option.detailedLabel
              : option.label
          }
          labelClassName={labelClassName}
          name={option.value}
          onCheckedChange={() => onToggle?.(option.value)}
        >
          {showDetails ? option.details : null}
        </CheckboxField>
      ))}
    </div>
  </div>
);
