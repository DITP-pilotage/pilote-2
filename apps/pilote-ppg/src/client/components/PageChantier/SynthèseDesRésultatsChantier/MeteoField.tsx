import { useController } from "react-hook-form";
import { clsxm } from "@/utils/clsxm";
import { SyntheseDesResultatsValues } from "./SyntheseDesResultatsValues";
import { SelecteurMeteo } from "./SelecteurMeteo";

export const MeteoField = () => {
  const { field, fieldState } = useController<
    SyntheseDesResultatsValues,
    "meteo"
  >({
    name: "meteo",
  });

  return (
    <div className={clsxm(fieldState.error && "fr-input-group--error")}>
      <p className="text-sm mb-2">Météo</p>
      <SelecteurMeteo
        onBlur={field.onBlur}
        onChange={field.onChange}
        ref={field.ref}
        value={field.value}
      />
      {fieldState.error ? (
        <p className="fr-error-text mt-1">{fieldState.error.message}</p>
      ) : null}
    </div>
  );
};
