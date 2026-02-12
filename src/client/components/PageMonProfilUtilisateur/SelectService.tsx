import { Controller } from "react-hook-form";
import {
  SelecteurNew,
  SelecteurNewOptionGroup,
} from "@/components/_commons/SelecteurNew/SelecteurNew";
import { referentielServices } from "@/client/constants/referentiel-services";
import { useMonProfilForm } from "./form";

const groupedOptions: SelecteurNewOptionGroup<string>[] =
  referentielServices.ministeres.map((ministere) => ({
    libelle: ministere.libelle,
    valeur: ministere.slug,
    options: ministere.services.map((service) => ({
      libelle: service.libelle,
      valeur: `${ministere.slug}::${service.slug}`,
    })),
  }));

export const SelectService = () => {
  const form = useMonProfilForm();
  const ministere = form.watch("ministere");
  const service = form.watch("service");

  const valeurSelectionnee =
    ministere && service ? `${ministere}::${service}` : undefined;

  const ministereError = form.formState.errors.ministere?.message;
  const serviceError = form.formState.errors.service?.message;
  const erreurMessage = ministereError || serviceError;

  return (
    <Controller
      control={form.control}
      name="service"
      render={() => (
        <SelecteurNew
          htmlName="service"
          libelle="Ministère et service"
          className="fr-input-group"
          triggerClassName="w-full"
          options={groupedOptions}
          isRequired
          valeurSelectionnee={valeurSelectionnee}
          erreurMessage={erreurMessage}
          placeholder="Sélectionner..."
          onChange={(compoundValue, group) => {
            const [, serviceSlug] = compoundValue.split("::");
            const ministereSlug = group?.valeur || "";

            form.setValue("ministere", ministereSlug, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });

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
