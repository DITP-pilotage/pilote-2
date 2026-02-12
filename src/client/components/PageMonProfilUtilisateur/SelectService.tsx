import { Controller } from "react-hook-form";
import {
  SelecteurNew,
  SelecteurNewOptionGroup,
} from "@/components/_commons/SelecteurNew/SelecteurNew";
import { referentielServices } from "@/client/constants/referentiel-services";
import { useMonProfilForm } from "./form";

const groupedOptions: SelecteurNewOptionGroup<string>[] =
  referentielServices.perimetresMinisteriels.map((perimetre) => ({
    libelle: perimetre.libelle,
    valeur: perimetre.slug,
    options: perimetre.services.map((service) => ({
      libelle: service.libelle,
      valeur: service.slug,
    })),
  }));

export const SelectService = () => {
  const form = useMonProfilForm();
  const service = form.watch("service");

  const serviceError = form.formState.errors.service?.message;

  return (
    <Controller
      control={form.control}
      name="service"
      render={() => (
        <SelecteurNew
          htmlName="service"
          libelle="Service"
          className="fr-input-group"
          triggerClassName="w-full"
          options={groupedOptions}
          isRequired
          valeurSelectionnee={service}
          erreurMessage={serviceError}
          placeholder="Sélectionner..."
          onChange={(serviceSlug) => {
            form.setValue("service", serviceSlug, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });

            if (serviceSlug !== "autre") {
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
