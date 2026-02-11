import { SelecteurNew } from "@/components/_commons/SelecteurNew/SelecteurNew";
import { referentielServices } from "@/client/constants/referentiel-services";
import { useMonProfilForm } from "./form";

const options = referentielServices.ministeres.map((ministere) => ({
  valeur: ministere.slug,
  libelle: ministere.libelle,
}));

export default function SelectMinistere() {
  const { watch, setValue, formState } = useMonProfilForm();
  const ministere = watch("ministere");

  return (
    <SelecteurNew
      htmlName="ministere"
      libelle="Ministère"
      triggerClassName="w-full"
      options={options}
      valeurSelectionnee={ministere ?? undefined}
      erreurMessage={formState.errors.ministere?.message}
      onChange={(nouvelleValeur) => {
        setValue("ministere", nouvelleValeur);
        setValue("service", null);
        setValue("serviceAutre", null);
      }}
    />
  );
}
