import { FunctionComponent } from "react";
import { Controller } from "react-hook-form";
import { clsxm } from "@/utils/clsxm";
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
      <label
        className="block text-sm font-semibold text-gray-700 mb-2"
        htmlFor={name}
      >
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <Controller
        control={form.control}
        name={name}
        render={({ field, fieldState }) => {
          if (type === "textarea") {
            return (
              <textarea
                className={clsxm(
                  "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none !bg-white",
                  {
                    "!border-red-500": !!fieldState.error,
                  },
                )}
                id={name}
                placeholder={placeholder}
                rows={3}
                {...field}
                value={field.value?.toString() || ""}
              />
            );
          }

          return (
            <input
              className={clsxm(
                "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all !bg-white",
                {
                  "!border-red-500": !!fieldState.error,
                },
              )}
              id={name}
              placeholder={placeholder}
              type="text"
              {...field}
              value={field.value?.toString() || ""}
            />
          );
        }}
      />
    </div>
  );
};
