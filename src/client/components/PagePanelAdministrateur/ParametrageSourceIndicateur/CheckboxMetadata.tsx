import { FunctionComponent } from "react";
import { Controller } from "react-hook-form";
import { useFormParametrageSource } from "./form";

interface CheckboxMetadataProps {
  name:
    | `metadataList.${number}.estVisible`
    | `metadataList.${number}.estEditable`
    | `metadataList.${number}.estObligatoire`
    | `metadataList.${number}.doitAfficherLaDescription`;
  label: string;
}

export const CheckboxMetadata: FunctionComponent<CheckboxMetadataProps> = ({
  name,
  label,
}) => {
  const form = useFormParametrageSource();

  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-purple-200 transition-all gap-2">
          <input
            checked={field.value as boolean}
            className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
            type="checkbox"
            {...field}
            value={undefined}
          />
          <span className="text-sm font-semibold text-gray-700">{label}</span>
        </label>
      )}
    />
  );
};
