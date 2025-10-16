import { FunctionComponent, ReactNode } from "react";
import { Controller } from "react-hook-form";
import { clsxm } from "@/utils/clsxm";
import { useFormParametrageSource } from "./form";

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
            className={clsxm(
              "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all !bg-white",
              {
                "!border-red-500": !!fieldState.error,
              },
            )}
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
