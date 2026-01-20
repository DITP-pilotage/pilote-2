import { FunctionComponent, ReactNode } from "react";
import { Controller } from "react-hook-form";
import { clsxm } from "@/utils/clsxm";
import { useFormParametrageSource } from "./form";
import "@gouvfr/dsfr/dist/component/select/select.min.css";

interface SelectMetadataProps {
  name:
    | `metadataList.${number}.dataType`
    | `metadataList.${number}.editBoxType`;
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export const SelectMetadata: FunctionComponent<SelectMetadataProps> = ({
  name,
  label,
  required = false,
  children,
  className,
}) => {
  const form = useFormParametrageSource();

  return (
    <div className={className}>
      <label
        className="block text-sm font-semibold text-gray-700 mb-2"
        htmlFor={name}
      >
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <Controller
        control={form.control}
        name={name}
        render={({ field, fieldState }) => (
          <select
            className={clsxm("fr-select fr-mt-1w", {
              "!border-red-500": !!fieldState.error,
              "fr-select--error": !!fieldState.error,
            })}
            id={name}
            {...field}
            value={field.value?.toString() || ""}
          >
            {children}
          </select>
        )}
      />
    </div>
  );
};
