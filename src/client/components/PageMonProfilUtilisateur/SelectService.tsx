import { SelecteurNew } from "@/components/_commons/SelecteurNew/SelecteurNew";
import { getServicesForMinistere } from "@/client/constants/referentiel-services";
import { useMonProfilForm } from "./form";

export const SelectService = () => {
  const { watch, setValue, formState } = useMonProfilForm();
  const ministere = watch("ministere");
  const service = watch("service");

  const options = ministere
    ? getServicesForMinistere(ministere).map((service) => ({
        valeur: service.slug,
        libelle: service.libelle,
      }))
    : [];

  return (
    <SelecteurNew
      htmlName="service"
      libelle="Service"
      className="fr-input-group"
      triggerClassName="w-full"
      options={options}
      isRequired
      valeurSelectionnee={service || undefined}
      erreurMessage={formState.errors.service?.message}
      disabled={!ministere}
      placeholder={
        ministere
          ? "Sélectionner..."
          : "Veuillez d'abord sélectionner un ministère"
      }
      onChange={(nouvelleValeur) => {
        setValue("service", nouvelleValeur);
        if (nouvelleValeur !== "autre") {
          setValue("serviceAutre", null);
        }
      }}
    />
  );
};
