import { useController } from "react-hook-form";
import { clsxm } from "@/utils/clsxm";
import {
  ERROR_GROUP_CLASSES,
  ERROR_TEXT_CLASSES,
} from "@/components/shared/fieldTextClasses";
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
    <div className={clsxm("relative", fieldState.error && ERROR_GROUP_CLASSES)}>
      <p className="text-sm mb-2">Météo</p>
      <SelecteurMeteo
        onBlur={field.onBlur}
        onChange={field.onChange}
        ref={field.ref}
        value={field.value}
      />
      {/* Hauteur réservée : l'apparition de l'erreur ne décale pas la mise en page. */}
      <div className="min-h-5 mt-1">
        {fieldState.error ? (
          <p className={clsxm(ERROR_TEXT_CLASSES, "mt-0")}>
            {fieldState.error.message}
          </p>
        ) : null}
      </div>
    </div>
  );
};
