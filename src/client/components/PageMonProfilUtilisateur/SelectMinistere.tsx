import { Controller } from "react-hook-form";
import { SelecteurNew } from "@/components/_commons/SelecteurNew/SelecteurNew";
import { referentielServices } from "@/client/constants/referentiel-services";
import { useMonProfilForm } from "./form";

const options = referentielServices.ministeres.map((ministere) => ({
  valeur: ministere.slug,
  libelle: ministere.libelle,
}));

export const SelectMinistere = () => {
  const form = useMonProfilForm();

  return (
    <Controller
      control={form.control}
      name="ministere"
      render={({ field, fieldState }) => (
        <SelecteurNew
          htmlName="ministere"
          libelle="Ministère"
          isRequired
          className="fr-input-group"
          triggerClassName="w-full"
          options={options}
          valeurSelectionnee={field.value || undefined}
          erreurMessage={fieldState.error?.message}
          onChange={(nouvelleValeur) => {
            field.onChange(nouvelleValeur);
            form.setValue("service", "", {
              shouldDirty: true,
              shouldTouch: true,
            });
            form.setValue("serviceAutre", null, {
              shouldDirty: true,
              shouldTouch: true,
            });
          }}
        />
      )}
    />
  );
};
