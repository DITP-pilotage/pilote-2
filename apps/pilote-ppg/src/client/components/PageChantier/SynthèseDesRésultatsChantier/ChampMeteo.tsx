import { useController } from "react-hook-form";
import { ValeursSyntheseDesResultats } from "./ValeursSyntheseDesResultats";
import { SelecteurMeteo } from "./SelecteurMeteo";

export const ChampMeteo = () => {
  const { field } = useController<ValeursSyntheseDesResultats, "meteo">({
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
