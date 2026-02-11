import { Controller } from "react-hook-form";
import { SelecteurNew } from "@/components/_commons/SelecteurNew/SelecteurNew";
import { getServicesForMinistere } from "@/client/constants/referentiel-services";
import { useMonProfilForm } from "./form";

export const SelectService = () => {
  const form = useMonProfilForm();
  const ministere = form.watch("ministere");

  const options = ministere
    ? getServicesForMinistere(ministere).map((service) => ({
        valeur: service.slug,
        libelle: service.libelle,
      }))
    : [];

  return (
    <Controller
      control={form.control}
      name="service"
      render={({ field, fieldState }) => (
        <SelecteurNew
          key={ministere}
          htmlName="service"
          libelle="Service"
          className="fr-input-group"
          triggerClassName="w-full"
          options={options}
          isRequired
          valeurSelectionnee={field.value || undefined}
          erreurMessage={fieldState.error?.message}
          disabled={!ministere}
          placeholder={
            ministere
              ? "Sélectionner..."
              : "Veuillez d'abord sélectionner un ministère"
          }
          onChange={(nouvelleValeur) => {
            field.onChange(nouvelleValeur);
            if (nouvelleValeur !== "autre") {
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
