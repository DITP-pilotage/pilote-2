import { SelecteurNew } from "@/components/_commons/SelecteurNew/SelecteurNew";
import { referentielServices } from "@/client/constants/referentiel-services";
import { useMonProfilForm } from "./form";

const options = referentielServices.ministeres.map((ministere) => ({
  valeur: ministere.slug,
  libelle: ministere.libelle,
}));

export const SelectMinistere = () => {
  const form = useMonProfilForm();
  const ministere = form.watch("ministere");

  return (
    <SelecteurNew
      htmlName="ministere"
      libelle="Ministère"
      isRequired
      className="fr-input-group"
      triggerClassName="w-full"
      options={options}
      valeurSelectionnee={ministere || undefined}
      erreurMessage={form.formState.errors.ministere?.message}
      onChange={(nouvelleValeur) => {
        form.setValue("ministere", nouvelleValeur);
        form.setValue("service", "");
        form.setValue("serviceAutre", null);
      }}
    />
  );
};
