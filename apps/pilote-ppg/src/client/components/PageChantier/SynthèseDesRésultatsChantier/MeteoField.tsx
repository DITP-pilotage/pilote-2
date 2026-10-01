import { useController } from "react-hook-form";
import { SyntheseDesResultatsValues } from "./SyntheseDesResultatsValues";
import { SelecteurMeteo } from "./SelecteurMeteo";

export const MeteoField = () => {
  const { field } = useController<SyntheseDesResultatsValues, "meteo">({
    name: "meteo",
  });

  return (
    <>
      <p className="text-sm mb-2">Météo</p>
      <SelecteurMeteo
        onBlur={field.onBlur}
        onChange={field.onChange}
        ref={field.ref}
        value={field.value}
      />
    </>
  );
};
