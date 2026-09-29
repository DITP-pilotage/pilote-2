import { Controller } from "react-hook-form";
import { SelecteurService } from "@/components/_commons/SelecteurService/SelecteurService";
import { useMonProfilForm } from "./form";

export const SelectService = () => {
  const form = useMonProfilForm();

  return (
    <Controller
      control={form.control}
      name="service"
      render={() => (
        <SelecteurService
          service={form.watch("service")}
          perimetreMinisteriel={form.watch("perimetreMinisteriel")}
          erreurMessage={form.formState.errors.service?.message}
          isRequired
          onChange={({ service, perimetreMinisteriel }) => {
            form.setValue("service", service, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });

            form.setValue("perimetreMinisteriel", perimetreMinisteriel, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });

            if (service !== "autre") {
              form.setValue("serviceAutre", null, {
                shouldDirty: true,
                shouldTouch: true,
              });
            }
          }}
        />
      )}
    />
  );
};
