import { Controller, useFormContext } from "react-hook-form";
import { SelecteurService } from "@/components/_commons/SelecteurService/SelecteurService";
import { UtilisateurFormInputs } from "@/client/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire.interface";

export const SelectServiceAdmin = () => {
  const form = useFormContext<UtilisateurFormInputs>();

  return (
    <Controller
      control={form.control}
      name="service"
      render={() => (
        <SelecteurService
          service={form.watch("service")}
          perimetreMinisteriel={form.watch("perimetreMinisteriel")}
          erreurMessage={form.formState.errors.service?.message}
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
