import { SelecteurNew } from "@/components/_commons/SelecteurNew/SelecteurNew";
import { getServicesForMinistere } from "@/client/constants/referentiel-services";
import { useMonProfilForm } from "./form";

export const SelectService = () => {
  const form = useMonProfilForm();
  const ministere = form.watch("ministere");
  const service = form.watch("service");

  const options = ministere
    ? getServicesForMinistere(ministere).map((service) => ({
        valeur: service.slug,
        libelle: service.libelle,
      }))
    : [];

  return (
    <SelecteurNew
      key={ministere}
      htmlName="service"
      libelle="Service"
      className="fr-input-group"
      triggerClassName="w-full"
      options={options}
      isRequired
      valeurSelectionnee={service || undefined}
      erreurMessage={form.formState.errors.service?.message}
      disabled={!ministere}
      placeholder={
        ministere
          ? "Sélectionner..."
          : "Veuillez d'abord sélectionner un ministère"
      }
      onChange={(nouvelleValeur) => {
        form.setValue("service", nouvelleValeur);
        if (nouvelleValeur !== "autre") {
          form.setValue("serviceAutre", null);
        }
      }}
    />
  );
};
