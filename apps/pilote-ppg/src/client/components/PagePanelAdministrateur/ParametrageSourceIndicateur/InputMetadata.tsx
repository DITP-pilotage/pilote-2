import { FunctionComponent } from "react";
import {
  FormTextField,
  FormTextareaField,
} from "@/components/shared/FormTextField";
import { useFormParametrageSource } from "./form";

interface InputMetadataProps {
  name:
    | `metadataList.${number}.name`
    | `metadataList.${number}.alias`
    | `metadataList.${number}.description`
    | `metadataList.${number}.validationRegex`
    | `metadataList.${number}.validationRegexErrorMessage`
    | `metadataList.${number}.defaultValue`;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "textarea";
  className?: string;
}

export const InputMetadata: FunctionComponent<InputMetadataProps> = ({
  name,
  label,
  placeholder,
  required = false,
  type = "text",
  className,
}) => {
  const form = useFormParametrageSource();

  return (
    <div className={className}>
      {type === "textarea" ? (
        <FormTextareaField
          className="text-sm font-normal min-h-[38px]"
          control={form.control}
          label={label}
          name={name}
          placeholder={placeholder}
          required={required}
        />
      ) : (
        <FormTextField
          className="text-sm font-normal min-h-[38px]"
          control={form.control}
          label={label}
          name={name}
          placeholder={placeholder}
          required={required}
        />
      )}
    </div>
  );
};
