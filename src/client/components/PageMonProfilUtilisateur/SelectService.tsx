import { Controller } from "react-hook-form";
import {
  SelecteurNew,
  SelecteurNewOptionGroup,
} from "@/components/_commons/SelecteurNew/SelecteurNew";
import { referentielServices } from "@/client/constants/referentiel-services";
import { useMonProfilForm } from "./form";
import {
  buildCompositeServiceSlug,
  parseCompositeServiceSlug,
  buildValeurSelectionnee,
} from "@/client/utils/service-slug";

const groupedOptions: SelecteurNewOptionGroup<string>[] =
  referentielServices.perimetresMinisteriels.map((perimetre) => ({
    libelle: perimetre.libelle,
    valeur: perimetre.slug,
    options: perimetre.services.map((service) => ({
      libelle: service.libelle,
      valeur: buildCompositeServiceSlug(perimetre.slug, service.slug),
    })),
  }));

export const SelectService = () => {
  const form = useMonProfilForm();
  const service = form.watch("service");
  const perimetreMinisteriel = form.watch("perimetreMinisteriel");

  const valeurSelectionnee = buildValeurSelectionnee(
    perimetreMinisteriel,
    service,
  );

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
          placeholderRecherche="Rechercher un service ou un périmètre ministériel"
          options={groupedOptions}
          isRequired
          valeurSelectionnee={valeurSelectionnee}
          erreurMessage={serviceError}
          placeholder="Sélectionner..."
          onChange={(compositeSlug, group) => {
            const serviceSlug = parseCompositeServiceSlug(compositeSlug);

            form.setValue("service", serviceSlug, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });

            form.setValue("perimetreMinisteriel", group?.valeur ?? "", {
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
