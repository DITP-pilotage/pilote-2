import { FunctionComponent } from "react";
import { Controller } from "react-hook-form";
import {
  SelectField,
  type SelectFieldOption,
} from "@/components/shared/SelectField";
import { useFormParametrageSource } from "./form";

interface SelectMetadataProps {
  name:
    | `metadataList.${number}.dataType`
    | `metadataList.${number}.editBoxType`
    | `metadataList.${number}.defaultValue`;
  label: string;
  options: SelectFieldOption<string>[];
  required?: boolean;
  className?: string;
}

export const SelectMetadata: FunctionComponent<SelectMetadataProps> = ({
  name,
  label,
  options,
  required = false,
  className,
}) => {
  const form = useFormParametrageSource();

  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <SelectField
          className={className}
          errorMessage={fieldState.error?.message}
          label={label}
          name={name}
          onChange={field.onChange}
          options={options}
          required={required}
          value={field.value?.toString() ?? ""}
        />
      )}
    />
  );
};
